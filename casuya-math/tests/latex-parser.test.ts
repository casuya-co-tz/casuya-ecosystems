import { describe, it, expect, beforeEach } from 'vitest';
import { LaTeXParser } from '../src/latex-parser';

describe('LaTeXParser', () => {
  let parser: LaTeXParser;

  beforeEach(() => {
    parser = new LaTeXParser();
  });

  it('should parse display math blocks', () => {
    const blocks = parser.parseDocument('<p>$$x^2 + y^2 = r^2$$</p>');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].expressions[0].latex).toBe('x^2 + y^2 = r^2');
  });

  it('should parse multiple blocks', () => {
    const blocks = parser.parseDocument('$$a$$ and $$b$$ and $$c$$');
    expect(blocks).toHaveLength(3);
  });

  it('should parse align environments', () => {
    const blocks = parser.parseDocument('\\begin{align} x &= 1 \\\\ y &= 2 \\end{align}');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].environment).toBe('align');
    expect(blocks[0].expressions.length).toBe(2);
  });

  it('should parse inline math', () => {
    const exprs = parser.parseInline('<p>Let $x = 5$ and $y = 3$</p>');
    expect(exprs).toHaveLength(2);
    expect(exprs[0].latex).toBe('x = 5');
    expect(exprs[0].display).toBe(false);
  });

  it('should parse <math> tags', () => {
    const blocks = parser.parseDocument('<math>x + y = z</math>');
    expect(blocks).toHaveLength(1);
  });

  it('should split lines on \\\\', () => {
    const lines = parser.splitLines('x = 1 \\\\ y = 2 \\\\ z = 3');
    expect(lines).toHaveLength(3);
  });

  it('should extract labels', () => {
    const labels = parser.extractLabels('\\label{eq:main} x = y \\label{eq:sub}');
    expect(labels).toHaveLength(2);
    expect(labels[0].label).toBe('eq:main');
  });
});
