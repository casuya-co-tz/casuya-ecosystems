import { describe, it, expect, beforeEach } from 'vitest';
import { GraphRenderer } from '../src/graph-renderer';
import type { GraphData } from '../src/types';

describe('GraphRenderer', () => {
  let renderer: GraphRenderer;

  beforeEach(() => {
    renderer = new GraphRenderer();
  });

  it('should render a line graph', () => {
    const data: GraphData = {
      config: { id: 'g1', type: 'line', title: 'Test Graph', xlabel: 'X', ylabel: 'Y' },
      datasets: [
        {
          label: 'Line 1',
          data: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 4 },
          ],
        },
      ],
    };
    const svg = renderer.renderGraph(data);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Test Graph');
    expect(svg).toContain('data-graph-id="g1"');
    expect(svg).toContain('polyline');
  });

  it('should render a function graph', () => {
    const data: GraphData = {
      config: {
        id: 'g2',
        type: 'function',
        title: 'y = x^2',
        xmin: -5,
        xmax: 5,
        ymin: 0,
        ymax: 25,
      },
      datasets: [],
      functions: [{ expression: 'x^2', color: '#2563eb', label: 'x\u00b2' }],
    };
    const svg = renderer.renderGraph(data);
    expect(svg).toContain('polyline');
    expect(svg).toContain('x\u00b2');
  });

  it('should render a free body diagram', () => {
    const svg = renderer.renderPhysicsDiagram('free-body', { forces: 3 });
    expect(svg).toContain('free-body-diagram');
    expect(svg).toContain('Free Body Diagram');
  });

  it('should render a wave diagram', () => {
    const svg = renderer.renderPhysicsDiagram('wave', { amplitude: 30, frequency: 3 });
    expect(svg).toContain('wave-diagram');
    expect(svg).toContain('polyline');
  });

  it('should render projectile motion', () => {
    const svg = renderer.renderPhysicsDiagram('projectile', { initialVelocity: 20, angle: 45 });
    expect(svg).toContain('projectile-diagram');
    expect(svg).toContain('polyline');
  });

  it('should render pendulum', () => {
    const svg = renderer.renderPhysicsDiagram('pendulum', { length: 1, angle: 30 });
    expect(svg).toContain('pendulum-diagram');
    expect(svg).toContain('T =');
  });

  it('should render circuit diagram', () => {
    const svg = renderer.renderPhysicsDiagram('circuit', { voltage: 12, resistance: 100 });
    expect(svg).toContain('circuit-diagram');
    expect(svg).toContain('100\u03a9');
  });

  it('should render with legend', () => {
    const data: GraphData = {
      config: { id: 'g3', type: 'line', legend: true },
      datasets: [
        {
          label: 'A',
          data: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        },
        {
          label: 'B',
          data: [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
          ],
        },
      ],
    };
    const svg = renderer.renderGraph(data);
    expect(svg).toContain('legend');
    expect(svg).toContain('A');
    expect(svg).toContain('B');
  });

  it('should render scatter plot', () => {
    const data: GraphData = {
      config: { id: 'g4', type: 'scatter' },
      datasets: [
        {
          label: 'Points',
          data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: Math.random() * 10 })),
        },
      ],
    };
    const svg = renderer.renderGraph(data);
    expect(svg).toContain('polyline');
  });

  it('should render dark theme', () => {
    const data: GraphData = {
      config: { id: 'g5', type: 'line', theme: 'dark' },
      datasets: [{ label: 'Dark', data: [{ x: 0, y: 0 }] }],
    };
    const svg = renderer.renderGraph(data);
    expect(svg).toContain('#1a1a2e');
  });
});
