import { zipSync } from "fflate";
import type { SeoReport, TaskStatus } from "@/lib/seoReport";

export const runtime = "nodejs";

type CellValue = string | number | null;
type Sheet = { name: string; rows: CellValue[][] };

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sheetXml(rows: CellValue[][]) {
  const maxColumns = Math.max(1, ...rows.map((row) => row.length));
  const lastCell = `${columnName(maxColumns - 1)}${Math.max(rows.length, 1)}`;
  const xmlRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      if (value === null || value === undefined) return "";
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}"><v>${value}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(value))}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${lastCell}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetData>${xmlRows}</sheetData>
<autoFilter ref="A1:${lastCell}"/>
</worksheet>`;
}

function createWorkbook(sheets: Sheet[]) {
  const overrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  const sheetEntries = sheets.map((sheet, index) =>
    `<sheet name="${xml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  const relationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}</Types>`,
    ),
    "_rels/.rels": new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    ),
    "xl/workbook.xml": new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheetEntries}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": new TextEncoder().encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relationships}</Relationships>`,
    ),
  };
  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = new TextEncoder().encode(sheetXml(sheet.rows));
  });
  return zipSync(files, { level: 6 });
}

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 2_000_000) {
    return Response.json({ error: "The audit report is too large to export." }, { status: 413 });
  }
  let body: {
    report?: SeoReport;
    actionStatuses?: Record<string, TaskStatus>;
    altDrafts?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid report export request." }, { status: 400 });
  }
  const report = body.report;
  if (
    !report ||
    typeof report.url !== "string" ||
    !Array.isArray(report.checks) ||
    !Array.isArray(report.actions) ||
    !Array.isArray(report.pageSpeed)
  ) {
    return Response.json({ error: "The SEO report data is incomplete." }, { status: 400 });
  }
  const statuses = body.actionStatuses ?? {};
  const fixedCount = report.actions.filter((action) => statuses[action.id] === "fixed").length;
  const sheets: Sheet[] = [
    {
      name: "Dashboard",
      rows: [
        ["Metric", "Value"],
        ["Overall SEO score", report.score],
        ...Object.entries(report.categoryScores).map(([category, score]) => [`${category} score`, score ?? "Not available"]),
        ["Total issues", report.actions.length],
        ["Fixed issues", fixedCount],
        ["Pending issues", report.actions.length - fixedCount],
        ["Audited URL", report.url],
        ["Scanned at", report.scannedAt],
      ],
    },
    {
      name: "Audit Findings",
      rows: [
        ["Category", "Check", "Result", "Priority", "Affected URL", "What is wrong", "Why it matters", "Recommended fix", "Code example", "Effort"],
        ...report.checks.map((item) => [
          item.category, item.title, item.status, item.priority ?? "", item.affectedUrls?.join("\n") ?? report.url,
          item.detail, item.whyItMatters ?? "", item.recommendation ?? "", item.codeExample ?? "", item.effort ?? "",
        ]),
      ],
    },
    {
      name: "Action Plan",
      rows: [
        ["Issue", "What is wrong", "Why it matters", "Affected URL", "Recommended fix", "Priority", "Effort", "Status", "Code example"],
        ...report.actions.map((action) => [
          action.issue, action.whatIsWrong, action.whyItMatters, action.affectedUrl, action.recommendedFix,
          action.priority, action.effort, statuses[action.id] ?? action.status, action.codeExample ?? "",
        ]),
      ],
    },
    {
      name: "Broken Links",
      rows: [
        ["Source page", "Affected URL", "HTTP status"],
        ...report.brokenLinks.map((item) => [report.url, item.url, item.status ?? "Could not verify"]),
      ],
    },
    {
      name: "PageSpeed",
      rows: [
        ["Device", "Performance score", "SEO score", "LCP ms", "CLS", "INP ms", "Opportunities", "Error"],
        ...report.pageSpeed.map((item) => [
          item.strategy, item.scores.performance, item.scores.seo, item.metrics.lcpMs, item.metrics.cls,
          item.metrics.inpMs, item.opportunities.map((entry) => entry.title).join("; "), item.error ?? "",
        ]),
      ],
    },
    {
      name: "Image Alt Text",
      rows: [
        ["Image URL", "Suggested alt text", "Source", "Needs visual review"],
        ...report.imageAltSuggestions.map((item) => [
          item.imageUrl, body.altDrafts?.[String(item.id)] ?? item.suggestion,
          item.source, item.needsVisualReview ? "Yes" : "No",
        ]),
      ],
    },
  ];

  return new Response(createWorkbook(sheets), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="seo-audit-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
