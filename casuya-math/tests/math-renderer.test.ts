import { describe, it, expect, beforeEach } from 'vitest';
import { MathRenderer } from '../src/math-renderer';

describe('MathRenderer', () => {
  let renderer: MathRenderer;

  beforeEach(() => {
    renderer = new MathRenderer();
  });

  it('should render display math with KaTeX', () => {
    const html = renderer.renderLatex('x^2 + y^2 = r^2', true);
    expect(html).toContain('math-display');
    expect(html).toContain('katex');
    expect(html).toContain('role="math"');
    expect(html).toContain('data-latex="x^2 + y^2 = r^2"');
  });

  it('should render inline math with KaTeX', () => {
    const html = renderer.renderLatex('E = mc^2', false);
    expect(html).toContain('math-inline');
    expect(html).toContain('katex');
    expect(html).toContain('E = mc^2');
  });

  it('should visually render superscripts', () => {
    const html = renderer.renderLatex('x^2', false);
    expect(html).toContain('katex');
    expect(html).toMatch(/<span[^>]*class="[^"]*katex[^"]*"/);
  });

  it('should visually render fractions', () => {
    const html = renderer.renderLatex('\\frac{a}{b}', false);
    expect(html).toContain('katex');
    expect(html).toContain('a');
    expect(html).toContain('b');
  });

  it('should visually render integrals', () => {
    const html = renderer.renderLatex('\\int_0^1 x^2 dx', true);
    expect(html).toContain('math-display');
    expect(html).toContain('katex');
  });

  it('should visually render square roots', () => {
    const html = renderer.renderLatex('\\sqrt{x^2 + y^2}', false);
    expect(html).toContain('katex');
  });

  it('should visually render Greek letters', () => {
    const html = renderer.renderLatex('\\alpha + \\beta = \\gamma', false);
    expect(html).toContain('katex');
    expect(html).toContain('\\alpha');
  });

  it('should convert $$ delimiters to rendered math', () => {
    const input = '<p>Energy is $$E = mc^2$$ important.</p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-display');
    expect(output).toContain('katex');
    expect(output).toContain('E = mc^2');
  });

  it('should convert $ delimiters to inline math', () => {
    const input = '<p>Let $x = 5$ be a number.</p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-inline');
    expect(output).toContain('katex');
    expect(output).toContain('x = 5');
  });

  it('should convert \\( \\) delimiters', () => {
    const input = '<p>Inline \\(a^2 + b^2 = c^2\\)</p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-inline');
    expect(output).toContain('katex');
  });

  it('should convert \\[ \\] delimiters', () => {
    const input = '<p>Display \\[\\int_0^1 x^2 dx = \\frac{1}{3}\\]</p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-display');
    expect(output).toContain('katex');
  });

  it('should convert <math> tags', () => {
    const input = '<p><math>x + y = z</math></p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-display');
    expect(output).toContain('katex');
  });

  it('should convert <eq> tags to inline', () => {
    const input = '<p>Here is <eq>a + b</eq></p>';
    const output = renderer.convertToHTML(input);
    expect(output).toContain('math-inline');
    expect(output).toContain('katex');
  });

  it('should handle macros', () => {
    renderer.addMacro('R', '\\mathbb{R}');
    const html = renderer.renderLatex('x \\in \\R', false);
    expect(html).toContain('math-inline');
    expect(html).toContain('katex');
  });

  it('should render math block', () => {
    const block = {
      id: 'test-1',
      expressions: [
        { latex: 'x = 1', display: true },
        { latex: 'y = 2', display: true },
      ],
    };
    const html = renderer.renderBlock(block);
    expect(html).toContain('math-block');
    expect(html).toContain('katex');
    expect(html).toContain('x = 1');
    expect(html).toContain('y = 2');
  });

  it('should have aria labels', () => {
    const html = renderer.renderLatex('x^2', true);
    expect(html).toContain('aria-label');
    expect(html).toContain('role="math"');
  });

  it('should handle errors gracefully', () => {
    const html = renderer.renderLatex('\\invalid{', false);
    expect(html).toContain('math-inline');
    expect(html).toContain('katex');
  });

  it('should include KaTeX CSS class for styling', () => {
    const html = renderer.renderLatex('\\sum_{i=1}^{n} x_i', true);
    expect(html).toContain('katex-display');
    expect(html).toContain('math-display');
  });
});
