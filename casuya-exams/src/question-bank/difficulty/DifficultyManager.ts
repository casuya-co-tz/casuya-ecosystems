import { DifficultyLevel, DifficultyConfig } from '../../types';

const DEFAULT_DIFFICULTIES: DifficultyConfig[] = [
  {
    level: 'easy',
    label: 'Easy',
    color: '#22c55e',
    weight: 1,
    description: 'Basic recall and simple understanding questions',
  },
  {
    level: 'medium',
    label: 'Medium',
    color: '#eab308',
    weight: 2,
    description: 'Application and comprehension questions',
  },
  {
    level: 'hard',
    label: 'Hard',
    color: '#f97316',
    weight: 3,
    description: 'Analysis and synthesis questions',
  },
  {
    level: 'very-hard',
    label: 'Very Hard',
    color: '#ef4444',
    weight: 4,
    description: 'Evaluation and complex multi-step questions',
  },
];

export class DifficultyManager {
  private difficulties: Map<DifficultyLevel, DifficultyConfig>;

  constructor(customDifficulties?: DifficultyConfig[]) {
    this.difficulties = new Map();
    const configs = customDifficulties ?? DEFAULT_DIFFICULTIES;
    for (const config of configs) {
      this.difficulties.set(config.level, config);
    }
  }

  getConfig(level: DifficultyLevel): DifficultyConfig | undefined {
    return this.difficulties.get(level);
  }

  getAllConfigs(): DifficultyConfig[] {
    return Array.from(this.difficulties.values());
  }

  registerDifficulty(config: DifficultyConfig): void {
    this.difficulties.set(config.level, config);
  }

  registerDifficulties(configs: DifficultyConfig[]): void {
    for (const config of configs) {
      this.difficulties.set(config.level, config);
    }
  }

  getWeight(level: DifficultyLevel): number {
    return this.difficulties.get(level)?.weight ?? 0;
  }

  calculateDifficultyFromStats(correctRate: number): DifficultyLevel {
    if (correctRate >= 0.8) return 'easy';
    if (correctRate >= 0.6) return 'medium';
    if (correctRate >= 0.4) return 'hard';
    return 'very-hard';
  }

  getDifficultyDistribution(
    questionDifficulties: DifficultyLevel[],
  ): Record<DifficultyLevel, number> {
    const distribution: Record<DifficultyLevel, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      'very-hard': 0,
    };
    for (const d of questionDifficulties) {
      distribution[d] = (distribution[d] || 0) + 1;
    }
    return distribution;
  }

  clear(): void {
    this.difficulties.clear();
  }
}
