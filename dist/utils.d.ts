export declare const DEFAULT_BASE_URL = "https://parsing.webunlocker.gologin.com";
export declare const DEFAULT_TIMEOUT_MS = 15000;
export declare const DEFAULT_MAX_RETRIES = 2;
export declare function normalizeBaseUrl(baseUrl: string): string;
export declare function sleep(ms: number): Promise<void>;
export declare function headersToRecord(headers: Headers): Record<string, string>;
export declare function truncate(value: string, maxLength?: number): string;
export declare function htmlToText(html: string): string;
export declare function htmlToMarkdown(html: string): string;
export declare function htmlToStructuredData(html: string): {
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
