import { describe, it, expect, beforeEach } from 'vitest';
import { STEMConverter } from '../src/stem-converter';

describe('STEMConverter', () => {
  let converter: STEMConverter;

  beforeEach(() => {
    converter = new STEMConverter();
  });

  it('should convert math in HTML', () => {
    const html = converter.convertHTML('<p>$$E = mc^2$$</p>');
    expect(html).toContain('math-display');
    expect(html).toContain('E = mc^2');
  });

  it('should convert chemistry tags', () => {
    const html = converter.convertHTML('<chem>H2O</chem>');
    expect(html).toContain('chem-formula');
  });

  it('should convert inline math', () => {
    const html = converter.convertHTML('<p>$x^2$</p>');
    expect(html).toContain('math-inline');
  });

  it('should convert mixed STEM content', () => {
    const html = converter.convertHTML(`
      <p>Water ($H_2O$) has molar mass of <eq>18 g/mol</eq></p>
      <chem>NaCl</chem>
      <p>$$F = ma$$</p>
    `);
    expect(html).toContain('math-inline');
    expect(html).toContain('math-display');
    expect(html).toContain('chem-formula');
  });

  it('should render STEM block', () => {
    const content = {
      math: [{ id: 'm1', expressions: [{ latex: 'x = 1', display: true }] }],
      chemistry: [{ formula: 'H2O', type: 'molecular' as const }],
    };
    const html = converter.renderSTEMBlock(content);
    expect(html).toContain('math-display');
    expect(html).toContain('chem-element');
  });
});
