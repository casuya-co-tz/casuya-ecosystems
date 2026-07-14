import type { MathBlock, MathExpression } from './types';

export class LaTeXParser {
  parseDocument(html: string): MathBlock[] {
    const blocks: MathBlock[] = [];
    let id = 0;

    const displayMath = /\$\$([\s\S]*?)\$\$/g;
    let match;
    while ((match = displayMath.exec(html)) !== null) {
      blocks.push(this._createBlock(match[1].trim(), ++id));
    }

    const envRegex = /\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g;
    while ((match = envRegex.exec(html)) !== null) {
      blocks.push(this._createEnvironmentBlock(match[1], match[2].trim(), ++id));
    }

    const mathTag = /<math>([\s\S]*?)<\/math>/gi;
    while ((match = mathTag.exec(html)) !== null) {
      blocks.push(this._createBlock(match[1].trim(), ++id));
    }

    return blocks;
  }

  parseInline(html: string): MathExpression[] {
    const expressions: MathExpression[] = [];
    const inlineMath = /\$(?!\$)(.*?)\$/g;
    let match;
    while ((match = inlineMath.exec(html)) !== null) {
      expressions.push({ latex: match[1].trim(), display: false });
    }

    const parenMath = /\\\((.*?)\\\)/g;
    while ((match = parenMath.exec(html)) !== null) {
      expressions.push({ latex: match[1].trim(), display: false });
    }

    return expressions;
  }

  splitLines(latex: string): string[] {
    return latex
      .split(/\\\\|\\newline|\\cr/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  extractLabels(latex: string): Array<{ label: string; position: number }> {
    const labels: Array<{ label: string; position: number }> = [];
    const regex = /\\label\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(latex)) !== null) {
      labels.push({ label: match[1], position: match.index });
    }
    return labels;
  }

  private _createBlock(latex: string, id: number): MathBlock {
    const lines = this.splitLines(latex);
    const expressions: MathExpression[] = lines.map((line) => ({ latex: line, display: true }));
    const label = this.extractLabels(latex);

    return {
      id: `block-${id}`,
      expressions,
      numbered: /\\tag\{|\\label\{/.test(latex),
      alignment: /\\begin\{align/.test(latex) ? 'left' : 'center',
    };
  }

  private _createEnvironmentBlock(env: string, content: string, id: number): MathBlock {
    const lines = this.splitLines(content);
    const expressions: MathExpression[] = lines.map((line) => ({ latex: line, display: true }));

    return {
      id: `env-${id}`,
      expressions,
      environment: env,
      alignment: env.includes('align') ? 'left' : 'center',
    };
  }
}
