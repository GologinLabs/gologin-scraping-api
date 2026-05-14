# Releasing GoLogin Scraping API

1. Confirm package metadata:

   ```bash
   npm view gologin-scraping-api version
   npm view gologin-webunlocker deprecated
   ```

2. Run release checks:

   ```bash
   npm run release:check
   ```

3. Publish with an npm token that has access to the GoLogin npm account:

   ```bash
   npm publish --access public
   ```

4. Verify:

   ```bash
   npm view gologin-scraping-api version bin --json
   npm dist-tag ls gologin-scraping-api
   ```

Compatibility notes:

- The published npm package name is `gologin-scraping-api`.
- The installed primary CLI command is `gologin-scraping-api`.
- The old `gologin-webunlocker` CLI command is still included as a compatibility alias.
- The recommended SDK install is `npm install gologin-scraping-api`.
- The old `gologin-webunlocker` package should stay deprecated and point users to `gologin-scraping-api`.
