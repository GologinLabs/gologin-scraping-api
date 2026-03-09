export const DEFAULT_BASE_URL = "https://parsing.webunlocker.gologin.com";
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_MAX_RETRIES = 2;
const MAX_EXTRACTED_LINKS = 100;
const MAX_EXTRACTED_HEADINGS = 50;

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export function truncate(value: string, maxLength = 300): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, " ");

  const withBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|tr|h1|h2|h3|h4|h5|h6)>/gi, "\n");

  const stripped = withBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(stripped);

  return decoded
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function htmlToMarkdown(html: string): string {
  let markdown = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  markdown = markdown.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_, level: string, text: string) =>
      `${"#".repeat(Number(level))} ${cleanInlineHtml(text)}\n\n`
  );

  markdown = markdown.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href: string, text: string) => `[${cleanInlineHtml(text)}](${href})`
  );

  markdown = markdown
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text: string) => `**${cleanInlineHtml(text)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text: string) => `*${cleanInlineHtml(text)}*`)
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, text: string) => `\`${cleanInlineHtml(text)}\``)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, text: string) => `- ${cleanInlineHtml(text)}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|ul|ol|table|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  markdown = decodeHtmlEntities(markdown)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return markdown;
}

export function htmlToStructuredData(html: string): {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  meta: Record<string, string>;
  headings: string[];
  links: Array<{ text: string; href: string }>;
} {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalMatch = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i);

  const meta: Record<string, string> = {};
  const metaTagMatches = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTagMatches) {
    const name = getTagAttr(tag, "name") || getTagAttr(tag, "property");
    const content = getTagAttr(tag, "content");

    if (!name || !content) {
      continue;
    }

    meta[name] = decodeHtmlEntities(content).trim();
  }

  const headings = (html.match(/<h[1-3]\b[^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? [])
    .slice(0, MAX_EXTRACTED_HEADINGS)
    .map((headingHtml) =>
      decodeHtmlEntities(headingHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim()
    )
    .filter(Boolean);

  const links = Array.from(
    html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
  )
    .slice(0, MAX_EXTRACTED_LINKS)
    .map((match) => ({
      href: decodeHtmlEntities(match[1]).trim(),
      text: decodeHtmlEntities(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim()
    }))
    .filter((link) => link.href.length > 0);

  const canonical = canonicalMatch ? getTagAttr(canonicalMatch[0], "href") ?? null : null;
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : null;
  const description = meta.description ?? meta["og:description"] ?? null;

  return {
    title,
    description,
    canonical: canonical ? decodeHtmlEntities(canonical).trim() : null,
    meta,
    headings,
    links
  };
}

function cleanInlineHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function getTagAttr(tag: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match ? match[1] : null;
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&nbsp;": " "
  };

  let decoded = value;
  for (const [entity, plain] of Object.entries(namedEntities)) {
    decoded = decoded.split(entity).join(plain);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, num: string) =>
    String.fromCharCode(Number(num))
  );

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return decoded;
}
