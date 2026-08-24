import type { ChemistryFormula } from './types';

export class ChemRenderer {
  renderFormula(formula: ChemistryFormula): string {
    if (formula.type === 'reaction' && formula.reactants && formula.products) {
      return this._renderReaction(formula);
    }
    return this._renderFormula(formula.formula);
  }

  renderToHTML(html: string): string {
    let result = html;

    result = result.replace(/<chem>([\s\S]*?)<\/chem>/gi, (_, formula) => {
      return `<span class="chem-formula" data-formula="${this._escapeHtml(formula)}">${this._renderFormula(formula.trim())}</span>`;
    });

    result = result.replace(/<reaction>([\s\S]*?)<\/reaction>/gi, (_, reaction) => {
      const parts = reaction.split('->');
      if (parts.length === 2) {
        const reactants = parts[0].split('+').map((s: string) => s.trim());
        const products = parts[1].split('+').map((s: string) => s.trim());
        return this._renderReaction({
          formula: reaction,
          type: 'reaction',
          reactants: reactants.map((f: string) => ({
            formula: f,
            coefficient: this._extractCoefficient(f),
          })),
          products: products.map((f: string) => ({
            formula: f,
            coefficient: this._extractCoefficient(f),
          })),
          balanced: true,
        });
      }
      return `<span class="chem-reaction">${reaction}</span>`;
    });

    return result;
  }

  private _renderReaction(formula: ChemistryFormula): string {
    if (!formula.reactants || !formula.products) return formula.formula;

    const parts: string[] = [];
    parts.push('<span class="chem-reaction">');

    formula.reactants.forEach((r, i) => {
      if (i > 0) parts.push(' <span class="chem-plus">+</span> ');
      parts.push(this._renderFormula(r.formula, r.coefficient));
    });

    parts.push(' <span class="chem-arrow">\u2192</span> ');

    formula.products.forEach((p, i) => {
      if (i > 0) parts.push(' <span class="chem-plus">+</span> ');
      parts.push(this._renderFormula(p.formula, p.coefficient));
    });

    parts.push('</span>');
    return parts.join('');
  }

  private _renderFormula(formula: string, coefficient?: number): string {
    const parts: string[] = [];
    if (coefficient && coefficient > 1) {
      parts.push(`<sub class="chem-coefficient">${coefficient}</sub>`);
    }

    let i = 0;
    while (i < formula.length) {
      const ch = formula[i];
      if (/[A-Z]/.test(ch)) {
        let element = ch;
        i++;
        while (i < formula.length && /[a-z]/.test(formula[i])) {
          element += formula[i];
          i++;
        }
        parts.push(`<span class="chem-element">${element}</span>`);
      } else if (/[0-9]/.test(ch)) {
        let num = '';
        while (i < formula.length && /[0-9]/.test(formula[i])) {
          num += formula[i];
          i++;
        }
        parts.push(`<sub class="chem-subscript">${num}</sub>`);
      } else if (ch === '^') {
        i++;
        let sup = '';
        if (formula[i] === '{') {
          i++;
          while (i < formula.length && formula[i] !== '}') {
            sup += formula[i];
            i++;
          }
          i++;
        } else {
          sup = formula[i] || '';
          i++;
        }
        parts.push(`<sup class="chem-superscript">${sup}</sup>`);
      } else if (ch === '+') {
        parts.push('<sup class="chem-charge">+</sup>');
        i++;
      } else if (ch === '-' && (i + 1 >= formula.length || formula[i + 1] !== '-')) {
        parts.push('<sup class="chem-charge">\u2212</sup>');
        i++;
      } else if (ch === '(' || ch === ')') {
        parts.push(ch);
        i++;
      } else {
        parts.push(ch);
        i++;
      }
    }
    return parts.join('');
  }

  private _extractCoefficient(formula: string): number {
    const match = formula.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  private _escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
