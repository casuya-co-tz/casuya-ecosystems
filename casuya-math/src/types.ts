export interface MathExpression {
  latex: string;
  display?: boolean;
  label?: string;
  id?: string;
}

export interface MathBlock {
  id: string;
  expressions: MathExpression[];
  environment?: string;
  alignment?: 'left' | 'center' | 'right';
  numbered?: boolean;
  number?: number;
}

export interface GraphConfig {
  id: string;
  type: GraphType;
  width?: number;
  height?: number;
  title?: string;
  xlabel?: string;
  ylabel?: string;
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  grid?: boolean;
  legend?: boolean;
  theme?: 'light' | 'dark';
}

export type GraphType =
  | 'line'
  | 'scatter'
  | 'bar'
  | 'histogram'
  | 'pie'
  | 'function'
  | 'parametric'
  | 'polar'
  | 'vector-field'
  | 'phase-portrait'
  | 'free-body-diagram'
  | 'circuit'
  | 'wave'
  | 'trajectory';

export interface GraphDataset {
  label: string;
  data: Array<{ x: number; y: number }>;
  color?: string;
  lineWidth?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  fill?: boolean;
}

export interface GraphData {
  config: GraphConfig;
  datasets: GraphDataset[];
  annotations?: GraphAnnotation[];
  functions?: GraphFunction[];
}

export interface GraphFunction {
  expression: string;
  color?: string;
  label?: string;
  range?: { min: number; max: number };
  samples?: number;
}

export interface GraphAnnotation {
  type: 'text' | 'arrow' | 'point' | 'line' | 'area';
  x: number;
  y: number;
  text?: string;
  x2?: number;
  y2?: number;
  color?: string;
}

export interface PhysicsEquation {
  type:
    | 'kinematic'
    | 'dynamic'
    | 'energy'
    | 'wave'
    | 'electric'
    | 'thermo'
    | 'quantum'
    | 'gravitational';
  variables: Record<string, { value: number; unit: string; label?: string }>;
  formula: string;
  result?: { value: number; unit: string };
}

export interface ChemistryFormula {
  formula: string;
  name?: string;
  type: 'molecular' | 'ionic' | 'structural' | 'reaction';
  reactants?: Array<{ formula: string; coefficient: number }>;
  products?: Array<{ formula: string; coefficient: number }>;
  balanced?: boolean;
}

export interface STEMContent {
  math?: MathBlock[];
  graphs?: GraphData[];
  equations?: PhysicsEquation[];
  chemistry?: ChemistryFormula[];
  units?: UnitConversion[];
}

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
  formula?: string;
}

export interface RenderOptions {
  outputFormat: 'html' | 'svg' | 'canvas' | 'png';
  theme?: 'light' | 'dark';
  fontSize?: number;
  scale?: number;
  color?: string;
  inline?: boolean;
  throwOnError?: boolean;
  trust?: boolean;
  strict?: boolean;
  macros?: Record<string, string>;
}
