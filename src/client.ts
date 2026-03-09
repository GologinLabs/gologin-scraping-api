import {
  APIError,
  AuthenticationError,
  RateLimitError,
  WebUnlockerError
} from "./errors";
import { HttpClient } from "./http";
import {
  BatchScrapeOptions,
  ScrapeJSONResult,
  ScrapeMarkdownResult,
  WebUnlockerOptions,
  ScrapeOptions,
  ScrapeResult,
  ScrapeTextResult
} from "./types";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  headersToRecord,
  htmlToMarkdown,
  htmlToStructuredData,
  htmlToText,
  normalizeBaseUrl,
  truncate
} from "./utils";

export class WebUnlocker {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly httpClient: HttpClient;

  constructor(options: WebUnlockerOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

    this.validateConfig();

    this.httpClient = new HttpClient({
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries
    });
  }

  validateConfig(): void {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new WebUnlockerError("apiKey is required");
    }

    if (this.timeoutMs <= 0) {
      throw new WebUnlockerError("timeoutMs must be greater than 0");
    }

    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new WebUnlockerError("maxRetries must be an integer >= 0");
    }
  }

  getDefaultHeaders(): Record<string, string> {
    return {
      apikey: this.apiKey
    };
  }

  buildScrapeUrl(url: string): string {
    this.assertValidTargetUrl(url);

    const endpoint = new URL("/v1/scrape", this.baseUrl);
    endpoint.searchParams.set("url", url);
    return endpoint.toString();
  }

  async scrapeRaw(url: string, options: ScrapeOptions = {}): Promise<Response> {
    const requestUrl = this.buildScrapeUrl(url);
    return this.httpClient.get(requestUrl, {
      headers: this.getDefaultHeaders(),
      timeoutMs: options.timeoutMs
    });
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
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
      headers: headersToRecord(response.headers)
    };
  }

  async scrapeText(url: string, options: ScrapeOptions = {}): Promise<ScrapeTextResult> {
    const scraped = await this.scrape(url, options);

    return {
      ...scraped,
      text: htmlToText(scraped.content)
    };
  }

  async scrapeMarkdown(
    url: string,
    options: ScrapeOptions = {}
  ): Promise<ScrapeMarkdownResult> {
    const scraped = await this.scrape(url, options);

    return {
      ...scraped,
      markdown: htmlToMarkdown(scraped.content)
    };
  }

  async scrapeJSON(url: string, options: ScrapeOptions = {}): Promise<ScrapeJSONResult> {
    const scraped = await this.scrape(url, options);

    return {
      ...scraped,
      data: htmlToStructuredData(scraped.content)
    };
  }

  async batchScrape(
    urls: string[],
    options: BatchScrapeOptions = {}
  ): Promise<ScrapeResult[]> {
    if (!Array.isArray(urls) || urls.length === 0) {
      return [];
    }

    const concurrency = Math.max(1, Math.floor(options.concurrency ?? 3));
    const scrapeOptions: ScrapeOptions = { timeoutMs: options.timeoutMs };
    const results: ScrapeResult[] = new Array(urls.length);
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
      while (nextIndex < urls.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await this.scrape(urls[currentIndex], scrapeOptions);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () =>
      worker()
    );
    await Promise.all(workers);

    return results;
  }

  private assertValidTargetUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new WebUnlockerError("url is required");
    }

    try {
      new URL(url);
    } catch {
      throw new WebUnlockerError("url must be a valid absolute URL");
    }
  }

  private async toStatusError(response: Response, url: string): Promise<WebUnlockerError> {
    const body = await this.safeReadText(response);
    const details = body ? `: ${truncate(body)}` : "";
    const message = `HTTP ${response.status} ${response.statusText}${details}`;
    const context = { status: response.status, url, body: body || null };

    if (response.status === 401 || response.status === 403) {
      return new AuthenticationError(message, context);
    }

    if (response.status === 429) {
      return new RateLimitError(message, context);
    }

    if (response.status >= 500) {
      return new APIError(message, context);
    }

    return new APIError(message, context);
  }

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }
}

// Backward-compatible alias.
export class GoLoginWebUnlockerClient extends WebUnlocker {}
