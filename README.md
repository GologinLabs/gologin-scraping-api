# GoLogin Web Unlocker SDK (TypeScript)

Minimal Node.js SDK for GoLogin Web Unlocker scraping API.

The backend endpoint is:

`GET https://parsing.webunlocker.gologin.com/v1/scrape?url={encoded_url}`

Authentication is sent via header: `apikey: <API_KEY>`.

The backend response is raw HTML/text.

## Install

```bash
npm install gologin-webunlocker-sdk
```

## CLI

After build/install, CLI command:

```bash
gologin-webunlocker <command> <url> [options]
```

Commands:

- `scrape` (raw HTML/text from API)
- `text` (derived from HTML in SDK)
- `markdown` (derived from HTML in SDK)
- `json` (derived metadata from HTML in SDK)

Options:

- `--api-key <key>` or `GOLOGIN_WEBUNLOCKER_API_KEY`
- `--base-url <url>`
- `--timeout-ms <number>`
- `--max-retries <number>`

Examples:

```bash
gologin-webunlocker scrape https://example.com --api-key wu_live_xxx
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker text https://example.com
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker json https://example.com
```

## Quick Start

```ts
import { WebUnlocker } from "gologin-webunlocker-sdk";

const client = new WebUnlocker({
  apiKey: process.env.GOLOGIN_WEBUNLOCKER_API_KEY!
});

const result = await client.scrape("https://example.com");
console.log(result.status);
console.log(result.content.slice(0, 500));
```

## Constructor Options

```ts
new WebUnlocker({
  apiKey: "wu_live_xxx",
  baseUrl: "https://parsing.webunlocker.gologin.com",
  timeoutMs: 15000,
  maxRetries: 2
});
```

- `apiKey: string` required, sent as `apikey` header
- `baseUrl?: string` defaults to `https://parsing.webunlocker.gologin.com`
- `timeoutMs?: number` defaults to `15000`
- `maxRetries?: number` defaults to `2`

## Normalized `scrape()` Response

`/v1/scrape` returns raw HTML/text from the upstream page.  
The SDK wraps it into a normalized object:

```ts
type ScrapeResult = {
  success: true;
  url: string;
  content: string;
  status?: number | null;
  contentType?: string | null;
  headers?: Record<string, string>;
};
```

`scrape()` throws typed errors for non-2xx responses.

Example:

```ts
const result = await client.scrape("https://example.com");
console.log(result.status);
console.log(result.contentType);
console.log(result.content.slice(0, 500));
```

## `scrapeRaw()` Example

Use `scrapeRaw()` when you need direct access to native `fetch` `Response`:

```ts
const response = await client.scrapeRaw("https://example.com");
console.log(response.status);
const html = await response.text();
```

`scrapeRaw()` returns the raw `Response` object as-is (including non-2xx statuses).

## `buildScrapeUrl()` Example

```ts
const requestUrl = client.buildScrapeUrl("https://example.com");
console.log(requestUrl);
// https://parsing.webunlocker.gologin.com/v1/scrape?url=https%3A%2F%2Fexample.com
```

## SDK-Side Derived Methods

These methods are derived from the HTML returned by the API.  
They do not require additional backend features.

### `scrapeText()` (derived from HTML)

```ts
const result = await client.scrapeText("https://example.com");
console.log(result.text.slice(0, 500));
```

### `scrapeMarkdown()` (derived from HTML)

```ts
const result = await client.scrapeMarkdown("https://example.com");
console.log(result.markdown.slice(0, 500));
```

### `scrapeJSON()` (derived from HTML)

```ts
const result = await client.scrapeJSON("https://example.com");
console.log(result.data.title);
console.log(result.data.description);
console.log(result.data.links.slice(0, 5));
```

### `batchScrape()` (client-side helper)

```ts
const results = await client.batchScrape(
  ["https://example.com", "https://gologin.com"],
  { concurrency: 2 }
);
console.log(results.map((r) => ({ url: r.url, status: r.status })));
```

## Typed Errors

```ts
import {
  WebUnlocker,
  WebUnlockerError,
  AuthenticationError,
  RateLimitError,
  APIError,
  TimeoutError,
  NetworkError
} from "gologin-webunlocker-sdk";

try {
  const client = new WebUnlocker({ apiKey: "wu_live_xxx" });
  await client.scrape("https://example.com");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limited");
  } else if (error instanceof TimeoutError) {
    console.error("Request timed out");
  } else if (error instanceof NetworkError) {
    console.error("Network failure");
  } else if (error instanceof APIError) {
    console.error("Server/API error");
  } else if (error instanceof WebUnlockerError) {
    console.error("SDK error");
  } else {
    console.error("Unknown error", error);
  }
}
```

Error mapping:

- `401`/`403` -> `AuthenticationError`
- `429` -> `RateLimitError`
- `500+` -> `APIError`
- abort/timeout -> `TimeoutError`
- fetch/network issues -> `NetworkError`

## Local Example

```bash
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx npm run example
```
