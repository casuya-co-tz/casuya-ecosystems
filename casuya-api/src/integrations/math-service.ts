export interface SolveOutput {
  steps: string[];
  solution: string;
  latex: string;
}

export interface EquivalenceOutput {
  equivalent: boolean;
  confidence: number;
}

/**
 * Thin wrapper around the `casuya-math` workspace package.
 * Falls back to a local evaluator when the package is unavailable.
 */
export class MathService {
  private EquationSolverCtor: any = null;
  private loaded = false;

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const mod = await import('casuya-math');
      this.EquationSolverCtor = (mod as any).EquationSolver;
    } catch {
      this.EquationSolverCtor = null;
    }
    this.loaded = true;
  }

  async solveEquation(equation: string): Promise<SolveOutput> {
    await this.ensureLoaded();
    if (this.EquationSolverCtor) {
      try {
        const solver = new this.EquationSolverCtor();
        const parsed = this.parseAssignments(equation);
        if (parsed) {
          const lhs = parsed.lhs.replace(/\s+/g, '');
          const physicsEq: any = {
            type: 'dynamic',
            formula: `${lhs} = ${parsed.rhs}`,
            variables: { [lhs]: { value: 0, unit: '' }, ...this.valuesToVars(parsed.values) },
            result: undefined,
          };
          const res = solver.solve(physicsEq);
          if (res.result && typeof res.result.value === 'number' && isFinite(res.result.value)) {
            return {
              steps: [equation, `${lhs} = ${res.result.value}${res.result.unit}`],
              solution: `${res.result.value}${res.result.unit}`,
              latex: `${lhs} = ${res.result.value}`,
            };
          }
        }
      } catch {
        /* fall through to local */
      }
    }
    return this.localSolve(equation);
  }

  async checkEquivalence(expr1: string, expr2: string): Promise<EquivalenceOutput> {
    await this.ensureLoaded();
    // Numerical equivalence: sample values for free variables and compare.
    const numeric = this.numericEquivalence(expr1, expr2);
    if (numeric) return numeric;
    // Structural fallback.
    const norm1 = expr1.replace(/\s+/g, '').toLowerCase();
    const norm2 = expr2.replace(/\s+/g, '').toLowerCase();
    const equivalent = norm1 === norm2;
    return { equivalent, confidence: equivalent ? 0.85 : 0.1 };
  }

  private numericEquivalence(a: string, b: string): EquivalenceOutput | null {
    const vars = new Set<string>([...this.freeVars(a), ...this.freeVars(b)]);
    if (vars.size > 3) return null; // keep it cheap
    const samples = [1, 2, 3, -1, 0.5];
    try {
      for (const v of samples) {
        const env: Record<string, number> = {};
        [...vars].forEach((name, i) => (env[name] = v + i * 0.3));
        const va = this.evalExpr(a, env);
        const vb = this.evalExpr(b, env);
        if (va === null || vb === null) return null;
        if (Math.abs(va - vb) > 1e-6) return { equivalent: false, confidence: 0.95 };
      }
      return { equivalent: true, confidence: 0.9 };
    } catch {
      return null;
    }
  }

  private evalExpr(expr: string, env: Record<string, number>): number | null {
    try {
      const sanitized = expr
        .replace(/\^/g, '**')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '((($1)/($2)))')
        .replace(/\\sqrt\{([^}]+)\}/g, 'Math.sqrt($1)')
        .replace(/\\cdot|\\times|\\div/g, (m) => (m === '\\div' ? '/' : '*'));
      const fn = new Function(...Object.keys(env), `"use strict"; return (${sanitized});`);
      const val = fn(...Object.values(env));
      return typeof val === 'number' && isFinite(val) ? val : null;
    } catch {
      return null;
    }
  }

  private freeVars(expr: string): string[] {
    const matches = expr.match(/[a-zA-Z]+/g) || [];
    const reserved = new Set(['sqrt', 'frac', 'cdot', 'times', 'div', 'sin', 'cos', 'tan', 'log', 'pi', 'e']);
    return [...new Set(matches.filter((m) => !reserved.has(m.toLowerCase())))];
  }

  private parseAssignments(equation: string): { lhs: string; rhs: string; values: Record<string, number> } | null {
    const m = equation.match(/^\s*([a-zA-Z]+)\s*=\s*(.+)$/);
    if (!m) return null;
    const rhs = m[2];
    const values: Record<string, number> = {};
    const tokenRe = /([a-zA-Z]+)\s*=\s*(-?\d*\.?\d+)/g;
    let tm;
    while ((tm = tokenRe.exec(rhs)) !== null) {
      values[tm[1]] = parseFloat(tm[2]);
    }
    return { lhs: m[1], rhs, values };
  }

  private valuesToVars(values: Record<string, number>): Record<string, { value: number; unit: string }> {
    const out: Record<string, { value: number; unit: string }> = {};
    for (const [k, v] of Object.entries(values)) out[k] = { value: v, unit: '' };
    return out;
  }

  private localSolve(equation: string): SolveOutput {
    const parsed = this.parseAssignments(equation);
    if (parsed) {
      const env = this.valuesToVars(parsed.values);
      const lhs = parsed.lhs.replace(/\s+/g, '');
      const val = this.evalExpr(parsed.rhs, Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v.value])));
      if (val !== null) {
        return { steps: [equation, `${lhs} = ${val}`], solution: `${val}`, latex: `${lhs} = ${val}` };
      }
    }
    return { steps: [equation], solution: 'Unable to solve', latex: equation };
  }
}
