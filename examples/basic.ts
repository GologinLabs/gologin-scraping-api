import { WebUnlocker } from "../src";

async function main(): Promise<void> {
  const apiKey = process.env.GOLOGIN_WEBUNLOCKER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOLOGIN_WEBUNLOCKER_API_KEY environment variable");
  }

  const client = new WebUnlocker({ apiKey });
  const result = await client.scrape("https://example.com");

  console.log(result.content.slice(0, 500));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
