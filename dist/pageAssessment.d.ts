import type { ScrapeJSONData } from "./types";
export type PageOutcome = "ok" | "empty" | "incomplete" | "client_rendered_likely" | "authwall" | "challenge" | "blocked";
export type NextActionHint = "use_gologin_agent_browser" | "check_data_endpoints";
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
export declare function assessHtmlPage(html: string, readableText?: string): PageAssessment;
export declare function assessStructuredPage(data: ScrapeJSONData): Omit<PageAssessment, "diagnostics">;
export declare function describeNextActionHint(hint: NextActionHint | undefined): string | undefined;
