"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GologinSDKError = exports.WebUnlockerError = exports.NetworkError = exports.TimeoutError = exports.APIError = exports.RateLimitError = exports.AuthenticationError = exports.ScrapingApiError = void 0;
class ScrapingApiError extends Error {
    status;
    url;
    body;
    cause;
    constructor(message, context = {}) {
        super(message);
        this.name = "ScrapingApiError";
        this.status = context.status;
        this.url = context.url;
        this.body = context.body;
        this.cause = context.cause;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ScrapingApiError = ScrapingApiError;
exports.WebUnlockerError = ScrapingApiError;
class AuthenticationError extends ScrapingApiError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends ScrapingApiError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
class APIError extends ScrapingApiError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "APIError";
    }
}
exports.APIError = APIError;
class TimeoutError extends ScrapingApiError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
class NetworkError extends ScrapingApiError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "NetworkError";
    }
}
exports.NetworkError = NetworkError;
// Backward-compatible alias.
class GologinSDKError extends ScrapingApiError {
}
exports.GologinSDKError = GologinSDKError;
