import { HttpClientOptions } from "./types";
type GetOptions = {
    headers?: Record<string, string>;
    timeoutMs?: number;
};
export declare class HttpClient {
    private readonly timeoutMs;
    private readonly maxRetries;
    constructor(options: HttpClientOptions);
    get(url: string, options?: GetOptions): Promise<Response>;
    private fetchWithTimeout;
    private shouldRetryResponse;
    private shouldRetryNetworkError;
    private waitBeforeRetry;
    private normalizeError;
}
export {};
