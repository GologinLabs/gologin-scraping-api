export type WebUnlockerOptions = {
    apiKey: string;
    baseUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
};
export type GoLoginWebUnlockerClientOptions = WebUnlockerOptions;
export type ScrapeOptions = {
    timeoutMs?: number;
};
export type BatchScrapeOptions = ScrapeOptions & {
    concurrency?: number;
};
export type ScrapeResult = {
    success: true;
    url: string;
    content: string;
    contentType?: string | null;
    status?: number | null;
    headers?: Record<string, string>;
};
export type ScrapeTextResult = ScrapeResult & {
    text: string;
};
export type ScrapeMarkdownResult = ScrapeResult & {
    markdown: string;
};
export type ScrapeJSONData = {
    title?: string | null;
    description?: string | null;
    canonical?: string | null;
    meta: Record<string, string>;
    headings: string[];
    links: Array<{
        text: string;
        href: string;
    }>;
};
export type ScrapeJSONResult = ScrapeResult & {
    data: ScrapeJSONData;
};
export type HttpClientOptions = {
    timeoutMs: number;
    maxRetries: number;
};
