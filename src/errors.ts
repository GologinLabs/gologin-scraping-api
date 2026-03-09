export type SDKErrorContext = {
  status?: number;
  url?: string;
  body?: string | null;
  cause?: unknown;
};

export class WebUnlockerError extends Error {
  readonly status?: number;
  readonly url?: string;
  readonly body?: string | null;
  override readonly cause?: unknown;

  constructor(message: string, context: SDKErrorContext = {}) {
    super(message);
    this.name = "WebUnlockerError";
    this.status = context.status;
    this.url = context.url;
    this.body = context.body;
    this.cause = context.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends WebUnlockerError {
  constructor(message: string, context: SDKErrorContext = {}) {
    super(message, context);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends WebUnlockerError {
  constructor(message: string, context: SDKErrorContext = {}) {
    super(message, context);
    this.name = "RateLimitError";
  }
}

export class APIError extends WebUnlockerError {
  constructor(message: string, context: SDKErrorContext = {}) {
    super(message, context);
    this.name = "APIError";
  }
}

export class TimeoutError extends WebUnlockerError {
  constructor(message: string, context: SDKErrorContext = {}) {
    super(message, context);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends WebUnlockerError {
  constructor(message: string, context: SDKErrorContext = {}) {
    super(message, context);
    this.name = "NetworkError";
  }
}

// Backward-compatible alias.
export class GoLoginSDKError extends WebUnlockerError {}
