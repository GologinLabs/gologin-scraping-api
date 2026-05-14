export type SDKErrorContext = {
    status?: number;
    url?: string;
    body?: string | null;
    cause?: unknown;
};
export declare class ScrapingApiError extends Error {
    readonly status?: number;
    readonly url?: string;
    readonly body?: string | null;
    readonly cause?: unknown;
    constructor(message: string, context?: SDKErrorContext);
}
export declare class AuthenticationError extends ScrapingApiError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class RateLimitError extends ScrapingApiError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class APIError extends ScrapingApiError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class TimeoutError extends ScrapingApiError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class NetworkError extends ScrapingApiError {
    constructor(message: string, context?: SDKErrorContext);
}
export { ScrapingApiError as WebUnlockerError };
export declare class GologinSDKError extends ScrapingApiError {
}
