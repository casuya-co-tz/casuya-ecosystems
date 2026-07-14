import type { PhysicsEquation } from './types';

export class EquationSolver {
  private _constants: Map<string, number> = new Map([
    ['g', 9.80665],
    ['c', 299792458],
    ['h', 6.62607015e-34],
    ['k', 1.380649e-23],
    ['e', 1.602176634e-19],
    ['R', 8.314],
    ['NA', 6.02214076e23],
    ['sigma', 5.670374419e-8],
    ['epsilon0', 8.8541878128e-12],
    ['mu0', 1.25663706212e-6],
    ['pi', Math.PI],
    ['euler', Math.E],
  ]);

  solve(equation: PhysicsEquation): PhysicsEquation {
    const result = { ...equation };
    const vars = equation.variables;
    const formula = equation.formula;

    try {
      let processedFormula = formula;
      for (const [name, data] of Object.entries(vars)) {
        if (data.value !== undefined) {
          processedFormula = processedFormula.replace(
            new RegExp(`\\b${name}\\b`, 'g'),
            `(${data.value})`,
          );
        }
      }

      for (const [name, value] of this._constants) {
        processedFormula = processedFormula.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${value})`);
      }

      const value = Function(`"use strict"; return (${processedFormula})`)() as number;
      if (isFinite(value)) {
        const unitEntry = Object.values(vars).find((v) => v.value === undefined);
        result.result = {
          value: parseFloat(value.toPrecision(6)),
          unit: unitEntry?.unit ?? '',
        };
      }
    } catch {
      result.result = undefined;
    }

    return result;
  }

  solveFor(variable: string, equation: PhysicsEquation): number | null {
    const vars = { ...equation.variables };
    const target = vars[variable];
    if (!target) return null;

    const saved = target.value;
    target.value = 0;

    for (let guess = -1000; guess <= 1000; guess += 0.001) {
      target.value = guess;
      const result = this.solve({ ...equation, variables: vars });
      if (result.result && Math.abs(result.result.value) < 0.0001) {
        return parseFloat(guess.toPrecision(6));
      }
    }

    target.value = saved;
    return null;
  }

  addConstant(name: string, value: number): void {
    this._constants.set(name, value);
  }

  getConstants(): Record<string, number> {
    return Object.fromEntries(this._constants);
  }

  listFormulas(): Array<{ name: string; formula: string; variables: string[] }> {
    return [
      { name: "Newton's Second Law", formula: 'F = m * a', variables: ['F', 'm', 'a'] },
      { name: 'Kinetic Energy', formula: 'KE = 0.5 * m * v^2', variables: ['KE', 'm', 'v'] },
      { name: 'Gravitational PE', formula: 'PE = m * g * h', variables: ['PE', 'm', 'g', 'h'] },
      { name: "Ohm's Law", formula: 'V = I * R', variables: ['V', 'I', 'R'] },
      { name: 'Wave Speed', formula: 'v = f * lambda', variables: ['v', 'f', 'lambda'] },
      {
        name: 'Period of Pendulum',
        formula: 'T = 2 * pi * sqrt(L / g)',
        variables: ['T', 'L', 'g'],
      },
      { name: 'Ideal Gas Law', formula: 'PV = nRT', variables: ['P', 'V', 'n', 'R', 'T'] },
      {
        name: 'Coulomb Force',
        formula: 'F = k * q1 * q2 / r^2',
        variables: ['F', 'k', 'q1', 'q2', 'r'],
      },
      {
        name: 'Doppler Effect',
        formula: 'f_obs = f_src * (v + v_obs) / (v - v_src)',
        variables: ['f_obs', 'f_src', 'v', 'v_obs', 'v_src'],
      },
      {
        name: 'Stefan-Boltzmann',
        formula: 'P = sigma * A * T^4',
        variables: ['P', 'sigma', 'A', 'T'],
      },
      { name: 'de Broglie', formula: 'lambda = h / (m * v)', variables: ['lambda', 'h', 'm', 'v'] },
      { name: 'Photoelectric', formula: 'E = h * f - phi', variables: ['E', 'h', 'f', 'phi'] },
    ];
  }
}
