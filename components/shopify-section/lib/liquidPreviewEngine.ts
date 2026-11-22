import type { StoreCatalogPreset } from '../data/samples';
import type { ShopifySectionSchema } from '../types/shopify';

export interface PreviewBlockInstance {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface LiquidPreviewInput {
  liquidCode: string;
  schema: ShopifySectionSchema | null;
  sectionSettings: Record<string, unknown>;
  blocks: PreviewBlockInstance[];
  catalog: StoreCatalogPreset;
  uploadedPreviewImageUrl?: string;
}

const SECTION_ID = 'aivora-preview-01';

function createPlaceholderImageUri(label = 'Shopify Image Picker'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F1F5F9"/>
        <stop offset="100%" stop-color="#E2E8F0"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <rect x="330" y="220" width="140" height="110" rx="8" fill="none" stroke="#94A3B8" stroke-width="3"/>
    <circle cx="366" cy="255" r="12" fill="#94A3B8"/>
    <path d="M340 315 L384 275 L415 300 L435 282 L460 315 Z" fill="#94A3B8"/>
    <text x="400" y="365" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#64748B">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createPlaceholderSvgTag(typeName = 'image'): string {
  return `<svg class="placeholder-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525.5 525.5" style="width:100%;height:100%;background:#f1f5f9;fill:#94a3b8;display:block;"><path d="M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1v92.5z"/><path d="M210.4 299.5H318v-77.2H210.4v77.2zm1.7-75.5h104.2v46.3l-24.2-21.5c-.7-.6-1.7-.6-2.3 0l-25.8 23.6-18-16.4c-.7-.6-1.7-.6-2.3 0l-31.6 29v-61z"/></svg><!-- ${typeName} -->`;
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const normalized = path.replace(/\[(['"]?)([^'"\]]+)\1\]/g, '.$2');
  const parts = normalized.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      if (part === 'size' && Array.isArray(current)) return current.length;
      if (part === 'first' && Array.isArray(current)) return current[0];
      if (part === 'last' && Array.isArray(current)) return current[current.length - 1];
      current = (current as Record<string, unknown>)[part];
    } else if (typeof current === 'string' && part === 'size') {
      return current.length;
    } else {
      return undefined;
    }
  }
  return current;
}

function isTruthy(val: unknown): boolean {
  if (val === false || val === null || val === undefined || val === '' || val === 0) {
    return false;
  }
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

function parseLiteralOrLookup(token: string, ctx: Record<string, unknown>): unknown {
  const t = token.trim();
  if (!t) return '';
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'nil' || t === 'null' || t === 'blank' || t === 'empty') return '';
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return getByPath(ctx, t);
}

function evaluateCondition(rawCond: string, ctx: Record<string, unknown>): boolean {
  const cond = rawCond.trim();
  // Handle `or` / `and` top-level splits outside quotes
  if (/\s+or\s+/.test(cond)) {
    return cond.split(/\s+or\s+/).some((part) => evaluateCondition(part, ctx));
  }
  if (/\s+and\s+/.test(cond)) {
    return cond.split(/\s+and\s+/).every((part) => evaluateCondition(part, ctx));
  }

  const ops = ['!=', '==', '>=', '<=', '>', '<', ' contains '];
  for (const op of ops) {
    const idx = cond.indexOf(op);
    if (idx !== -1) {
      const leftRaw = cond.slice(0, idx).trim();
      const rightRaw = cond.slice(idx + op.length).trim();
      const left = parseLiteralOrLookup(leftRaw, ctx);
      const right = parseLiteralOrLookup(rightRaw, ctx);

      if (rightRaw === 'blank' || rightRaw === 'empty') {
        const empty = left === '' || left === null || left === undefined || (Array.isArray(left) && left.length === 0);
        return op === '==' ? empty : !empty;
      }

      switch (op.trim()) {
        case '==':
          return left == right;
        case '!=':
          return left != right;
        case '>':
          return Number(left) > Number(right);
        case '<':
          return Number(left) < Number(right);
        case '>=':
          return Number(left) >= Number(right);
        case '<=':
          return Number(left) <= Number(right);
        case 'contains':
          if (typeof left === 'string') return left.includes(String(right ?? ''));
          if (Array.isArray(left)) return left.includes(right);
          return false;
      }
    }
  }

  const val = parseLiteralOrLookup(cond, ctx);
  return isTruthy(val);
}

function applyFilter(value: unknown, filterRaw: string, ctx: Record<string, unknown>): unknown {
  const colonIdx = filterRaw.indexOf(':');
  const filterName = (colonIdx === -1 ? filterRaw : filterRaw.slice(0, colonIdx)).trim();
  const argsRaw = colonIdx === -1 ? '' : filterRaw.slice(colonIdx + 1).trim();

  const firstArg = () => {
    const first = argsRaw.split(',')[0]?.trim() || '';
    return parseLiteralOrLookup(first, ctx);
  };

  switch (filterName) {
    case 'default': {
      const empty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      return empty ? firstArg() : value;
    }
    case 'escape':
    case 'h':
    case 'html_escape':
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    case 'strip_html':
      return String(value ?? '').replace(/<[^>]*>/g, '');
    case 'upcase':
      return String(value ?? '').toUpperCase();
    case 'downcase':
      return String(value ?? '').toLowerCase();
    case 'capitalize': {
      const s = String(value ?? '');
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    case 'handleize':
    case 'handle':
      return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    case 'truncatewords': {
      const limit = Number(firstArg()) || 20;
      const words = String(value ?? '').split(/\s+/);
      return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : words.join(' ');
    }
    case 'truncate': {
      const limit = Number(firstArg()) || 50;
      const str = String(value ?? '');
      return str.length > limit ? `${str.slice(0, limit)}...` : str;
    }
    case 'append':
      return `${String(value ?? '')}${String(firstArg() ?? '')}`;
    case 'prepend':
      return `${String(firstArg() ?? '')}${String(value ?? '')}`;
    case 'replace': {
      const parts = argsRaw.split(',').map((p) => String(parseLiteralOrLookup(p.trim(), ctx) ?? ''));
      return String(value ?? '').split(parts[0] || '').join(parts[1] || '');
    }
    case 'plus':
      return Number(value || 0) + Number(firstArg() || 0);
    case 'minus':
      return Number(value || 0) - Number(firstArg() || 0);
    case 'times':
      return Number(value || 0) * Number(firstArg() || 0);
    case 'divided_by': {
      const divisor = Number(firstArg() || 1);
      return divisor === 0 ? 0 : Number(value || 0) / divisor;
    }
    case 'round':
      return Math.round(Number(value || 0));
    case 'ceil':
      return Math.ceil(Number(value || 0));
    case 'floor':
      return Math.floor(Number(value || 0));
    case 'size':
      if (Array.isArray(value) || typeof value === 'string') return value.length;
      return 0;
    case 'money':
    case 'money_with_currency': {
      const cents = Number(value ?? 0);
      return `$${(cents / 100).toFixed(2)}`;
    }
    case 'money_without_trailing_zeros': {
      const cents = Number(value ?? 0);
      const formatted = (cents / 100).toFixed(2);
      return `$${formatted.replace(/\.00$/, '')}`;
    }
    case 'image_url': {
      if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown>;
        if (typeof v.src === 'string') return v.src;
        if (typeof (v.preview_image as Record<string, unknown>)?.src === 'string') {
          return (v.preview_image as Record<string, unknown>).src;
        }
      }
      if (typeof value === 'string' && value.length > 0) return value;
      return createPlaceholderImageUri();
    }
    case 'image_tag': {
      const src =
        typeof value === 'string' && value.length > 0
          ? value
          : typeof value === 'object' && value !== null && 'src' in value
            ? String((value as { src: string }).src)
            : createPlaceholderImageUri();
      const classMatch = argsRaw.match(/class:\s*['"]([^'"]+)['"]/);
      const altMatch = argsRaw.match(/alt:\s*['"]([^'"]*)['"]/);
      const cls = classMatch ? ` class="${classMatch[1]}"` : '';
      const alt = altMatch ? altMatch[1] : 'Shopify section media';
      return `<img src="${src}" alt="${alt}"${cls} loading="lazy" style="max-width:100%;height:auto;" />`;
    }
    case 'placeholder_svg_tag':
      return createPlaceholderSvgTag(String(value || 'image'));
    case 't': {
      const key = String(value ?? '');
      const last = key.split('.').pop() || key;
      return last.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }
    case 'font_face':
      return '';
    case 'json':
      return JSON.stringify(value ?? null);
    default:
      return value;
  }
}

function evaluateExpression(expr: string, ctx: Record<string, unknown>): unknown {
  // Split by pipe `|` outside quotes
  const parts: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    if (ch === '|' && !inSingle && !inDouble) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());

  let val = parseLiteralOrLookup(parts[0] || '', ctx);
  for (let i = 1; i < parts.length; i++) {
    val = applyFilter(val, parts[i], ctx);
  }
  return val;
}

interface Token {
  type: 'text' | 'output' | 'tag';
  raw: string;
  tagName?: string;
  tagBody?: string;
}

function tokenizeLiquid(template: string): Token[] {
  // Expand `{%- liquid ... -%}` blocks into individual `{% ... %}` tags first
  const expanded = template.replace(
    /\{%-?\s*liquid\s+([\s\S]*?)-?%\}/g,
    (_m, inner: string) =>
      inner
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => `{% ${line} %}`)
        .join('')
  );

  // Strip comments {% comment %}...{% endcomment %}
  const withoutComments = expanded.replace(
    /\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g,
    ''
  );

  const tokens: Token[] = [];
  const regex = /(\{\{-?[\s\S]*?-?\}\}|\{%-?[\s\S]*?-?%\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(withoutComments)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', raw: withoutComments.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('{{')) {
      const inner = raw.replace(/^\{\{-?/, '').replace(/-?\}\}$/, '').trim();
      tokens.push({ type: 'output', raw: inner });
    } else {
      const inner = raw.replace(/^\{%-?/, '').replace(/-?%\}$/, '').trim();
      const spaceIdx = inner.search(/\s/);
      const tagName = spaceIdx === -1 ? inner : inner.slice(0, spaceIdx);
      const tagBody = spaceIdx === -1 ? '' : inner.slice(spaceIdx + 1).trim();
      tokens.push({ type: 'tag', raw: inner, tagName, tagBody });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < withoutComments.length) {
    tokens.push({ type: 'text', raw: withoutComments.slice(lastIndex) });
  }

  return tokens;
}

function findMatchingEnd(
  tokens: Token[],
  startIdx: number,
  openNames: string[],
  endName: string
): number {
  let depth = 1;
  for (let i = startIdx; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'tag' && tok.tagName) {
      if (openNames.includes(tok.tagName)) depth++;
      else if (tok.tagName === endName) {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return tokens.length;
}

function renderTokens(
  tokens: Token[],
  start: number,
  end: number,
  ctx: Record<string, unknown>
): string {
  let out = '';
  let i = start;

  while (i < end) {
    const tok = tokens[i];
    if (tok.type === 'text') {
      out += tok.raw;
      i++;
      continue;
    }
    if (tok.type === 'output') {
      const val = evaluateExpression(tok.raw, ctx);
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && 'src' in (val as Record<string, unknown>)) {
          out += String((val as { src: string }).src);
        } else {
          out += String(val);
        }
      }
      i++;
      continue;
    }

    const tag = tok.tagName || '';
    const body = tok.tagBody || '';

    if (tag === 'assign') {
      const eqIdx = body.indexOf('=');
      if (eqIdx !== -1) {
        const varName = body.slice(0, eqIdx).trim();
        const expr = body.slice(eqIdx + 1).trim();
        ctx[varName] = evaluateExpression(expr, ctx);
      }
      i++;
      continue;
    }

    if (tag === 'echo') {
      const val = evaluateExpression(body, ctx);
      if (val !== undefined && val !== null) out += String(val);
      i++;
      continue;
    }

    if (tag === 'capture') {
      const endIdx = findMatchingEnd(tokens, i + 1, ['capture'], 'endcapture');
      ctx[body.trim()] = renderTokens(tokens, i + 1, endIdx, ctx);
      i = endIdx + 1;
      continue;
    }

    if (tag === 'if' || tag === 'unless') {
      const endTag = tag === 'if' ? 'endif' : 'endunless';
      const endIdx = findMatchingEnd(tokens, i + 1, [tag], endTag);

      // Collect branches at depth 0
      const branches: Array<{ cond: string | null; start: number; end: number }> = [];
      let branchStart = i + 1;
      let branchCond: string | null = body;
      let depth = 0;

      for (let j = i + 1; j < endIdx; j++) {
        const t = tokens[j];
        if (t.type === 'tag' && t.tagName) {
          if (t.tagName === 'if' || t.tagName === 'unless') depth++;
          else if (t.tagName === 'endif' || t.tagName === 'endunless') depth--;
          else if (depth === 0 && (t.tagName === 'elsif' || t.tagName === 'else')) {
            branches.push({ cond: branchCond, start: branchStart, end: j });
            branchCond = t.tagName === 'else' ? null : t.tagBody || '';
            branchStart = j + 1;
          }
        }
      }
      branches.push({ cond: branchCond, start: branchStart, end: endIdx });

      for (let b = 0; b < branches.length; b++) {
        const br = branches[b];
        let match = false;
        if (br.cond === null) {
          match = true;
        } else if (tag === 'unless' && b === 0) {
          match = !evaluateCondition(br.cond, ctx);
        } else {
          match = evaluateCondition(br.cond, ctx);
        }
        if (match) {
          out += renderTokens(tokens, br.start, br.end, ctx);
          break;
        }
      }

      i = endIdx + 1;
      continue;
    }

    if (tag === 'case') {
      const endIdx = findMatchingEnd(tokens, i + 1, ['case'], 'endcase');
      const subject = evaluateExpression(body, ctx);
      const branches: Array<{ values: string[] | null; start: number; end: number }> = [];
      let branchStart = -1;
      let branchValues: string[] | null = null;
      let depth = 0;

      for (let j = i + 1; j < endIdx; j++) {
        const t = tokens[j];
        if (t.type === 'tag' && t.tagName) {
          if (t.tagName === 'case') depth++;
          else if (t.tagName === 'endcase') depth--;
          else if (depth === 0 && (t.tagName === 'when' || t.tagName === 'else')) {
            if (branchStart !== -1) {
              branches.push({ values: branchValues, start: branchStart, end: j });
            }
            branchValues =
              t.tagName === 'else'
                ? null
                : (t.tagBody || '').split(',').map((s) => s.trim());
            branchStart = j + 1;
          }
        }
      }
      if (branchStart !== -1) {
        branches.push({ values: branchValues, start: branchStart, end: endIdx });
      }

      for (const br of branches) {
        if (br.values === null) {
          out += renderTokens(tokens, br.start, br.end, ctx);
          break;
        }
        const matched = br.values.some(
          (v) => parseLiteralOrLookup(v, ctx) == subject
        );
        if (matched) {
          out += renderTokens(tokens, br.start, br.end, ctx);
          break;
        }
      }
      i = endIdx + 1;
      continue;
    }

    if (tag === 'for') {
      const endIdx = findMatchingEnd(tokens, i + 1, ['for'], 'endfor');
      const match = body.match(/^(\w+)\s+in\s+(.+)$/);
      if (match) {
        const itemVar = match[1];
        const rest = match[2];
        const parts = rest.split(/\s+(?=limit:|offset:|reversed)/);
        const collectionExpr = parts[0].trim();

        let limit: number | undefined;
        let offset = 0;
        let reversed = false;

        for (let p = 1; p < parts.length; p++) {
          const part = parts[p].trim();
          if (part.startsWith('limit:')) {
            limit = Number(evaluateExpression(part.slice(6).trim(), ctx));
          } else if (part.startsWith('offset:')) {
            offset = Number(evaluateExpression(part.slice(7).trim(), ctx)) || 0;
          } else if (part === 'reversed') {
            reversed = true;
          }
        }

        let items: unknown[] = [];
        const rangeMatch = collectionExpr.match(/^\((.+)\.\.(.+)\)$/);
        if (rangeMatch) {
          const startNum = Number(evaluateExpression(rangeMatch[1], ctx)) || 1;
          const endNum = Number(evaluateExpression(rangeMatch[2], ctx)) || 1;
          for (let n = startNum; n <= endNum; n++) items.push(n);
        } else {
          const resolved = evaluateExpression(collectionExpr, ctx);
          if (Array.isArray(resolved)) items = [...resolved];
        }

        if (reversed) items.reverse();
        if (offset > 0) items = items.slice(offset);
        if (typeof limit === 'number' && !Number.isNaN(limit)) items = items.slice(0, limit);

        // Check for {% else %} inside for loop
        let elseIdx = -1;
        let depth = 0;
        for (let j = i + 1; j < endIdx; j++) {
          const t = tokens[j];
          if (t.type === 'tag' && t.tagName) {
            if (t.tagName === 'for') depth++;
            else if (t.tagName === 'endfor') depth--;
            else if (depth === 0 && t.tagName === 'else') {
              elseIdx = j;
              break;
            }
          }
        }

        const loopBodyEnd = elseIdx !== -1 ? elseIdx : endIdx;

        if (items.length === 0 && elseIdx !== -1) {
          out += renderTokens(tokens, elseIdx + 1, endIdx, ctx);
        } else {
          items.forEach((item, idx) => {
            const loopCtx = {
              ...ctx,
              [itemVar]: item,
              forloop: {
                index: idx + 1,
                index0: idx,
                rindex: items.length - idx,
                rindex0: items.length - idx - 1,
                first: idx === 0,
                last: idx === items.length - 1,
                length: items.length,
              },
            };
            out += renderTokens(tokens, i + 1, loopBodyEnd, loopCtx);
          });
        }
      }
      i = endIdx + 1;
      continue;
    }

    if (tag === 'form') {
      const endIdx = findMatchingEnd(tokens, i + 1, ['form'], 'endform');
      out += `<form method="post" action="/cart/add" class="aivora-shopify-form">`;
      out += renderTokens(tokens, i + 1, endIdx, ctx);
      out += `</form>`;
      i = endIdx + 1;
      continue;
    }

    if (tag === 'paginate') {
      const endIdx = findMatchingEnd(tokens, i + 1, ['paginate'], 'endpaginate');
      out += renderTokens(tokens, i + 1, endIdx, ctx);
      i = endIdx + 1;
      continue;
    }

    // Unknown or standalone tag — skip gracefully
    i++;
  }

  return out;
}

export function buildPreviewSrcDoc(input: LiquidPreviewInput): string {
  const { liquidCode, schema, sectionSettings, blocks, catalog, uploadedPreviewImageUrl } = input;

  // Build hydrated settings: populate blank image_picker fields with crisp studio visual or uploaded ref
  const hydratedSettings: Record<string, unknown> = { ...sectionSettings };
  if (schema?.settings) {
    for (const s of schema.settings) {
      if (!s.id) continue;
      if (s.type === 'image_picker' && !hydratedSettings[s.id]) {
        hydratedSettings[s.id] = {
          src: uploadedPreviewImageUrl || catalog.products[0]?.featured_image.src || createPlaceholderImageUri(),
          alt: s.label || 'Featured media',
        };
      }
      if (s.type === 'collection' && !hydratedSettings[s.id]) {
        hydratedSettings[s.id] = {
          title: catalog.collectionTitle,
          description: catalog.collectionDescription,
          url: '/collections/all',
          products: catalog.products,
          products_count: catalog.products.length,
          image: catalog.products[0]?.featured_image,
        };
      }
      if (s.type === 'product' && !hydratedSettings[s.id]) {
        hydratedSettings[s.id] = catalog.products[0];
      }
    }
  }

  const hydratedBlocks = blocks.map((blk, idx) => {
    const blkSchema = schema?.blocks?.find((b) => b.type === blk.type);
    const blkSettings = { ...blk.settings };
    if (blkSchema?.settings) {
      for (const s of blkSchema.settings) {
        if (!s.id) continue;
        if (s.type === 'image_picker' && !blkSettings[s.id]) {
          const prodImg = catalog.products[idx % catalog.products.length]?.featured_image;
          blkSettings[s.id] = prodImg || {
            src: createPlaceholderImageUri(),
            alt: blkSchema.name,
          };
        }
        if (s.type === 'product' && !blkSettings[s.id]) {
          blkSettings[s.id] = catalog.products[idx % catalog.products.length];
        }
        if (s.type === 'collection' && !blkSettings[s.id]) {
          blkSettings[s.id] = {
            title: catalog.collectionTitle,
            url: '/collections/all',
            products: catalog.products,
          };
        }
      }
    }
    return {
      id: blk.id,
      type: blk.type,
      settings: blkSettings,
      shopify_attributes: `data-shopify-editor-block='{"id":"${blk.id}","type":"${blk.type}"}'`,
    };
  });

  const ctx: Record<string, unknown> = {
    section: {
      id: SECTION_ID,
      settings: hydratedSettings,
      blocks: hydratedBlocks,
    },
    collection: {
      title: catalog.collectionTitle,
      description: catalog.collectionDescription,
      url: '/collections/all',
      products: catalog.products,
      products_count: catalog.products.length,
    },
    collections: {
      all: {
        title: catalog.collectionTitle,
        products: catalog.products,
      },
    },
    product: catalog.products[0],
    shop: {
      name: catalog.shopName,
      url: 'https://example.myshopify.com',
      currency: 'USD',
    },
    routes: {
      root_url: '/',
      all_products_collection_url: '/collections/all',
      cart_add_url: '/cart/add',
      cart_url: '/cart',
      search_url: '/search',
    },
    cart: {
      item_count: 1,
      total_price: 4800,
    },
    settings: {
      page_width: 1200,
    },
  };

  // Strip schema block
  let working = liquidCode.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '');

  // Extract {% style %} / <style> blocks
  const styleBlocks: string[] = [];
  working = working.replace(
    /\{%-?\s*style\s*-?%\}([\s\S]*?)\{%-?\s*endstyle\s*-?%\}/g,
    (_m, css: string) => {
      styleBlocks.push(css);
      return '';
    }
  );
  working = working.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    styleBlocks.push(css);
    return '';
  });

  // Extract {% javascript %} / <script> blocks
  const scriptBlocks: string[] = [];
  working = working.replace(
    /\{%-?\s*javascript\s*-?%\}([\s\S]*?)\{%-?\s*endjavascript\s*-?%\}/g,
    (_m, js: string) => {
      scriptBlocks.push(js);
      return '';
    }
  );
  working = working.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_m, js: string) => {
    scriptBlocks.push(js);
    return '';
  });

  // Evaluate CSS blocks through Liquid (handles {{ section.id }}, {{ section.settings.* }})
  const evaluatedCss = styleBlocks
    .map((css) => renderTokens(tokenizeLiquid(css), 0, tokenizeLiquid(css).length, { ...ctx }))
    .join('\n');

  // Evaluate HTML body through Liquid
  const bodyTokens = tokenizeLiquid(working);
  const evaluatedHtml = renderTokens(bodyTokens, 0, bodyTokens.length, { ...ctx });

  // Evaluate JS blocks (in case {{ section.id }} is referenced inside <script>)
  const evaluatedJs = scriptBlocks
    .map((js) => renderTokens(tokenizeLiquid(js), 0, tokenizeLiquid(js).length, { ...ctx }))
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      -webkit-font-smoothing: antialiased;
    }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
    .page-width { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .visually-hidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
    }
    #aivora-preview-toast {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: #0F172A;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 500;
      padding: 10px 14px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      z-index: 9999;
    }
    #aivora-preview-toast.visible {
      opacity: 1;
      transform: translateY(0);
    }
    ${evaluatedCss}
  </style>
</head>
<body>
  <div id="shopify-section-${SECTION_ID}" class="shopify-section">
    ${evaluatedHtml}
  </div>
  <div id="aivora-preview-toast" role="status" aria-live="polite"></div>
  <script>
    (function() {
      var toast = document.getElementById('aivora-preview-toast');
      var timer = null;
      function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('visible');
        clearTimeout(timer);
        timer = setTimeout(function() { toast.classList.remove('visible'); }, 2400);
      }
      document.addEventListener('click', function(e) {
        var anchor = e.target.closest('a');
        if (anchor && anchor.getAttribute('href') && !anchor.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          showToast('Preview link: ' + anchor.getAttribute('href'));
        }
      });
      document.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Cart action simulated (/cart/add)');
      });
    })();
    try {
      ${evaluatedJs}
    } catch (err) {
      console.warn('Section script preview warning:', err);
    }
  </script>
</body>
</html>`;
}
