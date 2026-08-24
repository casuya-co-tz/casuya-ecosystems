export class ContentSanitizer {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;')
      .replace(/\//g, '&#x2F;');
  }

  static truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    if (maxLength <= suffix.length) return text.substring(0, maxLength);
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  static normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  static toSafeFileName(name: string): string {
    if (!name || name === '.' || name === '..') return 'untitled';
    const safe = name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^\.\.+/, '');
    return safe || 'untitled';
  }
}
