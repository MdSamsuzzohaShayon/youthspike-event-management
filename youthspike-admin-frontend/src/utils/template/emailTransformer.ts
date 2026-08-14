// ─────────────────────────────────────────────────────────────
// utils/emailTransform.ts
// Email Transform Pipeline: TipTap HTML → Email-safe HTML
// ─────────────────────────────────────────────────────────────

const BASE_FONT = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;`;

const TAG_STYLES: Record<string, string> = {
  p: `margin:0 0 12px 0;${BASE_FONT}`,
  h1: `margin:0 0 16px 0;font-size:26px;font-weight:700;line-height:1.25;color:#0f172a;${BASE_FONT}`,
  h2: `margin:0 0 14px 0;font-size:20px;font-weight:700;line-height:1.3;color:#1e293b;${BASE_FONT}`,
  h3: `margin:0 0 12px 0;font-size:17px;font-weight:600;line-height:1.4;color:#334155;${BASE_FONT}`,
  strong: `font-weight:700;`,
  em: `font-style:italic;`,
  u: `text-decoration:underline;`,
  s: `text-decoration:line-through;`,
  a: `color:#2563eb;text-decoration:underline;`,
  blockquote: `margin:12px 0;padding:10px 16px;border-left:3px solid #94a3b8;color:#64748b;${BASE_FONT}`,
  hr: `border:none;border-top:1px solid #e2e8f0;margin:20px 0;`,
  ul: `margin:0 0 12px 0;padding-left:24px;`,
  ol: `margin:0 0 12px 0;padding-left:24px;`,
  li: `margin:0 0 4px 0;${BASE_FONT}`,
  // FIX: Remove borders from tables - make them transparent
  table: `width:100%;border-collapse:collapse;margin:12px 0;`,
  // FIX: Remove default borders from th and td
  th: `padding:8px 12px;text-align:left;font-weight:600;font-size:14px;color:#374151;`,
  td: `padding:8px 12px;text-align:left;font-size:14px;color:#374151;vertical-align:top;`,
  code: `font-family:'Courier New',Courier,monospace;font-size:13px;background:#f1f5f9;padding:1px 4px;border-radius:3px;color:#0f172a;`,
  span: ``,
  div: ``,
};

// ── MSO conditional wrapper ───────────────────────────────────
const MSO_OPEN = `<!--[if mso]><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->`;
const MSO_CLOSE = `<!--[if mso]></td></tr></table><![endif]-->`;

// ── Outer email wrapper ───────────────────────────────────────
export function wrapEmailShell(bodyHtml: string, subject = ''): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(subject)}</title>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
<style type="text/css">
  body, #bodyTable { margin:0; padding:0; }
  img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  .placeholder-node { background:#ede9fe !important; color:#4338ca !important; font-family:monospace !important; font-size:0.85em !important; padding:1px 4px !important; border-radius:3px !important; }
  @media only screen and (max-width:600px) {
    .email-container { width:100% !important; }
  }
</style>
</head>
<!-- FIX: Remove background color from body -->
<body style="margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- FIX: Remove background color from table -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" id="bodyTable" style="background:transparent;">
  <tr>
    <td align="center" style="padding:24px 12px;background:transparent;">
      <!-- FIX: Remove white background and border-radius from container -->
      <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:transparent;">
        <tr>
          <td style="padding:0;">
            ${bodyHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── Core transformer ──────────────────────────────────────────
export function transformToEmailHtml(tiptapHtml: string): string {
  if (typeof window === 'undefined') {
    return tiptapHtml;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${tiptapHtml}</div>`, 'text/html');
  const root = doc.getElementById('__root')!;

  processNode(root);

  return root.innerHTML;
}

// ── Node processor ────────────────────────────────────────────
function processNode(el: Element): void {
  const tag = el.tagName.toLowerCase();

  // ── Preserve placeholder nodes ────────────────────────────
  if (el.getAttribute('data-type') === 'placeholder-node') {
    const key = el.getAttribute('data-placeholder') ?? '';
    el.removeAttribute('class');
    el.setAttribute(
      'style',
      `display:inline;padding:1px 4px;border-radius:3px;font-family:'Courier New',monospace;font-size:0.85em;background:#ede9fe;color:#4338ca;`,
    );
    el.setAttribute('class', 'placeholder-node');
    el.textContent = `{{${key}}}`;
    return;
  }

  // ── Recurse children first (bottom-up) ───────────────────
  Array.from(el.children).forEach(processNode);

  // ── Apply inline styles ───────────────────────────────────
  const baseStyle = TAG_STYLES[tag] ?? '';
  const existingStyle = el.getAttribute('style') ?? '';

  const merged = mergeStyles(baseStyle, existingStyle);
  if (merged) el.setAttribute('style', merged);

  // Strip class attributes
  el.removeAttribute('class');

  // ── Tag-specific transforms ───────────────────────────────
  switch (tag) {
    case 'ul':
      transformList(el as HTMLElement, 'disc');
      break;
    case 'ol':
      transformList(el as HTMLElement, 'decimal');
      break;
    case 'img':
      transformImage(el as HTMLImageElement);
      break;
    case 'a':
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
      break;
    case 'pre':
    case 'code':
      el.setAttribute(
        'style',
        `font-family:'Courier New',Courier,monospace;font-size:13px;background:#f1f5f9;padding:8px 12px;border-radius:4px;color:#0f172a;display:block;white-space:pre-wrap;word-break:break-all;`,
      );
      break;
    // FIX: Remove table borders
    case 'table':
      el.setAttribute('border', '0');
      el.setAttribute('cellspacing', '0');
      el.setAttribute('cellpadding', '0');
      // Remove any existing border styles
      const tableStyle = el.getAttribute('style') || '';
      el.setAttribute('style', tableStyle.replace(/border[^;]*;?/gi, ''));
      break;
    case 'th':
    case 'td':
      // Remove any existing border styles
      const cellStyle = el.getAttribute('style') || '';
      el.setAttribute('style', cellStyle.replace(/border[^;]*;?/gi, ''));
      break;
  }
}

// ── List transformer: use padding + list-style-type ──────────
function transformList(el: HTMLElement, listStyle: string): void {
  const items = Array.from(el.querySelectorAll(':scope > li'));
  if (items.length === 0) return;

  const rows = items
    .map((li) => {
      const bullet =
        listStyle === 'disc'
          ? '•'
          : listStyle === 'decimal'
            ? `${Array.from(li.parentElement?.children ?? []).indexOf(li) + 1}.`
            : '–';
      const content = (li as HTMLElement).innerHTML;
      return `<tr>
      <td valign="top" style="padding:2px 8px 2px 0;color:#1e293b;${BASE_FONT}white-space:nowrap;">${bullet}</td>
      <td valign="top" style="padding:2px 0 2px 0;color:#1e293b;${BASE_FONT}">${content}</td>
    </tr>`;
    })
    .join('\n');

  const table = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px 0;border:none;">
${rows}
</table>`;

  el.outerHTML = table;
}

// ── Image transformer ─────────────────────────────────────────
function transformImage(img: HTMLImageElement): void {
  img.setAttribute('border', '0');
  img.setAttribute('style', `max-width:100%;height:auto;display:block;border:0;outline:none;text-decoration:none;`);
  if (!img.getAttribute('alt')) img.setAttribute('alt', '');
}

// ── Style merge helper ────────────────────────────────────────
function mergeStyles(base: string, override: string): string {
  if (!base && !override) return '';
  if (!override) return base;
  if (!base) return override;

  const parseStyle = (s: string) => {
    const map: Record<string, string> = {};
    s.split(';').forEach((rule) => {
      const idx = rule.indexOf(':');
      if (idx < 0) return;
      const prop = rule.slice(0, idx).trim();
      const val = rule.slice(idx + 1).trim();
      if (prop) map[prop] = val;
    });
    return map;
  };

  const baseMap = parseStyle(base);
  const overrideMap = parseStyle(override);
  const merged = { ...baseMap, ...overrideMap };

  return Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Layout Block HTML generators ─────────────────────────────
// FIX: Remove unnecessary borders from all generators

export function makeSection(innerHtml: string, bgColor = 'transparent', padding = '24px 0'): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${bgColor};border:none;">
  <tr><td style="padding:${padding};border:none;">${innerHtml}</td></tr>
</table>`;
}

export function makeTwoColumns(leftHtml: string, rightHtml: string, gap = 16): string {
  const colStyle = `width:50%;vertical-align:top;border:none;`;
  const half = Math.round((600 - gap) / 2);
  return `${MSO_OPEN}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:none;">
  <tr>
    <td style="${colStyle}padding-right:${gap / 2}px;" width="${half}">
      ${leftHtml}
    </td>
    <td style="${colStyle}padding-left:${gap / 2}px;" width="${half}">
      ${rightHtml}
    </td>
  </tr>
</table>
${MSO_CLOSE}`;
}

export function makeThreeColumns(cols: string[], gap = 12): string {
  const w = Math.round((600 - gap * 2) / 3);
  const cells = cols
    .map(
      (html, i) =>
        `<td style="width:${w}px;vertical-align:top;border:none;${i < cols.length - 1 ? `padding-right:${gap}px;` : ''}">${html}</td>`,
    )
    .join('\n');
  return `${MSO_OPEN}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:none;">
  <tr>${cells}</tr>
</table>
${MSO_CLOSE}`;
}

export function makeSpacer(height = 24): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:none;">
  <tr><td style="height:${height}px;font-size:${height}px;line-height:${height}px;border:none;">&nbsp;</td></tr>
</table>`;
}

export function makeButton(text: string, url: string, bgColor = '#2563eb', textColor = '#ffffff', borderRadius = 6): string {
  return `${MSO_OPEN}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border:none;">
  <tr>
    <td style="border-radius:${borderRadius}px;background:${bgColor};border:none;" bgcolor="${bgColor}">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;background:${bgColor};color:${textColor};text-decoration:none;border-radius:${borderRadius}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;line-height:1;mso-padding-alt:12px 28px;border:none;">${text}</a>
    </td>
  </tr>
</table>
${MSO_CLOSE}`;
}

export function makeDivider(color = '#e2e8f0', margin = 20): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:none;">
  <tr><td style="padding:${margin}px 0;border:none;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:none;"><tr><td style="border-top:1px solid ${color};font-size:0;line-height:0;border-bottom:none;border-left:none;border-right:none;">&nbsp;</td></tr></table></td></tr>
</table>`;
}

export function makeHero(title: string, subtitle: string, ctaText: string, ctaUrl: string, bgColor = '#1e293b', textColor = '#ffffff'): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${bgColor}" style="background:${bgColor};border-radius:6px;border:none;">
  <tr>
    <td align="center" style="padding:48px 32px;background:${bgColor};border:none;">
      <h1 style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:32px;font-weight:800;line-height:1.2;color:${textColor};border:none;">${title}</h1>
      <p style="margin:0 0 28px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.6;color:${textColor};opacity:0.85;border:none;">${subtitle}</p>
      ${ctaText && ctaUrl ? makeButton(ctaText, ctaUrl, '#ffffff', '#1e293b') : ''}
    </td>
  </tr>
</table>`;
}

export function makeFooter(lines: string[], bgColor = 'transparent', textColor = '#94a3b8'): string {
  const content = lines
    .map(
      (l) =>
        `<p style="margin:0 0 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;color:${textColor};border:none;">${l}</p>`,
    )
    .join('\n');
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${bgColor}" style="background:${bgColor};border:none;">
  <tr><td align="center" style="padding:24px 32px;border:none;">${content}</td></tr>
</table>`;
}