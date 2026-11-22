import type { ProductInput } from '../shared/types';
import { parseXlsx } from './xlsx';

export interface ParsedBulkSpreadsheet {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export type ColumnMapping = Partial<Record<keyof ProductInput, string>>;

function parseCsvString(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedBulkSpreadsheet> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    const matrix = parseCsvString(text);
    if (matrix.length < 2) {
      throw new Error('CSV file must include a header row and at least one product row.');
    }
    const headers = matrix[0].map((h, idx) => h || `Column_${idx + 1}`);
    const rows = matrix.slice(1).map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = cells[idx] ?? '';
      });
      return record;
    });
    return { headers, rows };
  }

  if (lowerName.endsWith('.xlsx')) {
    const matrix = await parseXlsx(await file.arrayBuffer());
    const headers = (matrix[0] ?? []).map((h, idx) => h.trim() || `Column_${idx + 1}`);
    if (!headers.length || !headers.some(Boolean)) throw new Error('First row of the Excel sheet must contain column headers.');
    const rows = matrix.slice(1).map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => { record[header] = String(cells[idx] ?? '').trim(); });
      return record;
    }).filter((record) => Object.values(record).some(Boolean));

    if (!rows.length) {
      throw new Error('No data rows found in the Excel worksheet.');
    }
    return { headers, rows };
  }

  throw new Error('Unsupported file type. Please upload a .csv or .xlsx spreadsheet.');
}

export function autoInferColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const matchHeader = (patterns: RegExp[]) =>
    headers.find((h) => patterns.some((p) => p.test(h.toLowerCase())));

  mapping.sku = matchHeader([/^sku$/, /product.?id/, /item.?code/, /code/]);
  mapping.productName = matchHeader([/product.?name/, /^title$/, /^name$/, /item.?name/]);
  mapping.brandName = matchHeader([/^brand/, /manufacturer/, /label/]);
  mapping.categoryId = matchHeader([/^category/]);
  mapping.subcategory = matchHeader([/sub.?cat/]);
  mapping.materialOrFabric = matchHeader([/material/, /fabric/, /composition/]);
  mapping.color = matchHeader([/color/, /colour/, /shade/]);
  mapping.sizeOrDimensions = matchHeader([/size/, /dimension/, /measurement/]);
  mapping.price = matchHeader([/price/, /mrp/, /cost/]);
  mapping.features = matchHeader([/feature/, /spec/]);
  mapping.benefits = matchHeader([/benefit/]);
  mapping.rawNotes = matchHeader([/note/, /description/, /details/]);
  mapping.careLabelProvided = matchHeader([/care/, /wash/]);
  mapping.targetKeywords = matchHeader([/keyword/, /tags/]);
  mapping.targetAudience = matchHeader([/audience/, /gender/]);
  mapping.countryAndMarket = matchHeader([/country/, /market/]);

  return mapping;
}

export function downloadSampleBulkCsv() {
  const sampleCsv = [
    'SKU,Product Name,Brand,Subcategory,Material,Color,Size,Price,Features,Care Label,Notes',
    'KRT-101,Block-Printed Indigo Straight Cotton Kurta,Aanya Looms,Kurtas,100% Cotton,Ivory and Indigo,S / M / L / XL,$48,Hand-block floral motif; three-quarter sleeves; notched mandarin neckline,Machine wash cold gentle cycle; line dry in shade,Breathable summer ethnic kurta for casual and office wear',
    'SNK-204,AeroStride Mesh Cushion Running Sneakers,VeloRun,Sneakers,Breathable engineered mesh upper; EVA foam midsole,Slate Gray / White,UK 7 / UK 8 / UK 9 / UK 10,$95,Padded ankle collar; lace-up closure; textured rubber outsole,,Lightweight daily trainer',
    'SKN-309,Botanical Barrier Renewal Facial Serum,Aura Botanics,Skincare,,Amber glass bottle (colorless-gold serum),30 ml,$36,Dropper applicator; fragrance-free formulation notes,,Ingredients provided: Aqua; Glycerin; Niacinamide 5%; Panthenol; Sodium Hyaluronate',
    'ELC-412,StudioWave ANC Wireless Over-Ear Headphones,SoundCraft,Audio devices,Matte polycarbonate earcups; brushed aluminum hinges,Charcoal Black,190 x 165 x 82 mm; 265 g,$179,Bluetooth 5.3; USB-C charging port; 3.5mm aux jack; foldable hinges,,Package includes headphones; USB-C cable; 3.5mm audio cable; carry pouch',
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + sampleCsv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aivora-sample-catalog.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
