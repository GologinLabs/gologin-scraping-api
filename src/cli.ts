#!/usr/bin/env node

import { WebUnlocker } from "./client";
import { WebUnlockerError } from "./errors";

type CliOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
};

type ParsedArgs = {
  command: "scrape" | "text" | "markdown" | "json";
  url?: string;
  options: CliOptions;
  help: boolean;
};

function printUsage(): void {
  process.stderr.write(
    [
      "Gologin Web Unlocker CLI",
      "",
      "Usage:",
      "  gologin-webunlocker <command> <url> [options]",
      "",
      "Commands:",
      "  scrape     Output raw HTML/text from API response",
      "  text       Output text derived from returned HTML",
      "  markdown   Output markdown derived from returned HTML",
      "  json       Output JSON metadata derived from returned HTML",
      "",
      "Options:",
      "  --api-key <key>         API key (or set GOLOGIN_WEBUNLOCKER_API_KEY)",
      "  --base-url <url>        Default: https://parsing.webunlocker.gologin.com",
      "  --timeout-ms <number>   Request timeout in ms",
      "  --max-retries <number>  Retry attempts",
      "  -h, --help              Show help",
      "",
      "Examples:",
      "  gologin-webunlocker scrape https://example.com --api-key wu_live_xxx",
      "  gologin-webunlocker text https://example.com",
      "  GOLOGIN_WEBUNLOCKER_API_KEY=wu_live_xxx gologin-webunlocker json https://example.com"
    ].join("\n") + "\n"
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: "scrape",
    options: {},
    help: false
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "-h" || token === "--help") {
      parsed.help = true;
      continue;
    }

    if (token === "--api-key") {
      parsed.options.apiKey = argv[++i];
      continue;
    }

    if (token === "--base-url") {
      parsed.options.baseUrl = argv[++i];
      continue;
    }

    if (token === "--timeout-ms") {
      parsed.options.timeoutMs = Number(argv[++i]);
      continue;
    }

    if (token === "--max-retries") {
      parsed.options.maxRetries = Number(argv[++i]);
      continue;
    }

    positional.push(token);
  }

  if (positional.length > 0) {
    const maybeCommand = positional[0];
    if (
      maybeCommand === "scrape" ||
      maybeCommand === "text" ||
      maybeCommand === "markdown" ||
      maybeCommand === "json"
    ) {
      parsed.command = maybeCommand;
      parsed.url = positional[1];
    } else {
      parsed.url = positional[0];
    }
  }

  return parsed;
}

async function run(): Promise<void> {
  const { command, url, options, help } = parseArgs(process.argv.slice(2));

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (!url) {
    printUsage();
    process.exit(1);
  }

  const apiKey = options.apiKey ?? process.env.GOLOGIN_WEBUNLOCKER_API_KEY;
  if (!apiKey) {
    process.stderr.write("Missing API key. Use --api-key or GOLOGIN_WEBUNLOCKER_API_KEY.\n");
    process.exit(1);
  }

  const client = new WebUnlocker({
    apiKey,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
    maxRetries: options.maxRetries
  });

  if (command === "scrape") {
    const result = await client.scrape(url, { timeoutMs: options.timeoutMs });
    process.stdout.write(result.content);
    return;
  }

  if (command === "text") {
    const result = await client.scrapeText(url, { timeoutMs: options.timeoutMs });
    process.stdout.write(result.text + "\n");
    return;
  }

  if (command === "markdown") {
    const result = await client.scrapeMarkdown(url, { timeoutMs: options.timeoutMs });
    process.stdout.write(result.markdown + "\n");
    return;
  }

  const result = await client.scrapeJSON(url, { timeoutMs: options.timeoutMs });
  process.stdout.write(JSON.stringify(result.data, null, 2) + "\n");
}

run().catch((error) => {
  if (error instanceof WebUnlockerError) {
    process.stderr.write(`${error.name}: ${error.message}\n`);
  } else if (error instanceof Error) {
    process.stderr.write(`${error.name}: ${error.message}\n`);
  } else {
    process.stderr.write(`Unknown error: ${String(error)}\n`);
  }
  process.exit(1);
});
