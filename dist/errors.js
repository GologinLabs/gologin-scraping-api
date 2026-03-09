"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GologinSDKError = exports.NetworkError = exports.TimeoutError = exports.APIError = exports.RateLimitError = exports.AuthenticationError = exports.WebUnlockerError = void 0;
class WebUnlockerError extends Error {
    status;
    url;
    body;
    cause;
    constructor(message, context = {}) {
        super(message);
        this.name = "WebUnlockerError";
        this.status = context.status;
        this.url = context.url;
        this.body = context.body;
        this.cause = context.cause;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.WebUnlockerError = WebUnlockerError;
class AuthenticationError extends WebUnlockerError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends WebUnlockerError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
class APIError extends WebUnlockerError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "APIError";
    }
}
exports.APIError = APIError;
class TimeoutError extends WebUnlockerError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
class NetworkError extends WebUnlockerError {
    constructor(message, context = {}) {
        super(message, context);
        this.name = "NetworkError";
    }
}
exports.NetworkError = NetworkError;
// Backward-compatible alias.
class GologinSDKError extends WebUnlockerError {
}
exports.GologinSDKError = GologinSDKError;
