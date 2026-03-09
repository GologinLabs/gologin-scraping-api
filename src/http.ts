import {
  NetworkError,
  TimeoutError,
  WebUnlockerError
} from "./errors";
import { HttpClientOptions } from "./types";
import { sleep } from "./utils";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const BASE_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 4_000;

type GetOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export class HttpClient {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options: HttpClientOptions) {
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
  }

  async get(url: string, options: GetOptions = {}): Promise<Response> {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            method: "GET",
            headers: options.headers
          },
          timeoutMs
        );

        if (this.shouldRetryResponse(response.status, attempt)) {
          await this.waitBeforeRetry(attempt);
          attempt += 1;
          continue;
        }

        return response;
      } catch (error) {
        const normalizedError = this.normalizeError(error, timeoutMs, url);

        if (
          normalizedError instanceof WebUnlockerError &&
          !(normalizedError instanceof NetworkError)
        ) {
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

    throw new NetworkError("Request failed after retries", { url });
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private shouldRetryResponse(status: number, attempt: number): boolean {
    return attempt < this.maxRetries && RETRYABLE_STATUS_CODES.has(status);
  }

  private shouldRetryNetworkError(error: unknown, attempt: number): boolean {
    return attempt < this.maxRetries && error instanceof NetworkError;
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const jitter = Math.floor(Math.random() * 100);
    const delayMs = Math.min(
      BASE_BACKOFF_MS * Math.pow(2, attempt) + jitter,
      MAX_BACKOFF_MS
    );

    await sleep(delayMs);
  }

  private normalizeError(error: unknown, timeoutMs: number, url: string): Error {
    if (error instanceof WebUnlockerError) {
      return error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      return new TimeoutError(`Request timed out after ${timeoutMs}ms`, {
        url,
        cause: error
      });
    }

    if (error instanceof Error) {
      return new NetworkError(`Network request failed: ${error.message}`, {
        url,
        cause: error
      });
    }

    return new NetworkError("Network request failed", { url, cause: error });
  }
}
