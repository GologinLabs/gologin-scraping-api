import type { ScrapeJSONData } from "./types";

export type PageOutcome =
  | "ok"
  | "empty"
  | "incomplete"
  | "client_rendered_likely"
  | "authwall"
  | "challenge"
  | "blocked";

export type NextActionHint =
  | "use_gologin_agent_browser"
  | "check_data_endpoints";

export type ScrapeDiagnostics = {
  contentLength: number;
  scriptCount: number;
  linkCount: number;
  headingCount: number;
  shellMarkersDetected: boolean;
};

export type PageAssessment = {
  outcome: PageOutcome;
  outcomeReason?: string;
  nextActionHint?: NextActionHint;
  diagnostics: ScrapeDiagnostics;
};

export function assessHtmlPage(html: string, readableText?: string): PageAssessment {
  const content = readableText ?? "";
  const diagnostics = buildDiagnostics(html, content);
  const signals = collectSignals(html, content);

  if (signals.authwallReason) {
    return {
      outcome: "authwall",
      outcomeReason: signals.authwallReason,
      nextActionHint: "use_gologin_agent_browser",
      diagnostics
    };
  }

  if (signals.challengeReason) {
    return {
      outcome: "challenge",
      outcomeReason: signals.challengeReason,
      nextActionHint: "use_gologin_agent_browser",
      diagnostics
    };
  }

  if (signals.blockedReason) {
    return {
      outcome: "blocked",
      outcomeReason: signals.blockedReason,
      nextActionHint: "use_gologin_agent_browser",
      diagnostics
    };
  }

  if (diagnostics.contentLength === 0) {
    return {
      outcome: "empty",
      outcomeReason: "Returned HTML produced no readable text",
      nextActionHint: diagnostics.shellMarkersDetected ? "use_gologin_agent_browser" : undefined,
      diagnostics
    };
  }

  if (diagnostics.shellMarkersDetected && diagnostics.contentLength < 700) {
    return {
      outcome: "client_rendered_likely",
      outcomeReason: "Returned HTML looks like a client-rendered shell with little readable content",
      nextActionHint: "use_gologin_agent_browser",
      diagnostics
    };
  }

  if (diagnostics.contentLength < 400 && diagnostics.linkCount > 25 && diagnostics.scriptCount > 5) {
    return {
      outcome: "incomplete",
      outcomeReason: "Returned HTML is navigation-heavy and content-light",
      nextActionHint: "use_gologin_agent_browser",
      diagnostics
    };
  }

  return {
    outcome: "ok",
    diagnostics
  };
}

export function assessStructuredPage(data: ScrapeJSONData): Omit<PageAssessment, "diagnostics"> {
  if ((data.canonical ?? "").includes("/authwall")) {
    return {
      outcome: "authwall",
      outcomeReason: "Canonical URL points to an authwall path",
      nextActionHint: "use_gologin_agent_browser"
    };
  }

  const candidates = [
    data.title,
    data.description,
    data.canonical,
    ...data.headings.slice(0, 5)
  ].filter((value): value is string => Boolean(value && value.trim()));

  for (const candidate of candidates) {
    const authwallReason = classifyAuthwallText(candidate);
    if (authwallReason) {
      return {
        outcome: "authwall",
        outcomeReason: authwallReason,
        nextActionHint: "use_gologin_agent_browser"
      };
    }

    const challengeReason = classifyChallengeText(candidate);
    if (challengeReason) {
      return {
        outcome: "challenge",
        outcomeReason: challengeReason,
        nextActionHint: "use_gologin_agent_browser"
      };
    }

    const blockedReason = classifyBlockedText(candidate);
    if (blockedReason) {
      return {
        outcome: "blocked",
        outcomeReason: blockedReason,
        nextActionHint: "use_gologin_agent_browser"
      };
    }
  }

  if (!data.title && !data.description && data.headings.length === 0 && data.links.length === 0) {
    return {
      outcome: "empty",
      outcomeReason: "Structured extraction found almost no metadata or content"
    };
  }

  if (data.headings.length === 0 && !data.title) {
    return {
      outcome: "incomplete",
      outcomeReason: "Structured extraction found weak metadata and no headings",
      nextActionHint: "use_gologin_agent_browser"
    };
  }

  return {
    outcome: "ok"
  };
}

export function describeNextActionHint(hint: NextActionHint | undefined): string | undefined {
  switch (hint) {
    case "use_gologin_agent_browser":
      return "Use Gologin Agent Browser when the site depends on JS-rendered DOM or network requests.";
    case "check_data_endpoints":
      return "Check whether the site exposes a JSON or data endpoint and scrape that directly.";
    default:
      return undefined;
  }
}

function buildDiagnostics(html: string, readableText: string): ScrapeDiagnostics {
  return {
    contentLength: normalizeText(readableText).length,
    scriptCount: countMatches(html, /<script\b/gi),
    linkCount: countMatches(html, /<a\b[^>]*href=/gi),
    headingCount: countMatches(html, /<h[1-6]\b/gi),
    shellMarkersDetected: /__NEXT_DATA__|__NUXT__|data-sveltekit|\/__data\.json\b|webpackJsonp|window\.__|hydration|astro-|elementorFrontendConfig|wix-code-sdk|squarespace/i.test(
      html
    )
  };
}

function collectSignals(html: string, readableText: string): {
  authwallReason?: string;
  challengeReason?: string;
  blockedReason?: string;
} {
  const candidates = [html, readableText]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .map((value) => value.slice(0, 4_000));

  for (const candidate of candidates) {
    const authwallReason = classifyAuthwallText(candidate);
    if (authwallReason) {
      return { authwallReason };
    }

    const challengeReason = classifyChallengeText(candidate);
    if (challengeReason) {
      return { challengeReason };
    }

    const blockedReason = classifyBlockedText(candidate);
    if (blockedReason) {
      return { blockedReason };
    }
  }

  return {};
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function classifyAuthwallText(value: string): string | undefined {
  if (
    /(sign in to view|sign in to continue|join now|join to view|log in to continue|create account|sign up to continue|member only|members only)/i.test(
      value
    )
  ) {
    return "Login or signup wall markers matched the returned page";
  }

  return undefined;
}

function classifyChallengeText(value: string): string | undefined {
  if (
    /(verify you are human|security verification|captcha|checking your browser|enable javascript and cookies|just a moment|one more step)/i.test(
      value
    )
  ) {
    return "Challenge markers matched the returned page";
  }

  return undefined;
}

function classifyBlockedText(value: string): string | undefined {
  if (
    /(access denied|request blocked|blocked request|temporarily unavailable|you have been blocked|forbidden)/i.test(
      value
    )
  ) {
    return "Blocked-page markers matched the returned page";
  }

  return undefined;
}
