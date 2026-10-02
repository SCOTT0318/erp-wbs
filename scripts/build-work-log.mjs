import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Usage: node scripts/build-work-log.mjs <ERP Markdown> <bundled node_modules>
const [sourceArg, modulesArg] = process.argv.slice(2);
if (!sourceArg || !modulesArg) throw new Error("ERP Markdown과 Markdown 런타임 경로가 필요합니다.");
const source = path.resolve(sourceArg);
const root = path.resolve(import.meta.dirname, "..");
const date = path.basename(source, ".md");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜 파일명이 필요합니다.");
const destination = path.join(root, "docs", "daily-work-logs", "박범준", `${date}.md`);
const sourceText = fs.readFileSync(source, "utf8");
const linked = sourceText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
  if (/^(?:https?:|#)/.test(href)) return match;
  const [file, fragment] = href.split("#");
  const target = path.resolve(path.dirname(source), decodeURIComponent(file));
  if (!fs.existsSync(target)) throw new Error(`없는 ERP 근거 파일: ${label}`);
  const relative = path.relative(path.dirname(destination), target).replaceAll("\\", "/");
  return `[${label}](${relative}${fragment ? `#${fragment}` : ""})`;
});
// The source supplied for publication is already sanitized; fail closed on connection/secret literals.
if (/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[\w.-]+@\d+\.\d+\.\d+\.\d+|erp-account|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|postgres(?:ql)?:\/\/|sk-[A-Za-z0-9]{15})/i.test(linked)) {
  throw new Error("공개 기록에서 제외할 연결·비밀 리터럴이 있습니다.");
}
const { marked } = await import(pathToFileURL(path.join(modulesArg, "marked", "lib", "marked.esm.js")));
const escape = text => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const headings = [];
let body = marked.parse(linked, { gfm: true });
body = body.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_all, level, content) => {
  const id = `section-${headings.length + 1}`;
  headings.push({ level: Number(level), content, id });
  return `<h${level} id="${id}">${content}</h${level}>`;
});
// ERP-only evidence files remain verified local links in Markdown. In the public HTML,
// show their repo paths as evidence references rather than creating links outside this site.
body = body.replace(/<a href="([^"]*tempchian-erp\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_all, href, label) => {
  const relative = decodeURIComponent(href.slice(href.indexOf("tempchian-erp/") + "tempchian-erp/".length));
  return `<span class="evidence-reference">${label} <code>${escape(relative)}</code></span>`;
});
body = body.replaceAll("<table>", '<div class="table-scroll" role="region" aria-label="상세 기록 표" tabindex="0"><table>').replaceAll("</table>", "</table></div>");
const toc = headings.filter(item => item.level === 2 || item.level === 3)
  .map(item => `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.content}</a></li>`).join("\n");
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(date)} ERP 상세 업무 기록 | TempChain WBS</title>
<link rel="stylesheet" href="../../../css/wbs.css"><link rel="stylesheet" href="../../../css/work-log.css"></head>
<body class="work-log-page"><header class="log-header"><a href="../../../index.html">← WBS 메인</a><span>${escape(date)} · ERP 상세 기록</span><a href="./${date}.md">Markdown 원본</a></header>
<main class="log-shell"><section class="log-summary"><p class="eyebrow">ERP WORK RECORD</p><h1>${escape(date)} 작업·검증·남은 확인</h1>
<p>진행률 <strong>6% 유지</strong> · 로컬 구현·검사와 현업 수용·운영 배포를 구분합니다.</p>
<p>소스·실행 로그는 ERP 저장소의 근거 경로로 표시합니다. 로컬 Markdown에서는 기준을 다시 맞춘 원본 링크를 사용할 수 있습니다.</p></section>
<nav class="log-toc" aria-label="상세 기록 목차"><h2>목차</h2><ul>${toc}</ul></nav>
<article class="log-content">${body}</article></main><footer class="log-footer"><a href="../../../index.html">WBS 메인으로 돌아가기</a><a href="#section-1">맨 위로</a></footer></body></html>\n`;
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, linked, "utf8");
fs.writeFileSync(destination.replace(/\.md$/, ".html"), html, "utf8");
console.log(`Built ${date}: ${sourceText.split(/\r?\n/).length} source lines, ${headings.length} heading anchors`);
