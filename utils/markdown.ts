/**
 * Unified markdown parser for chat messages
 * Used across all chat interfaces to ensure consistent rendering
 *
 * Based on the parser from public/widget.js
 * Supports: bold, italic, links, lists, paragraphs
 * Includes XSS protection
 */

export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__ (do bold first to avoid conflicts)
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (single asterisk/underscore, not part of bold)
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">$1</a>'
  );

  // Process lists BEFORE converting line breaks
  // Unordered lists: lines starting with - or * or •
  html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li>$1</li>');

  // Ordered lists: lines starting with number.
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="list-style-type: decimal;">$1</li>');

  // Convert double line breaks to paragraph breaks
  html = html.replace(/\n\n/g, '</p><p style="margin: 0.5em 0;">');
  // Convert single line breaks to <br>
  html = html.replace(/\n/g, '<br>');

  // Wrap consecutive list items in ul/ol (must handle <br> tags between items)
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:<br>|<br\/>|\s)*)+/gs, function (match) {
    // Remove <br> tags between list items
    const cleanedMatch = match.replace(/<br\s*\/?>/g, '');
    if (match.includes('list-style-type: decimal')) {
      return '<ol style="margin: 0.5em 0; padding-left: 1.5em;">' + cleanedMatch + '</ol>';
    } else {
      return '<ul style="margin: 0.5em 0; padding-left: 1.5em; list-style-type: disc;">' + cleanedMatch + '</ul>';
    }
  });

  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
    html = '<p style="margin: 0;">' + html + '</p>';
  } else if (html.startsWith('<p')) {
    html = '<p style="margin: 0;">' + html.substring(3);
  }

  return html;
}
