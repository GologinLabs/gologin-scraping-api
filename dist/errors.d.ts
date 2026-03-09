export type SDKErrorContext = {
    status?: number;
    url?: string;
    body?: string | null;
    cause?: unknown;
};
export declare class WebUnlockerError extends Error {
    readonly status?: number;
    readonly url?: string;
    readonly body?: string | null;
    readonly cause?: unknown;
    constructor(message: string, context?: SDKErrorContext);
}
export declare class AuthenticationError extends WebUnlockerError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class RateLimitError extends WebUnlockerError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class APIError extends WebUnlockerError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class TimeoutError extends WebUnlockerError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class NetworkError extends WebUnlockerError {
    constructor(message: string, context?: SDKErrorContext);
}
export declare class GologinSDKError extends WebUnlockerError {
}
