import type { STEMContent, MathBlock, GraphData, PhysicsEquation, ChemistryFormula } from './types';
import { MathRenderer } from './math-renderer';
import { GraphRenderer } from './graph-renderer';
import { ChemRenderer } from './chem-renderer';

export class STEMConverter {
  private _mathRenderer: MathRenderer;
  private _graphRenderer: GraphRenderer;
  private _chemRenderer: ChemRenderer;

  constructor() {
    this._mathRenderer = new MathRenderer();
    this._graphRenderer = new GraphRenderer();
    this._chemRenderer = new ChemRenderer();
  }

  convertHTML(html: string): string {
    let result = html;

    result = this._chemRenderer.renderToHTML(result);
    result = this._mathRenderer.convertToHTML(result);
    result = this._convertSTEMTags(result);

    return result;
  }

  extractSTEMContent(html: string): STEMContent {
    const content: STEMContent = {};

    const mathBlocks = this._mathRenderer.convertToHTML(html);
    if (mathBlocks !== html) {
      const mathRenderer = this._mathRenderer;
      content.math = [
        {
          id: 'extracted',
          expressions: [{ latex: mathBlocks, display: true }],
        },
      ];
    }

    return content;
  }

  renderSTEMBlock(content: STEMContent): string {
    const parts: string[] = [];

    if (content.math) {
      for (const block of content.math) {
        parts.push(this._mathRenderer.renderBlock(block));
      }
    }

    if (content.graphs) {
      for (const graph of content.graphs) {
        parts.push(this._graphRenderer.renderGraph(graph));
      }
    }

    if (content.chemistry) {
      for (const chem of content.chemistry) {
        parts.push(this._chemRenderer.renderFormula(chem));
      }
    }

    if (content.equations) {
      for (const eq of content.equations) {
        parts.push(this._renderEquation(eq));
      }
    }

    return parts.join('\n');
  }

  private _convertSTEMTags(html: string): string {
    let result = html;

    result = result.replace(/<graph\s+([^>]*)\/>/gi, (_, attrs) => {
      const config = this._parseAttributes(attrs);
      return `<div class="stem-graph-placeholder" data-graph-config='${JSON.stringify(config)}'></div>`;
    });

    result = result.replace(/<physics-diagram\s+([^>]*)\/>/gi, (_, attrs) => {
      const params = this._parseAttributes(attrs);
      const type = params.type ?? 'free-body';
      delete params.type;
      return this._graphRenderer.renderPhysicsDiagram(
        type as string,
        params as Record<string, number>,
      );
    });

    result = result.replace(/<unit-conversion\s+([^>]*)\/>/gi, (_, attrs) => {
      const params = this._parseAttributes(attrs);
      return `<span class="unit-conversion">${params.from ?? '?'} = ${params.to ?? '?'}</span>`;
    });

    return result;
  }

  private _renderEquation(eq: PhysicsEquation): string {
    const parts: string[] = [`<div class="physics-equation" data-type="${eq.type}">`];
    parts.push(`<span class="eq-formula">${eq.formula}</span>`);
    parts.push('<div class="eq-variables">');
    for (const [name, data] of Object.entries(eq.variables)) {
      parts.push(`<span class="eq-var">${name} = ${data.value} ${data.unit}</span>`);
    }
    parts.push('</div>');
    if (eq.result) {
      parts.push(`<span class="eq-result">= ${eq.result.value} ${eq.result.unit}</span>`);
    }
    parts.push('</div>');
    return parts.join('');
  }

  private _parseAttributes(attrStr: string): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    const regex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
    let match;
    while ((match = regex.exec(attrStr)) !== null) {
      const value = match[2] ?? match[3];
      const num = parseFloat(value);
      result[match[1]] = isNaN(num) ? value : num;
    }
    return result;
  }
}
