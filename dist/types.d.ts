export type WebUnlockerOptions = {
    apiKey: string;
    baseUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
};
export type PageOutcome = "ok" | "empty" | "incomplete" | "client_rendered_likely" | "authwall" | "challenge" | "blocked";
export type NextActionHint = "use_gologin_agent_browser" | "check_data_endpoints";
export type ScrapeDiagnostics = {
    contentLength: number;
    scriptCount: number;
    linkCount: number;
    headingCount: number;
    shellMarkersDetected: boolean;
};
export type GologinWebUnlockerClientOptions = WebUnlockerOptions;
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
    outcome?: PageOutcome;
    outcomeReason?: string;
    nextActionHint?: NextActionHint;
    diagnostics?: ScrapeDiagnostics;
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
