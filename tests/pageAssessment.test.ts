import test from "node:test";
import assert from "node:assert/strict";

import { assessHtmlPage, assessStructuredPage, describeNextActionHint } from "../src/pageAssessment";

test("assessHtmlPage flags client-rendered shells with little text", () => {
  const html = `
    <html>
      <head><script>window.__NEXT_DATA__ = {};</script></head>
      <body>
        <div id="__next"></div>
        <nav>${Array.from({ length: 40 }, (_, index) => `<a href="/p/${index}">Page ${index}</a>`).join("")}</nav>
      </body>
    </html>
  `;

  const assessment = assessHtmlPage(html, "Page 1 Page 2 Page 3");
  assert.equal(assessment.outcome, "client_rendered_likely");
  assert.equal(assessment.nextActionHint, "use_gologin_agent_browser");
  assert.equal(assessment.diagnostics.shellMarkersDetected, true);
});

test("assessHtmlPage flags authwall text", () => {
  const html = `
    <html><body><main><h1>Join now</h1><p>Sign in to continue</p></main></body></html>
  `;

  const assessment = assessHtmlPage(html, "Join now Sign in to continue");
  assert.equal(assessment.outcome, "authwall");
});

test("assessStructuredPage flags weak structured payloads", () => {
  const assessment = assessStructuredPage({
    title: null,
    description: null,
    canonical: null,
    meta: {},
    headings: [],
    links: []
  });

  assert.equal(assessment.outcome, "empty");
});

test("describeNextActionHint explains agent browser escalation", () => {
  assert.match(
    describeNextActionHint("use_gologin_agent_browser") ?? "",
    /Agent Browser|JS-rendered DOM|network requests/i
  );
});
