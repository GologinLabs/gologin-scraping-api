"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GologinWebUnlockerClient = exports.WebUnlocker = void 0;
const errors_1 = require("./errors");
const http_1 = require("./http");
const utils_1 = require("./utils");
class WebUnlocker {
    apiKey;
    baseUrl;
    timeoutMs;
    maxRetries;
    httpClient;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = (0, utils_1.normalizeBaseUrl)(options.baseUrl ?? utils_1.DEFAULT_BASE_URL);
        this.timeoutMs = options.timeoutMs ?? utils_1.DEFAULT_TIMEOUT_MS;
        this.maxRetries = options.maxRetries ?? utils_1.DEFAULT_MAX_RETRIES;
        this.validateConfig();
        this.httpClient = new http_1.HttpClient({
            timeoutMs: this.timeoutMs,
            maxRetries: this.maxRetries
        });
    }
    validateConfig() {
        if (!this.apiKey || this.apiKey.trim().length === 0) {
            throw new errors_1.WebUnlockerError("apiKey is required");
        }
        if (this.timeoutMs <= 0) {
            throw new errors_1.WebUnlockerError("timeoutMs must be greater than 0");
        }
        if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
            throw new errors_1.WebUnlockerError("maxRetries must be an integer >= 0");
        }
    }
    getDefaultHeaders() {
        return {
            apikey: this.apiKey
        };
    }
    buildScrapeUrl(url) {
        this.assertValidTargetUrl(url);
        const endpoint = new URL("/v1/scrape", this.baseUrl);
        endpoint.searchParams.set("url", url);
        return endpoint.toString();
    }
    async scrapeRaw(url, options = {}) {
        const requestUrl = this.buildScrapeUrl(url);
        return this.httpClient.get(requestUrl, {
            headers: this.getDefaultHeaders(),
            timeoutMs: options.timeoutMs
        });
    }
    async scrape(url, options = {}) {
        const response = await this.scrapeRaw(url, options);
        if (!response.ok) {
            throw await this.toStatusError(response, url);
        }
        const content = await response.text();
        return {
            success: true,
            url,
            content,
            contentType: response.headers.get("content-type"),
            status: response.status,
            headers: (0, utils_1.headersToRecord)(response.headers)
        };
    }
    async scrapeText(url, options = {}) {
        const scraped = await this.scrape(url, options);
        return {
            ...scraped,
            text: (0, utils_1.htmlToText)(scraped.content)
        };
    }
    async scrapeMarkdown(url, options = {}) {
        const scraped = await this.scrape(url, options);
        return {
            ...scraped,
            markdown: (0, utils_1.htmlToMarkdown)(scraped.content)
        };
    }
    async scrapeJSON(url, options = {}) {
        const scraped = await this.scrape(url, options);
        return {
            ...scraped,
            data: (0, utils_1.htmlToStructuredData)(scraped.content)
        };
    }
    async batchScrape(urls, options = {}) {
        if (!Array.isArray(urls) || urls.length === 0) {
            return [];
        }
        const concurrency = Math.max(1, Math.floor(options.concurrency ?? 3));
        const scrapeOptions = { timeoutMs: options.timeoutMs };
        const results = new Array(urls.length);
        let nextIndex = 0;
        const worker = async () => {
            while (nextIndex < urls.length) {
                const currentIndex = nextIndex;
                nextIndex += 1;
                results[currentIndex] = await this.scrape(urls[currentIndex], scrapeOptions);
            }
        };
        const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
        await Promise.all(workers);
        return results;
    }
    assertValidTargetUrl(url) {
        if (!url || url.trim().length === 0) {
            throw new errors_1.WebUnlockerError("url is required");
        }
        try {
            new URL(url);
        }
        catch {
            throw new errors_1.WebUnlockerError("url must be a valid absolute URL");
        }
    }
    async toStatusError(response, url) {
        const body = await this.safeReadText(response);
        const details = body ? `: ${(0, utils_1.truncate)(body)}` : "";
        const message = `HTTP ${response.status} ${response.statusText}${details}`;
        const context = { status: response.status, url, body: body || null };
        if (response.status === 401 || response.status === 403) {
            return new errors_1.AuthenticationError(message, context);
        }
        if (response.status === 429) {
            return new errors_1.RateLimitError(message, context);
        }
        if (response.status >= 500) {
            return new errors_1.APIError(message, context);
        }
        return new errors_1.APIError(message, context);
    }
    async safeReadText(response) {
        try {
            return await response.text();
        }
        catch {
            return "";
        }
    }
}
exports.WebUnlocker = WebUnlocker;
// Backward-compatible alias.
class GologinWebUnlockerClient extends WebUnlocker {
}
exports.GologinWebUnlockerClient = GologinWebUnlockerClient;
