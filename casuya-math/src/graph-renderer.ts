import type { GraphConfig, GraphData, GraphDataset, GraphFunction, GraphAnnotation } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

const DEFAULT_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ea580c',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#e11d48',
];

export class GraphRenderer {
  private _configs: Map<string, GraphConfig> = new Map();

  registerGraph(config: GraphConfig): void {
    this._configs.set(config.id, config);
  }

  unregisterGraph(id: string): void {
    this._configs.delete(id);
  }

  renderGraph(data: GraphData): string {
    const { config, datasets, annotations, functions: funcs } = data;
    const width = config.width ?? 600;
    const height = config.height ?? 400;
    const padding = { top: 40, right: 30, bottom: 50, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const xRange = this._computeXRange(config, datasets, funcs);
    const yRange = this._computeYRange(config, datasets, funcs);

    const xScale = (x: number) =>
      padding.left + ((x - xRange.min) / (xRange.max - xRange.min)) * plotWidth;
    const yScale = (y: number) =>
      padding.top + plotHeight - ((y - yRange.min) / (yRange.max - yRange.min)) * plotHeight;

    const parts: string[] = [];
    parts.push(
      `<svg class="stem-graph" data-graph-id="${config.id}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="${SVG_NS}" role="img" aria-label="${config.title ?? 'Graph'}">`,
    );

    const isDark = config.theme === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#ffffff';
    const gridColor = isDark ? '#333355' : '#e5e7eb';
    const textColor = isDark ? '#e0e0e0' : '#374151';
    const axisColor = isDark ? '#888' : '#6b7280';

    parts.push(`<rect width="${width}" height="${height}" fill="${bgColor}" rx="8"/>`);

    if (config.grid !== false) {
      const xTicks = this._generateTicks(xRange.min, xRange.max, 8);
      const yTicks = this._generateTicks(yRange.min, yRange.max, 6);

      for (const x of xTicks) {
        const sx = xScale(x);
        parts.push(
          `<line x1="${sx}" y1="${padding.top}" x2="${sx}" y2="${padding.top + plotHeight}" stroke="${gridColor}" stroke-width="0.5" stroke-dasharray="4,4"/>`,
        );
        parts.push(
          `<text x="${sx}" y="${padding.top + plotHeight + 18}" text-anchor="middle" fill="${textColor}" font-size="11">${this._formatNumber(x)}</text>`,
        );
      }
      for (const y of yTicks) {
        const sy = yScale(y);
        parts.push(
          `<line x1="${padding.left}" y1="${sy}" x2="${padding.left + plotWidth}" y2="${sy}" stroke="${gridColor}" stroke-width="0.5" stroke-dasharray="4,4"/>`,
        );
        parts.push(
          `<text x="${padding.left - 10}" y="${sy + 4}" text-anchor="end" fill="${textColor}" font-size="11">${this._formatNumber(y)}</text>`,
        );
      }
    }

    parts.push(
      `<line x1="${padding.left}" y1="${yScale(0)}" x2="${padding.left + plotWidth}" y2="${yScale(0)}" stroke="${axisColor}" stroke-width="1.5"/>`,
    );
    parts.push(
      `<line x1="${xScale(0)}" y1="${padding.top}" x2="${xScale(0)}" y2="${padding.top + plotHeight}" stroke="${axisColor}" stroke-width="1.5"/>`,
    );

    if (config.xlabel) {
      parts.push(
        `<text x="${padding.left + plotWidth / 2}" y="${height - 8}" text-anchor="middle" fill="${textColor}" font-size="13" font-weight="500">${config.xlabel}</text>`,
      );
    }
    if (config.ylabel) {
      parts.push(
        `<text x="16" y="${padding.top + plotHeight / 2}" text-anchor="middle" fill="${textColor}" font-size="13" font-weight="500" transform="rotate(-90, 16, ${padding.top + plotHeight / 2})">${config.ylabel}</text>`,
      );
    }
    if (config.title) {
      parts.push(
        `<text x="${width / 2}" y="24" text-anchor="middle" fill="${textColor}" font-size="15" font-weight="600">${config.title}</text>`,
      );
    }

    if (datasets.length > 0) {
      parts.push('<g class="datasets">');
      datasets.forEach((ds, i) => {
        const color = ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        const points = ds.data.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(' ');
        if (points) {
          const dashArray = ds.style === 'dashed' ? '8,4' : ds.style === 'dotted' ? '2,4' : 'none';
          parts.push(
            `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${ds.lineWidth ?? 2}" stroke-dasharray="${dashArray}" stroke-linejoin="round"/>`,
          );
          if (ds.fill) {
            const fillPoints = `${xScale(ds.data[0].x)},${yScale(0)} ${points} ${xScale(ds.data[ds.data.length - 1].x)},${yScale(0)}`;
            parts.push(`<polygon points="${fillPoints}" fill="${color}" opacity="0.15"/>`);
          }
        }
      });
      parts.push('</g>');
    }

    if (funcs && funcs.length > 0) {
      parts.push('<g class="functions">');
      funcs.forEach((fn, i) => {
        const color = fn.color ?? DEFAULT_COLORS[(datasets.length + i) % DEFAULT_COLORS.length];
        const range = fn.range ?? { min: xRange.min, max: xRange.max };
        const samples = fn.samples ?? 200;
        const points = this._evaluateFunction(
          fn.expression,
          range.min,
          range.max,
          samples,
          xScale,
          yScale,
        );
        if (points) {
          parts.push(
            `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`,
          );
        }
      });
      parts.push('</g>');
    }

    if (annotations && annotations.length > 0) {
      parts.push('<g class="annotations">');
      for (const ann of annotations) {
        const sx = xScale(ann.x);
        const sy = yScale(ann.y);
        const color = ann.color ?? '#e11d48';
        if (ann.type === 'point') {
          parts.push(`<circle cx="${sx}" cy="${sy}" r="5" fill="${color}"/>`);
        } else if (ann.type === 'text' && ann.text) {
          parts.push(
            `<text x="${sx + 8}" y="${sy - 8}" fill="${color}" font-size="12" font-weight="500">${ann.text}</text>`,
          );
        } else if (ann.type === 'arrow' && ann.x2 !== undefined && ann.y2 !== undefined) {
          const ex = xScale(ann.x2);
          const ey = yScale(ann.y2);
          parts.push(
            `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${config.id})"/>`,
          );
        }
      }
      parts.push('</g>');
    }

    if (config.legend !== false && (datasets.length > 1 || (funcs && funcs.length > 0))) {
      parts.push(`<g class="legend">`);
      let ly = padding.top + 10;
      datasets.forEach((ds, i) => {
        const color = ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        parts.push(
          `<rect x="${padding.left + plotWidth - 140}" y="${ly - 10}" width="12" height="12" fill="${color}" rx="2"/>`,
        );
        parts.push(
          `<text x="${padding.left + plotWidth - 122}" y="${ly}" fill="${textColor}" font-size="11">${ds.label}</text>`,
        );
        ly += 18;
      });
      if (funcs) {
        funcs.forEach((fn, i) => {
          const color = fn.color ?? DEFAULT_COLORS[(datasets.length + i) % DEFAULT_COLORS.length];
          parts.push(
            `<rect x="${padding.left + plotWidth - 140}" y="${ly - 10}" width="12" height="12" fill="${color}" rx="2"/>`,
          );
          parts.push(
            `<text x="${padding.left + plotWidth - 122}" y="${ly}" fill="${textColor}" font-size="11">${fn.label ?? fn.expression}</text>`,
          );
          ly += 18;
        });
      }
      parts.push('</g>');
    }

    parts.push('</svg>');
    return parts.join('\n');
  }

  renderPhysicsDiagram(type: string, params: Record<string, number>): string {
    switch (type) {
      case 'free-body':
        return this._renderFreeBodyDiagram(params);
      case 'wave':
        return this._renderWaveDiagram(params);
      case 'circuit':
        return this._renderCircuitDiagram(params);
      case 'projectile':
        return this._renderProjectileMotion(params);
      case 'pendulum':
        return this._renderPendulum(params);
      default:
        return `<div class="physics-diagram" data-type="${type}">Unsupported diagram type: ${type}</div>`;
    }
  }

  private _renderFreeBodyDiagram(params: Record<string, number>): string {
    const forces = params.forces ?? 4;
    const cx = 200;
    const cy = 150;
    const radius = 30;

    const parts: string[] = [];
    parts.push(
      `<svg class="physics-diagram free-body-diagram" width="400" height="300" viewBox="0 0 400 300" xmlns="${SVG_NS}" role="img" aria-label="Free Body Diagram">`,
    );
    parts.push(`<rect width="400" height="300" fill="#fafafa" rx="8"/>`);
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`,
    );
    parts.push(
      `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#1e40af" font-size="14" font-weight="600">m</text>`,
    );

    const angleStep = (2 * Math.PI) / forces;
    const arrowLength = 70;
    const colors = ['#dc2626', '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];

    for (let i = 0; i < forces; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x1 = cx + (radius + 5) * Math.cos(angle);
      const y1 = cy + (radius + 5) * Math.sin(angle);
      const x2 = cx + (radius + arrowLength) * Math.cos(angle);
      const y2 = cy + (radius + arrowLength) * Math.sin(angle);
      const color = colors[i % colors.length];

      parts.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" marker-end="url(#arrowhead-${i})"/>`,
      );
      parts.push(
        `<defs><marker id="arrowhead-${i}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${color}"/></marker></defs>`,
      );

      const labelX = cx + (radius + arrowLength + 20) * Math.cos(angle);
      const labelY = cy + (radius + arrowLength + 20) * Math.sin(angle);
      const labels = ['F_g', 'F_N', 'F_f', 'F_applied', 'F_t', 'F_s'];
      parts.push(
        `<text x="${labelX}" y="${labelY}" text-anchor="middle" fill="${color}" font-size="12" font-weight="600">${labels[i % labels.length]}</text>`,
      );
    }

    parts.push('</svg>');
    return parts.join('\n');
  }

  private _renderWaveDiagram(params: Record<string, number>): string {
    const amplitude = params.amplitude ?? 50;
    const frequency = params.frequency ?? 2;
    const phase = params.phase ?? 0;
    const width = 600;
    const height = 200;

    const points: string[] = [];
    for (let x = 0; x <= width; x++) {
      const t = (x / width) * 4 * Math.PI;
      const y = height / 2 - amplitude * Math.sin(frequency * t + phase);
      points.push(`${x},${y}`);
    }

    return `<svg class="physics-diagram wave-diagram" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="${SVG_NS}" role="img" aria-label="Wave Diagram">
  <rect width="${width}" height="${height}" fill="#fafafa" rx="8"/>
  <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#d1d5db" stroke-width="1"/>
  <polyline points="${points.join(' ')}" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <text x="${width / 2}" y="20" text-anchor="middle" fill="#374151" font-size="12">A=${amplitude} f=${frequency}Hz \u03c6=${phase}rad</text>
</svg>`;
  }

  private _renderCircuitDiagram(params: Record<string, number>): string {
    return `<svg class="physics-diagram circuit-diagram" width="400" height="250" viewBox="0 0 400 250" xmlns="${SVG_NS}" role="img" aria-label="Circuit Diagram">
  <rect width="400" height="250" fill="#fafafa" rx="8"/>
  <rect x="160" y="60" width="80" height="130" fill="none" stroke="#2563eb" stroke-width="2" rx="4"/>
  <text x="200" y="130" text-anchor="middle" fill="#2563eb" font-size="12">R=${params.resistance ?? 100}\u03a9</text>
  <circle cx="80" cy="125" r="25" fill="none" stroke="#dc2626" stroke-width="2"/>
  <text x="80" y="130" text-anchor="middle" fill="#dc2626" font-size="11">V=${params.voltage ?? 12}V</text>
  <line x1="105" y1="125" x2="160" y2="125" stroke="#374151" stroke-width="2"/>
  <line x1="240" y1="125" x2="320" y2="125" stroke="#374151" stroke-width="2"/>
  <line x1="80" y1="60" x2="80" y2="100" stroke="#374151" stroke-width="2"/>
  <line x1="80" y1="150" x2="80" y2="190" stroke="#374151" stroke-width="2"/>
  <line x1="80" y1="190" x2="320" y2="190" stroke="#374151" stroke-width="2"/>
  <line x1="320" y1="190" x2="320" y2="60" stroke="#374151" stroke-width="2"/>
  <line x1="320" y1="60" x2="80" y2="60" stroke="#374151" stroke-width="2"/>
  <text x="200" y="220" text-anchor="middle" fill="#374151" font-size="12">I = ${(params.voltage ?? 12) / (params.resistance ?? 100)}A</text>
</svg>`;
  }

  private _renderProjectileMotion(params: Record<string, number>): string {
    const v0 = params.initialVelocity ?? 20;
    const angle = ((params.angle ?? 45) * Math.PI) / 180;
    const g = params.gravity ?? 9.81;
    const vx = v0 * Math.cos(angle);
    const vy = v0 * Math.sin(angle);
    const totalTime = (2 * vy) / g;
    const maxHeight = (vy * vy) / (2 * g);
    const range = vx * totalTime;

    const width = 500;
    const height = 300;
    const padding = 40;
    const scaleX = (t: number) => padding + (t / totalTime) * (width - 2 * padding);
    const scaleY = (h: number) => height - padding - (h / maxHeight) * (height - 2 * padding);

    const points: string[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalTime;
      const x = vx * t;
      const y = vy * t - 0.5 * g * t * t;
      points.push(`${scaleX(t)},${scaleY(Math.max(0, y))}`);
    }

    return `<svg class="physics-diagram projectile-diagram" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="${SVG_NS}" role="img" aria-label="Projectile Motion">
  <rect width="${width}" height="${height}" fill="#fafafa" rx="8"/>
  <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#9ca3af" stroke-width="1"/>
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#9ca3af" stroke-width="1"/>
  <polyline points="${points.join(' ')}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6,3"/>
  <circle cx="${scaleX(totalTime / 2)}" cy="${scaleY(maxHeight)}" r="4" fill="#dc2626"/>
  <text x="${scaleX(totalTime / 2) + 10}" y="${scaleY(maxHeight) - 10}" fill="#dc2626" font-size="11">Max: ${maxHeight.toFixed(2)}m</text>
  <text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#374151" font-size="11">Range: ${range.toFixed(2)}m</text>
  <text x="14" y="20" fill="#374151" font-size="11">v\u2080=${v0}m/s \u03b8=${((angle * 180) / Math.PI).toFixed(0)}\u00b0</text>
</svg>`;
  }

  private _renderPendulum(params: Record<string, number>): string {
    const length = params.length ?? 1;
    const angle = ((params.angle ?? 30) * Math.PI) / 180;
    const pivotX = 200;
    const pivotY = 50;
    const scale = 150;
    const bobX = pivotX + length * scale * Math.sin(angle);
    const bobY = pivotY + length * scale * Math.cos(angle);

    return `<svg class="physics-diagram pendulum-diagram" width="400" height="350" viewBox="0 0 400 350" xmlns="${SVG_NS}" role="img" aria-label="Pendulum">
  <rect width="400" height="350" fill="#fafafa" rx="8"/>
  <line x1="${pivotX - 40}" y1="${pivotY}" x2="${pivotX + 40}" y2="${pivotY}" stroke="#6b7280" stroke-width="3"/>
  <line x1="${pivotX}" y1="${pivotY}" x2="${bobX}" y2="${bobY}" stroke="#374151" stroke-width="2"/>
  <circle cx="${bobX}" cy="${bobY}" r="15" fill="#2563eb" stroke="#1e40af" stroke-width="2"/>
  <circle cx="${pivotX}" cy="${pivotY}" r="4" fill="#374151"/>
  <text x="${(pivotX + bobX) / 2 + 15}" y="${(pivotY + bobY) / 2}" fill="#374151" font-size="11">L=${length}m</text>
  <text x="20" y="340" fill="#374151" font-size="12">T = 2\u03c0\u221a(L/g) \u2248 ${(2 * Math.PI * Math.sqrt(length / 9.81)).toFixed(3)}s</text>
</svg>`;
  }

  private _evaluateFunction(
    expr: string,
    min: number,
    max: number,
    samples: number,
    xScale: (x: number) => number,
    yScale: (y: number) => number,
  ): string {
    const points: string[] = [];
    const step = (max - min) / samples;

    for (let i = 0; i <= samples; i++) {
      const x = min + i * step;
      try {
        const y = this._evalMathExpression(expr, x);
        if (isFinite(y) && !isNaN(y)) {
          points.push(`${xScale(x).toFixed(2)},${yScale(y).toFixed(2)}`);
        }
      } catch {
        continue;
      }
    }
    return points.join(' ');
  }

  private _evalMathExpression(expr: string, x: number): number {
    const processed = expr
      .replace(/\bx\b/g, `(${x})`)
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\basin\b/g, 'Math.asin')
      .replace(/\bacos\b/g, 'Math.acos')
      .replace(/\batan\b/g, 'Math.atan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\blog\b/g, 'Math.log')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b(?!\w)/g, 'Math.E')
      .replace(/\^/g, '**');

    return Function(`"use strict"; return (${processed})`)() as number;
  }

  private _computeXRange(
    config: GraphConfig,
    datasets: GraphDataset[],
    funcs?: GraphFunction[],
  ): { min: number; max: number } {
    if (config.xmin !== undefined && config.xmax !== undefined) {
      return { min: config.xmin, max: config.xmax };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const ds of datasets) {
      for (const p of ds.data) {
        if (p.x < min) min = p.x;
        if (p.x > max) max = p.x;
      }
    }
    if (min === Infinity) {
      min = -10;
      max = 10;
    }
    const margin = (max - min) * 0.1 || 1;
    return { min: min - margin, max: max + margin };
  }

  private _computeYRange(
    config: GraphConfig,
    datasets: GraphDataset[],
    funcs?: GraphFunction[],
  ): { min: number; max: number } {
    if (config.ymin !== undefined && config.ymax !== undefined) {
      return { min: config.ymin, max: config.ymax };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const ds of datasets) {
      for (const p of ds.data) {
        if (p.y < min) min = p.y;
        if (p.y > max) max = p.y;
      }
    }
    if (min === Infinity) {
      min = -10;
      max = 10;
    }
    const margin = (max - min) * 0.1 || 1;
    return { min: min - margin, max: max + margin };
  }

  private _generateTicks(min: number, max: number, count: number): number[] {
    const step = (max - min) / count;
    const niceStep = this._niceNumber(step);
    const start = Math.ceil(min / niceStep) * niceStep;
    const ticks: number[] = [];
    for (let v = start; v <= max; v += niceStep) {
      ticks.push(parseFloat(v.toFixed(10)));
    }
    return ticks;
  }

  private _niceNumber(value: number): number {
    const exp = Math.floor(Math.log10(value));
    const frac = value / Math.pow(10, exp);
    let nice: number;
    if (frac <= 1.5) nice = 1;
    else if (frac <= 3.5) nice = 2;
    else if (frac <= 7.5) nice = 5;
    else nice = 10;
    return nice * Math.pow(10, exp);
  }

  private _formatNumber(value: number): string {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2).replace(/\.?0+$/, '');
  }
}
