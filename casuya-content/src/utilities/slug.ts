export class SlugGenerator {
  static generate(title: string): string {
    if (!title || typeof title !== 'string') return 'untitled';
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'untitled';
  }

  static generateUnique(base: string, existingSlugs: string[]): string {
    const baseSlug = this.generate(base);
    let slug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  static isValid(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }
}
