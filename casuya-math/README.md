# Casuya Math

Math, science equation, and graph rendering for the Casuya educational platform.

## Installation

```bash
pnpm install
```

## Usage

```typescript
import { MathRenderer, GraphRenderer, ChemRenderer } from 'casuya-math';

const renderer = new MathRenderer();
const html = renderer.render('E = mc^2');
```

## Key Features

- LaTeX parsing and rendering
- Equation solving
- Graph rendering
- Chemistry notation
- STEM content conversion
