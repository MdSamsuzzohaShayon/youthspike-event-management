// Add this cleaning function
function cleanEditorHTML(html: string): string {
  if (!html) return '';

  return html
    // Remove ALL border styles from table cells
    .replace(/border\s*:\s*1px\s+solid\s+#[a-fA-F0-9]+;?/gi, '')
    // Remove min-width from tables and cols
    .replace(/min-width\s*:\s*\d+px;?/gi, '')
    // Remove TipTap default text colors
    .replace(/color\s*:\s*#374151;?/gi, '')
    // Remove default font sizes
    .replace(/font-size\s*:\s*14px;?/gi, '')
    // Remove colgroup elements entirely
    .replace(/<colgroup>[\s\S]*?<\/colgroup>/g, '')
    // Remove colspan="1" and rowspan="1"
    .replace(/\s*colspan="1"/g, '')
    .replace(/\s*rowspan="1"/g, '')
    // Remove text-align:left (browser default)
    .replace(/text-align\s*:\s*left;?/gi, '')
    // Remove vertical-align:top
    .replace(/vertical-align\s*:\s*top;?/gi, '')
    // Clean up empty style attributes
    .replace(/\s*style="\s*;?\s*"/g, '')
    .replace(/\s*style=""/g, '')
    // Clean up multiple semicolons
    .replace(/;;+/g, ';')
    // Remove trailing semicolons in style
    .replace(/style="([^"]*);"/g, 'style="$1"');
}

export default cleanEditorHTML;