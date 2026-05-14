# Scraping API SDK and CLI

GoLogin Scraping API is a single-endpoint API for fetching protected public pages without wiring proxy handling in the client.

The current backend endpoint is:

`GET https://parsing.webunlocker.gologin.com/v1/scrape?url={encoded_url}`

Authentication is sent with:

```http
apikey: <API_KEY>
```

## Direct HTTP

```bash
curl "https://parsing.webunlocker.gologin.com/v1/scrape?url=https%3A%2F%2Fexample.com" \
  -H "apikey: $GOLOGIN_SCRAPING_API_KEY"
```

## SDK

```bash
npm i gologin-scraping-api
```

```ts
import { ScrapingApi } from "gologin-scraping-api";

const client = new ScrapingApi({
  apiKey: process.env.GOLOGIN_SCRAPING_API_KEY!
});

const result = await client.scrapeText("https://example.com");
console.log(result.text);
```

## CLI

```bash
export GOLOGIN_SCRAPING_API_KEY="wu_live_xxx"

gologin-scraping-api scrape https://example.com
gologin-scraping-api text https://example.com
gologin-scraping-api markdown https://example.com
gologin-scraping-api json https://example.com --envelope
```

## Compatibility

These old names still work for existing users:

- `gologin-webunlocker` CLI alias
- `WebUnlocker` SDK class alias
- `GOLOGIN_WEBUNLOCKER_API_KEY` env var alias

New docs and examples should use `Scraping API`, `gologin-scraping-api`, `ScrapingApi`, and `GOLOGIN_SCRAPING_API_KEY`.
