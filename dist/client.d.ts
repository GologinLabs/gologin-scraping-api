import { BatchScrapeOptions, ScrapeDiagnostics, ScrapeJSONResult, ScrapeMarkdownResult, ScrapingApiOptions, ScrapeOptions, ScrapeResult, ScrapeTextResult } from "./types";
export declare class ScrapingApi {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly httpClient;
    constructor(options: ScrapingApiOptions);
    validateConfig(): void;
    getDefaultHeaders(): Record<string, string>;
    buildScrapeUrl(url: string): string;
    scrapeRaw(url: string, options?: ScrapeOptions): Promise<Response>;
    scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
    scrapeText(url: string, options?: ScrapeOptions): Promise<ScrapeTextResult>;
    scrapeMarkdown(url: string, options?: ScrapeOptions): Promise<ScrapeMarkdownResult>;
    scrapeJSON(url: string, options?: ScrapeOptions): Promise<ScrapeJSONResult>;
    batchScrape(urls: string[], options?: BatchScrapeOptions): Promise<ScrapeResult[]>;
    private assertValidTargetUrl;
    private toStatusError;
    private safeReadText;
    assessHTML(html: string, readableText?: string): {
        outcome: ScrapeResult["outcome"];
        outcomeReason?: string;
        nextActionHint?: ScrapeResult["nextActionHint"];
        diagnostics: ScrapeDiagnostics;
    };
}
export declare class GologinScrapingApiClient extends ScrapingApi {
}
export declare class WebUnlocker extends ScrapingApi {
}
export declare class GologinWebUnlockerClient extends ScrapingApi {
}
