# Gologin Web Unlocker SDK (TypeScript)

Minimal Node.js SDK and CLI for stateless page retrieval through Gologin Web Unlocker.

The backend endpoint is:

`GET https://parsing.webunlocker.gologin.com/v1/scrape?url={encoded_url}`

Authentication is sent via header: `apikey: <API_KEY>`.

The backend response is raw HTML/text.

Best fit:

- bot-protected HTML pages
- public JSON/data endpoints hidden behind basic protection
- simple subprocess-style usage without a browser runtime

Not the right fit when you need:

- JavaScript rendering or hydrated DOM
- network request inspection
- clicks, typing, screenshots, or login flows

For those cases, use `gologin-agent-browser` instead of expecting `webunlocker` to behave like a browser.

## Install

```bash
npm install gologin-webunlocker
```

Install the CLI globally:

```bash
npm install -g gologin-webunlocker
```

If the command is still not found after a global install:

- use `npx gologin-webunlocker ...`
- or add your global npm bin directory to `PATH`

Example:

```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

## Get API Key

To get a Web Unlocker API key, create an account and complete onboarding at:

- https://gologin.com/web-unlocker

Then use the key in:

- `apikey` request header
- `GOLOGIN_WEBUNLOCKER_API_KEY` environment variable

## CLI

After build/install, CLI command:

```bash
gologin-webunlocker <command> <url> [options]
```

Commands:

- `scrape` (raw HTML/text from API)
- `text` (derived from returned HTML, no JS rendering)
- `markdown` (derived from returned HTML, no JS rendering)
- `json` (derived metadata from HTML in SDK)

Options:

- `--api-key <key>` or `GOLOGIN_WEBUNLOCKER_API_KEY`
- `--base-url <url>`
- `--timeout-ms <number>`
- `--max-retries <number>`
- `--envelope` for `json`, to print metadata plus `outcome`, `nextActionHint`, and diagnostics

Examples:

```bash
gologin-webunlocker scrape https://example.com --api-key wu_live_xxx
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker text https://example.com
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker json https://example.com
GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker json https://example.com --envelope
npx gologin-webunlocker text https://example.com --api-key wu_live_xxx
```

## Quick Start

```ts
import { WebUnlocker } from "gologin-webunlocker";

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

Important:

- they do not execute JavaScript
- they only see the HTML returned by the upstream request
- on JS-heavy sites they may mostly reflect the server-rendered shell rather than the final browser-visible page

### `scrapeText()` (derived from HTML)

```ts
const result = await client.scrapeText("https://example.com");
console.log(result.text.slice(0, 500));
console.log(result.outcome);
console.log(result.nextActionHint);
```

### `scrapeMarkdown()` (derived from HTML)

```ts
const result = await client.scrapeMarkdown("https://example.com");
console.log(result.markdown.slice(0, 500));
console.log(result.diagnostics);
```

### `scrapeJSON()` (derived from HTML)

```ts
const result = await client.scrapeJSON("https://example.com");
console.log(result.data.title);
console.log(result.data.description);
console.log(result.data.links.slice(0, 5));
console.log(result.outcome);
console.log(result.outcomeReason);
```

Derived methods now also return lightweight classification fields:

- `outcome`: `ok`, `empty`, `incomplete`, `client_rendered_likely`, `authwall`, `challenge`, or `blocked`
- `outcomeReason`: short explanation
- `nextActionHint`: suggested next step such as `use_gologin_agent_browser`
- `diagnostics`: content length, script count, link count, heading count, and shell-marker detection

This is intended to tell you when Web Unlocker probably hit an HTML shell or a gated page instead of a complete rendered page.

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
} from "gologin-webunlocker";

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

## Development

```bash
git clone https://github.com/GologinLabs/gologin-webunlocker.git
cd gologin-webunlocker
npm install
npm run build
```

## Release

```bash
npm run release:check
npm publish --access public
```

## Routing Rule Of Thumb

- Use `gologin-webunlocker` when the target is likely server-rendered HTML or an exposed data endpoint.
- Use `gologin-agent-browser` when useful content appears only after hydration, client-side requests, or interaction.
- If `outcome` comes back as `client_rendered_likely`, `authwall`, `challenge`, or `blocked`, treat that as a signal to escalate into a browser tool rather than retrying the same stateless extraction blindly.
