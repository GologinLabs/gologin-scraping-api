"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const BASE_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 4_000;
class HttpClient {
    timeoutMs;
    maxRetries;
    constructor(options) {
        this.timeoutMs = options.timeoutMs;
        this.maxRetries = options.maxRetries;
    }
    async get(url, options = {}) {
        const timeoutMs = options.timeoutMs ?? this.timeoutMs;
        let attempt = 0;
        while (attempt <= this.maxRetries) {
            try {
                const response = await this.fetchWithTimeout(url, {
                    method: "GET",
                    headers: options.headers
                }, timeoutMs);
                if (this.shouldRetryResponse(response.status, attempt)) {
                    await this.waitBeforeRetry(attempt);
                    attempt += 1;
                    continue;
                }
                return response;
            }
            catch (error) {
                const normalizedError = this.normalizeError(error, timeoutMs, url);
                if (normalizedError instanceof errors_1.ScrapingApiError &&
                    !(normalizedError instanceof errors_1.NetworkError)) {
                    throw normalizedError;
                }
                if (this.shouldRetryNetworkError(normalizedError, attempt)) {
                    await this.waitBeforeRetry(attempt);
                    attempt += 1;
                    continue;
                }
                throw normalizedError;
            }
        }
        throw new errors_1.NetworkError("Request failed after retries", { url });
    }
    async fetchWithTimeout(url, init, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...init, signal: controller.signal });
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    shouldRetryResponse(status, attempt) {
        return attempt < this.maxRetries && RETRYABLE_STATUS_CODES.has(status);
    }
    shouldRetryNetworkError(error, attempt) {
        return attempt < this.maxRetries && error instanceof errors_1.NetworkError;
    }
    async waitBeforeRetry(attempt) {
        const jitter = Math.floor(Math.random() * 100);
        const delayMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt) + jitter, MAX_BACKOFF_MS);
        await (0, utils_1.sleep)(delayMs);
    }
    normalizeError(error, timeoutMs, url) {
        if (error instanceof errors_1.ScrapingApiError) {
            return error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            return new errors_1.TimeoutError(`Request timed out after ${timeoutMs}ms`, {
                url,
                cause: error
            });
        }
        if (error instanceof Error) {
            return new errors_1.NetworkError(`Network request failed: ${error.message}`, {
                url,
                cause: error
            });
        }
        return new errors_1.NetworkError("Network request failed", { url, cause: error });
    }
}
exports.HttpClient = HttpClient;
