import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { createXlsx } from './xlsx';
import { jsPDF } from 'jspdf';
import type { GeneratedCatalogListing } from '../shared/types';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeSlug(name: string, sku: string): string {
  const base = `${sku || ''}-${name || 'product'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'aivora-catalog-item';
}

function csvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportListingToJson(listing: GeneratedCatalogListing) {
  const blob = new Blob([JSON.stringify(listing, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, `${safeSlug(listing.productName, listing.sku)}.json`);
}

export function exportListingToTxt(listing: GeneratedCatalogListing) {
  const lines: string[] = [
    `AIVORA PRODUCT CATALOG SHEET`,
    `============================================================`,
    `Product Name: ${listing.productName}`,
    `Brand: ${listing.brandName}`,
    `SKU: ${listing.sku}`,
    `Price: ${listing.price || 'Not provided'}`,
    `Category: ${listing.categoryLabel} / ${listing.subcategory}`,
    `Writing Style: ${listing.writingStyle}`,
    `Generated: ${listing.generatedAt}`,
    ``,
    `SHORT DESCRIPTION`,
    `-----------------`,
    listing.shortDescription,
    ``,
    `LONG DESCRIPTION`,
    `----------------`,
    listing.longDescription,
    ``,
    `BULLET POINT HIGHLIGHTS`,
    `-----------------------`,
    ...listing.bulletHighlights.map((b) => `• ${b}`),
    ``,
    `PRODUCT HIGHLIGHTS`,
    `------------------`,
    ...listing.productHighlights.map((h) => `• ${h}`),
    ``,
    `PRODUCT BENEFITS`,
    `----------------`,
    ...listing.productBenefits.map((b) => `• ${b}`),
    ``,
    `USAGE INSTRUCTIONS`,
    `------------------`,
    ...listing.usageInstructions.map((u, idx) => `${idx + 1}. ${u}`),
    ``,
    `CATEGORY SPECIFICATIONS`,
    `-----------------------`,
    ...listing.categoryAttributes.map(
      (attr) => `${attr.key}: ${attr.value} [${attr.source}${attr.verified ? ', verified' : ''}]`
    ),
    ``,
    `WASH CARE & MAINTENANCE`,
    `-----------------------`,
    `Status: ${listing.washCare.verificationStatus}`,
    `Disclaimer: ${listing.washCare.disclaimer}`,
    `Wash Method: ${listing.washCare.washMethod}`,
    `Water Temp: ${listing.washCare.waterTemperature}`,
    `Similar Colors: ${listing.washCare.washWithSimilarColors}`,
    `Detergent: ${listing.washCare.detergentGuidance}`,
    `Bleach: ${listing.washCare.bleachGuidance}`,
    `Tumble Dry: ${listing.washCare.tumbleDry}`,
    `Line Dry: ${listing.washCare.lineDry}`,
    `Ironing: ${listing.washCare.ironingTemperature}`,
    `Dry Clean: ${listing.washCare.dryClean}`,
    `Storage: ${listing.washCare.storageRecommendations}`,
    ...listing.washCare.categoryMaintenanceInstructions.map((m) => `• ${m}`),
    ``,
    `SEO METADATA`,
    `------------`,
    `SEO Title: ${listing.seo.seoTitle}`,
    `Meta Title: ${listing.seo.metaTitle}`,
    `Meta Description: ${listing.seo.metaDescription}`,
    `URL Slug: /${listing.seo.urlSlug}`,
    `Primary Keyword: ${listing.seo.primaryKeyword}`,
    `Secondary Keywords: ${listing.seo.secondaryKeywords.join(', ')}`,
    `Semantic Keywords: ${listing.seo.semanticKeywords.join(', ')}`,
    `Image Alt Text: ${listing.seo.imageAltTexts.join(' | ')}`,
    ``,
    `MARKETPLACE LISTING (${listing.marketplaceListing.marketplaceLabel})`,
    `---------------------------------------------------`,
    `Notice: ${listing.marketplaceListing.policyNotice}`,
    `Title: ${listing.marketplaceListing.title}`,
    `Category Path: ${listing.marketplaceListing.categoryPath}`,
    `Search Keywords: ${listing.marketplaceListing.searchKeywords.join(', ')}`,
    ``,
    `MISSING INFORMATION REQUIRING VERIFICATION`,
    `------------------------------------------`,
    ...(listing.missingInformation.length
      ? listing.missingInformation.map((m) => `- ${m}`)
      : ['None flagged.']),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${safeSlug(listing.productName, listing.sku)}.txt`);
}

export function exportCatalogToCsv(listings: GeneratedCatalogListing[], filenamePrefix = 'aivora-catalog') {
  const headers = [
    'SKU',
    'Brand',
    'Product Name',
    'Price',
    'Category',
    'Subcategory',
    'Writing Style',
    'Marketplace',
    'Marketplace Title',
    'Short Description',
    'Long Description',
    'Bullet Highlights',
    'Specifications',
    'Care Verification Status',
    'Care Summary',
    'Wash Method',
    'Storage Recommendations',
    'SEO Title',
    'Meta Title',
    'Meta Description',
    'URL Slug',
    'Primary Keyword',
    'Secondary Keywords',
    'Missing Information',
  ];

  const rows = listings.map((l) => [
    l.sku,
    l.brandName,
    l.productName,
    l.price,
    l.categoryLabel,
    l.subcategory,
    l.writingStyle,
    l.marketplaceListing.marketplaceLabel,
    l.marketplaceListing.title,
    l.shortDescription,
    l.longDescription,
    l.bulletHighlights.join(' | '),
    l.categoryAttributes.map((a) => `${a.key}: ${a.value}`).join(' ; '),
    l.washCare.verificationStatus,
    l.careAndMaintenanceSummary,
    l.washCare.washMethod,
    l.washCare.storageRecommendations,
    l.seo.seoTitle,
    l.seo.metaTitle,
    l.seo.metaDescription,
    l.seo.urlSlug,
    l.seo.primaryKeyword,
    l.seo.secondaryKeywords.join(', '),
    l.missingInformation.join(' ; '),
  ]);

  const csvBody = [
    headers.map(csvCell).join(','),
    ...rows.map((r) => r.map(csvCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8' });
  const name =
    listings.length === 1
      ? `${safeSlug(listings[0].productName, listings[0].sku)}.csv`
      : `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  triggerDownload(blob, name);
}

export async function exportCatalogToExcel(
  listings: GeneratedCatalogListing[],
  filenamePrefix = 'aivora-catalog'
) {
  const overview = [
    ['SKU', 'Brand', 'Product Name', 'Price', 'Category', 'Subcategory', 'Style', 'Marketplace', 'Marketplace Title', 'Short Description', 'Long Description', 'Bullet Highlights', 'Missing Information'],
    ...listings.map((l) => [l.sku, l.brandName, l.productName, l.price, l.categoryLabel, l.subcategory, l.writingStyle, l.marketplaceListing.marketplaceLabel, l.marketplaceListing.title, l.shortDescription, l.longDescription, l.bulletHighlights.join('\n'), l.missingInformation.join('; ')]),
  ];
  const specs = [
    ['SKU', 'Product Name', 'Attribute', 'Value', 'Verified', 'Source'],
    ...listings.flatMap((l) => [
      ...l.categoryAttributes.map((attr) => [l.sku, l.productName, attr.key, attr.value, attr.verified ? 'Yes' : 'No', attr.source]),
      [l.sku, l.productName, 'Care Verification Status', `${l.washCare.verificationStatus} — ${l.washCare.disclaimer}`, l.washCare.verificationStatus === 'verified_care_label' ? 'Yes' : 'No', l.washCare.verificationStatus],
    ]),
  ];
  const seo = [
    ['SKU', 'Product Name', 'SEO Title', 'Meta Title', 'Meta Description', 'URL Slug', 'Primary Keyword', 'Secondary Keywords'],
    ...listings.map((l) => [l.sku, l.productName, l.seo.seoTitle, l.seo.metaTitle, l.seo.metaDescription, l.seo.urlSlug, l.seo.primaryKeyword, l.seo.secondaryKeywords.join(', ')]),
  ];
  const buffer = await createXlsx([
    { name: 'Catalog Listings', rows: overview },
    { name: 'Specifications & Care', rows: specs },
    { name: 'SEO Metadata', rows: seo },
  ]);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const name = listings.length === 1
    ? `${safeSlug(listings[0].productName, listings[0].sku)}.xlsx`
    : `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  triggerDownload(blob, name);
}

export async function exportListingToDocx(listing: GeneratedCatalogListing) {
  const attrRows = listing.categoryAttributes.map(
    (attr) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: attr.key, bold: true })] })],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [new Paragraph(attr.value)],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph(attr.verified ? 'Verified' : attr.source)],
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: listing.productName,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${listing.brandName} · SKU: ${listing.sku} · ${listing.categoryLabel} / ${listing.subcategory}`,
                color: '52525B',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Short Description', heading: HeadingLevel.HEADING_1 }),
          new Paragraph(listing.shortDescription),
          new Paragraph({ text: 'Long Description', heading: HeadingLevel.HEADING_1 }),
          new Paragraph(listing.longDescription),
          new Paragraph({ text: 'Bullet Point Highlights', heading: HeadingLevel.HEADING_1 }),
          ...listing.bulletHighlights.map(
            (b) => new Paragraph({ text: b, bullet: { level: 0 } })
          ),
          new Paragraph({ text: 'Category Specifications', heading: HeadingLevel.HEADING_1 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: attrRows,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Wash Care & Maintenance', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Verification: ', bold: true }),
              new TextRun(listing.washCare.disclaimer),
            ],
          }),
          new Paragraph(`Wash Method: ${listing.washCare.washMethod}`),
          new Paragraph(`Water Temperature: ${listing.washCare.waterTemperature}`),
          new Paragraph(`Drying: ${listing.washCare.tumbleDry} / ${listing.washCare.lineDry}`),
          new Paragraph(`Ironing: ${listing.washCare.ironingTemperature}`),
          new Paragraph(`Storage: ${listing.washCare.storageRecommendations}`),
          new Paragraph({ text: 'SEO Metadata', heading: HeadingLevel.HEADING_1 }),
          new Paragraph(`Meta Title: ${listing.seo.metaTitle}`),
          new Paragraph(`Meta Description: ${listing.seo.metaDescription}`),
          new Paragraph(`URL Slug: /${listing.seo.urlSlug}`),
          new Paragraph(`Primary Keyword: ${listing.seo.primaryKeyword}`),
          new Paragraph(`Secondary Keywords: ${listing.seo.secondaryKeywords.join(', ')}`),
          new Paragraph({
            text: `Marketplace Format (${listing.marketplaceListing.marketplaceLabel})`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph(listing.marketplaceListing.policyNotice),
          new Paragraph(`Title: ${listing.marketplaceListing.title}`),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${safeSlug(listing.productName, listing.sku)}.docx`);
}

export function exportListingToPdf(listing: GeneratedCatalogListing) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxLineWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed = 24) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 52;
    }
  };

  const addHeading = (title: string) => {
    ensureSpace(32);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(228, 228, 231);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  const addWrappedText = (text: string, fontSize = 10, color: [number, number, number] = [39, 39, 42]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text || '—', maxLineWidth) as string[];
    for (const line of lines) {
      ensureSpace(15);
      doc.text(line, margin, y);
      y += 14;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(24, 24, 27);
  const titleLines = doc.splitTextToSize(listing.productName, maxLineWidth) as string[];
  for (const tl of titleLines) {
    doc.text(tl, margin, y);
    y += 20;
  }

  addWrappedText(
    `${listing.brandName}  |  SKU: ${listing.sku}  |  ${listing.categoryLabel} / ${listing.subcategory}${listing.price ? `  |  ${listing.price}` : ''}`,
    9.5,
    [82, 82, 91]
  );

  addHeading('Short Description');
  addWrappedText(listing.shortDescription);

  addHeading('Long Description');
  addWrappedText(listing.longDescription);

  addHeading('Bullet Point Highlights');
  for (const b of listing.bulletHighlights) {
    addWrappedText(`• ${b}`);
  }

  addHeading('Category Specifications');
  for (const attr of listing.categoryAttributes) {
    addWrappedText(`${attr.key}: ${attr.value} (${attr.verified ? 'verified' : attr.source})`, 9.5);
  }

  addHeading('Wash Care & Maintenance');
  addWrappedText(`Note: ${listing.washCare.disclaimer}`, 9.5, [82, 82, 91]);
  addWrappedText(
    `Method: ${listing.washCare.washMethod} | Water: ${listing.washCare.waterTemperature} | Drying: ${listing.washCare.lineDry} / ${listing.washCare.tumbleDry} | Iron: ${listing.washCare.ironingTemperature}`
  );
  addWrappedText(`Storage: ${listing.washCare.storageRecommendations}`);

  addHeading('SEO & Marketplace Metadata');
  addWrappedText(`Meta Title: ${listing.seo.metaTitle}`);
  addWrappedText(`Meta Description: ${listing.seo.metaDescription}`);
  addWrappedText(`URL Slug: /${listing.seo.urlSlug} | Primary Keyword: ${listing.seo.primaryKeyword}`);
  addWrappedText(
    `Marketplace (${listing.marketplaceListing.marketplaceLabel}): ${listing.marketplaceListing.title}`
  );

  if (listing.missingInformation.length > 0) {
    addHeading('Missing Information Requiring Seller Verification');
    for (const item of listing.missingInformation) {
      addWrappedText(`- ${item}`, 9.5);
    }
  }

  doc.save(`${safeSlug(listing.productName, listing.sku)}.pdf`);
}
