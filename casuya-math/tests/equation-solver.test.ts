import { describe, it, expect, beforeEach } from 'vitest';
import { EquationSolver } from '../src/equation-solver';

describe('EquationSolver', () => {
  let solver: EquationSolver;

  beforeEach(() => {
    solver = new EquationSolver();
  });

  it('should solve F = ma', () => {
    const result = solver.solve({
      type: 'dynamic',
      variables: {
        F: { value: undefined as any, unit: 'N' },
        m: { value: 10, unit: 'kg' },
        a: { value: 5, unit: 'm/s\u00b2' },
      },
      formula: 'm * a',
    });
    expect(result.result).toBeDefined();
    expect(result.result!.value).toBe(50);
    expect(result.result!.unit).toBe('N');
  });

  it("should solve Ohm's law V = IR", () => {
    const result = solver.solve({
      type: 'electric',
      variables: {
        V: { value: undefined as any, unit: 'V' },
        I: { value: 2, unit: 'A' },
        R: { value: 10, unit: '\u03a9' },
      },
      formula: 'I * R',
    });
    expect(result.result!.value).toBe(20);
  });

  it('should list formulas', () => {
    const formulas = solver.listFormulas();
    expect(formulas.length).toBeGreaterThan(0);
    expect(formulas.some((f) => f.name.includes('Newton'))).toBe(true);
    expect(formulas.some((f) => f.name.includes('Ohm'))).toBe(true);
  });

  it('should have physical constants', () => {
    const constants = solver.getConstants();
    expect(constants.g).toBeCloseTo(9.80665);
    expect(constants.c).toBeCloseTo(299792458);
    expect(constants.pi).toBeCloseTo(Math.PI);
  });

  it('should add custom constants', () => {
    solver.addConstant('myConst', 42);
    expect(solver.getConstants().myConst).toBe(42);
  });
});
