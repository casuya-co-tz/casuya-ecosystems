import katex from 'katex';
import type { MathExpression, MathBlock, RenderOptions } from './types';

const DEFAULT_OPTIONS: RenderOptions = {
  outputFormat: 'html',
  theme: 'light',
  fontSize: 16,
  inline: false,
  throwOnError: false,
  trust: true,
  strict: false,
};

export class MathRenderer {
  private _options: RenderOptions;
  private _macros: Record<string, string> = {};
  private _counter = 0;

  constructor(options: Partial<RenderOptions> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
    if (options.macros) {
      this._macros = { ...options.macros };
    }
  }

  renderLatex(latex: string, display = false): string {
    const id = `math-${++this._counter}`;
    const processedLatex = this._processMacros(latex);

    const katexOptions: katex.KatexOptions = {
      displayMode: display,
      throwOnError: false,
      trust: true,
      strict: false,
      macros: this._macros,
      output: this._options.outputFormat === 'svg' ? 'html' : 'html',
    };

    let rendered: string;
    try {
      rendered = katex.renderToString(processedLatex, katexOptions);
    } catch {
      rendered = `<span class="katex-error" title="${processedLatex}">${this._escapeHtml(processedLatex)}</span>`;
    }

    const className = display ? 'math-display' : 'math-inline';
    const tag = display ? 'div' : 'span';
    const ariaLabel = this._latexToPlainText(processedLatex);

    return `<${tag} class="${className}" data-math-id="${id}" data-latex="${this._escapeHtml(latex)}" role="math" aria-label="${this._escapeHtml(ariaLabel)}">${rendered}</${tag}>`;
  }

  renderBlock(block: MathBlock): string {
    const parts: string[] = [];
    const environment = block.environment;

    if (environment === 'align' || environment === 'aligned') {
      parts.push(`<div class="math-block math-${environment}" data-block-id="${block.id}">`);
      for (const expr of block.expressions) {
        parts.push(this.renderLatex(expr.latex, true));
      }
      parts.push('</div>');
    } else if (block.expressions.length === 1) {
      parts.push(this.renderLatex(block.expressions[0].latex, true));
    } else {
      parts.push(`<div class="math-block" data-block-id="${block.id}">`);
      for (const expr of block.expressions) {
        parts.push(`<div class="math-row">${this.renderLatex(expr.latex, true)}</div>`);
      }
      parts.push('</div>');
    }

    return parts.join('\n');
  }

  renderInline(latex: string): string {
    return this.renderLatex(latex, false);
  }

  convertToHTML(html: string): string {
    let result = html;

    result = result.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, latex) => {
      return this.renderLatex(latex.trim(), true);
    });

    result = result.replace(/\$\s*(.*?)\s*\$/g, (_, latex) => {
      return this.renderLatex(latex.trim(), false);
    });

    result = result.replace(/\\\((.*?)\\\)/g, (_, latex) => {
      return this.renderLatex(latex.trim(), false);
    });

    result = result.replace(/\\\[[\s\S]*?\\\]/g, (match) => {
      const latex = match.slice(2, -2).trim();
      return this.renderLatex(latex, true);
    });

    result = result.replace(/<math>([\s\S]*?)<\/math>/gi, (_, latex) => {
      return this.renderLatex(latex.trim(), true);
    });

    result = result.replace(/<eq>([\s\S]*?)<\/eq>/gi, (_, latex) => {
      return this.renderLatex(latex.trim(), false);
    });

    result = result.replace(/<equation\s+id="([^"]*)"\s*\/>/gi, (_match, id) => {
      return `<span class="math-reference" data-equation-id="${id}">[${id}]</span>`;
    });

    return result;
  }

  addMacro(name: string, definition: string): void {
    this._macros[name] = definition;
  }

  removeMacro(name: string): void {
    delete this._macros[name];
  }

  getMacros(): Record<string, string> {
    return { ...this._macros };
  }

  private _processMacros(latex: string): string {
    let result = latex;
    for (const [name, def] of Object.entries(this._macros)) {
      const escaped = name.replace(/[-\/\\^$*+?.()|[\]{}%]/g, '\\$&');
      const regex = new RegExp(`\\\\${escaped}(?![a-zA-Z])`, 'g');
      result = result.replace(regex, def);
    }
    return result;
  }

  private _latexToPlainText(latex: string): string {
    return latex
      .replace(/\\\\/g, '')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
      .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
      .replace(/\\([a-zA-Z]+)/g, '$1')
      .replace(/[\{\}^_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private _escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
