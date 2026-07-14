import { describe, it, expect, beforeEach } from 'vitest';
import { ChemRenderer } from '../src/chem-renderer';

describe('ChemRenderer', () => {
  let renderer: ChemRenderer;

  beforeEach(() => {
    renderer = new ChemRenderer();
  });

  it('should render chemical formula', () => {
    const html = renderer.renderFormula({ formula: 'H2O', type: 'molecular' });
    expect(html).toContain('chem-element');
    expect(html).toContain('H');
    expect(html).toContain('<sub');
    expect(html).toContain('2');
  });

  it('should render subscript numbers', () => {
    const html = renderer.renderFormula({ formula: 'C6H12O6', type: 'molecular' });
    expect(html).toContain('6');
    expect(html).toContain('12');
  });

  it('should render chemical reaction', () => {
    const html = renderer.renderFormula({
      formula: '2H2 + O2 -> 2H2O',
      type: 'reaction',
      reactants: [
        { formula: '2H2', coefficient: 2 },
        { formula: 'O2', coefficient: 1 },
      ],
      products: [{ formula: '2H2O', coefficient: 2 }],
      balanced: true,
    });
    expect(html).toContain('chem-reaction');
    expect(html).toContain('chem-arrow');
    expect(html).toContain('chem-plus');
  });

  it('should convert <chem> tags', () => {
    const html = renderer.renderToHTML('<p>Water is <chem>H2O</chem></p>');
    expect(html).toContain('chem-formula');
    expect(html).toContain('H');
  });

  it('should convert <reaction> tags', () => {
    const html = renderer.renderToHTML('<reaction>2H2 + O2 -> 2H2O</reaction>');
    expect(html).toContain('chem-reaction');
  });

  it('should handle charges', () => {
    const html = renderer.renderFormula({ formula: 'Na+', type: 'molecular' });
    expect(html).toContain('chem-charge');
  });

  it('should handle ions with charges', () => {
    const html = renderer.renderFormula({ formula: 'SO4^2-', type: 'molecular' });
    expect(html).toContain('chem-superscript');
  });
});
