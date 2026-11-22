import type {
  LiquidValidationResult,
  ShopifySectionSchema,
  ValidationCheckItem,
} from '../types/shopify';

const VALID_SHOPIFY_SETTING_TYPES = new Set([
  'text',
  'textarea',
  'inline_richtext',
  'richtext',
  'html',
  'liquid',
  'number',
  'range',
  'checkbox',
  'radio',
  'select',
  'color',
  'color_background',
  'color_scheme',
  'color_scheme_group',
  'font_picker',
  'image_picker',
  'video',
  'video_url',
  'product',
  'product_list',
  'collection',
  'collection_list',
  'url',
  'article',
  'blog',
  'page',
  'link_list',
  'header',
  'paragraph',
]);

function countTagOccurrences(code: string, tagName: string): number {
  const regex = new RegExp(`\\{%-?\\s*${tagName}(?:\\s|%|-?\\})`, 'g');
  return (code.match(regex) || []).length;
}

export function extractSchemaJson(liquidCode: string): {
  rawJson: string | null;
  parsed: ShopifySectionSchema | null;
  parseError: string | null;
} {
  const match = liquidCode.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!match) {
    return {
      rawJson: null,
      parsed: null,
      parseError: 'Missing {% schema %} ... {% endschema %} block.',
    };
  }
  const rawJson = match[1].trim();
  try {
    const parsed = JSON.parse(rawJson) as ShopifySectionSchema;
    return { rawJson, parsed, parseError: null };
  } catch (err) {
    return {
      rawJson,
      parsed: null,
      parseError: err instanceof Error ? err.message : 'Invalid JSON inside {% schema %}.',
    };
  }
}

export function validateLiquidSection(liquidCode: string): LiquidValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: ValidationCheckItem[] = [];

  const trimmed = (liquidCode || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      errors: ['Liquid section code is empty.'],
      warnings: [],
      checks: [
        {
          id: 'non-empty',
          label: 'Section code present',
          passed: false,
          severity: 'error',
          detail: 'No Liquid code provided.',
        },
      ],
      parsedSchema: null,
    };
  }

  // 1. Check React / Next.js artifacts
  const reactArtifactPatterns = [
    /\bclassName\s*=/,
    /\bimport\s+React\b/,
    /\buseState\s*\(/,
    /\buseEffect\s*\(/,
    /\bexport\s+default\s+function\b/,
  ];
  const hasReactArtifacts = reactArtifactPatterns.some((re) => re.test(trimmed));
  if (hasReactArtifacts) {
    errors.push('Detected React/JSX syntax instead of pure Shopify Liquid.');
  }
  checks.push({
    id: 'pure-liquid',
    label: 'Pure Shopify Liquid (no React/JSX)',
    passed: !hasReactArtifacts,
    severity: 'error',
    detail: hasReactArtifacts
      ? 'Found JSX/React syntax (e.g. className or hooks).'
      : 'Clean HTML/Liquid markup with zero JS framework leakage.',
  });

  // 2. Check Liquid control tag balance
  const balancedPairs: Array<[string, string]> = [
    ['if', 'endif'],
    ['unless', 'endunless'],
    ['for', 'endfor'],
    ['case', 'endcase'],
    ['capture', 'endcapture'],
    ['form', 'endform'],
    ['style', 'endstyle'],
    ['schema', 'endschema'],
  ];

  const unbalancedTags: string[] = [];
  for (const [openTag, closeTag] of balancedPairs) {
    const openCount = countTagOccurrences(trimmed, openTag);
    const closeCount = countTagOccurrences(trimmed, closeTag);
    if (openCount !== closeCount) {
      unbalancedTags.push(`${openTag} (${openCount}) / ${closeTag} (${closeCount})`);
    }
  }

  if (unbalancedTags.length > 0) {
    errors.push(`Unbalanced Liquid tags: ${unbalancedTags.join(', ')}`);
  }
  checks.push({
    id: 'tag-balance',
    label: 'Balanced Liquid control tags',
    passed: unbalancedTags.length === 0,
    severity: 'error',
    detail:
      unbalancedTags.length === 0
        ? 'All {% if %}, {% for %}, {% case %}, {% style %}, and {% schema %} tags close cleanly.'
        : `Mismatched counts: ${unbalancedTags.join('; ')}`,
  });

  // 3. Schema extraction & JSON validation
  const { parsed: parsedSchema, parseError } = extractSchemaJson(trimmed);
  if (parseError || !parsedSchema) {
    errors.push(parseError || 'Invalid schema JSON.');
  }
  checks.push({
    id: 'schema-json',
    label: 'Valid {% schema %} JSON',
    passed: Boolean(parsedSchema && !parseError),
    severity: 'error',
    detail:
      parsedSchema && !parseError
        ? `Parsed schema "${parsedSchema.name || 'Unnamed'}" (${parsedSchema.settings?.length ?? 0} settings, ${parsedSchema.blocks?.length ?? 0} block types).`
        : parseError || 'Schema JSON could not be parsed.',
  });

  // 4. Schema OS 2.0 specification checks
  let schemaSpecValid = true;
  const schemaIssues: string[] = [];
  if (parsedSchema) {
    if (!parsedSchema.name || typeof parsedSchema.name !== 'string') {
      schemaSpecValid = false;
      schemaIssues.push('Missing top-level "name" string.');
    }
    if (!Array.isArray(parsedSchema.settings)) {
      schemaSpecValid = false;
      schemaIssues.push('Missing "settings" array.');
    } else {
      for (const setting of parsedSchema.settings) {
        if (!setting.type || !VALID_SHOPIFY_SETTING_TYPES.has(setting.type)) {
          schemaSpecValid = false;
          schemaIssues.push(`Unsupported setting type "${setting.type || 'unknown'}".`);
        }
        if (setting.type !== 'header' && setting.type !== 'paragraph' && !setting.id) {
          schemaSpecValid = false;
          schemaIssues.push(`Setting of type "${setting.type}" is missing an "id".`);
        }
        if (setting.type === 'range') {
          if (
            typeof setting.min !== 'number' ||
            typeof setting.max !== 'number' ||
            typeof setting.step !== 'number' ||
            typeof setting.default !== 'number'
          ) {
            schemaSpecValid = false;
            schemaIssues.push(`Range setting "${setting.id}" requires numeric min, max, step, and default.`);
          }
        }
        if (setting.type === 'select' && (!Array.isArray(setting.options) || setting.options.length === 0)) {
          schemaSpecValid = false;
          schemaIssues.push(`Select setting "${setting.id}" requires non-empty options array.`);
        }
      }
    }

    if (!Array.isArray(parsedSchema.presets) || parsedSchema.presets.length === 0) {
      warnings.push('Schema does not define "presets" — section will not appear in Theme Editor "Add section" picker.');
    }

    if (!schemaSpecValid) {
      errors.push(...schemaIssues);
    }
  } else {
    schemaSpecValid = false;
  }

  checks.push({
    id: 'schema-spec',
    label: 'Online Store 2.0 schema rules',
    passed: schemaSpecValid,
    severity: 'error',
    detail: schemaSpecValid
      ? 'All setting types, range bounds, select options, and section metadata follow Shopify OS 2.0 specs.'
      : schemaIssues.join(' ') || 'Schema failed OS 2.0 validation.',
  });

  // 5. Block shopify_attributes check
  const usesBlocks = /section\.blocks/.test(trimmed);
  const hasShopifyAttributes = /block\.shopify_attributes/.test(trimmed);
  if (usesBlocks && !hasShopifyAttributes) {
    warnings.push('Section iterates over section.blocks without {{ block.shopify_attributes }}. Theme Editor block selection requires it.');
  }
  checks.push({
    id: 'shopify-attributes',
    label: 'Theme Editor block attributes',
    passed: !usesBlocks || hasShopifyAttributes,
    severity: 'warning',
    detail: !usesBlocks
      ? 'No repeatable blocks used in this section.'
      : hasShopifyAttributes
        ? 'Includes {{ block.shopify_attributes }} for Theme Editor live block inspector.'
        : 'Add {{ block.shopify_attributes }} on each block wrapper element.',
  });

  // 6. Scoped CSS & responsive breakpoints
  const hasSectionScope = /#shopify-section-\{\{\s*section\.id\s*\}\}|\.section-\{\{\s*section\.id\s*\}\}/.test(trimmed);
  const hasMediaQuery = /@media\s/.test(trimmed);
  if (!hasSectionScope) {
    warnings.push('CSS is not scoped to {{ section.id }}; styles may collide across multiple section instances.');
  }
  if (!hasMediaQuery) {
    warnings.push('No @media responsive breakpoints detected in section CSS.');
  }

  checks.push({
    id: 'scoped-responsive-css',
    label: 'Scoped & responsive CSS',
    passed: hasSectionScope && hasMediaQuery,
    severity: 'warning',
    detail:
      hasSectionScope && hasMediaQuery
        ? 'Styles are isolated to {{ section.id }} with responsive @media queries.'
        : !hasSectionScope
          ? 'Consider scoping selectors with #shopify-section-{{ section.id }} or .section-{{ section.id }}.'
          : 'Consider adding @media queries for mobile/tablet breakpoints.',
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checks,
    parsedSchema,
  };
}
