import { PredictionResult, TimeSeriesPoint, TimeRange } from './types';

export interface PredictionModelConfig {
  model: string;
  hyperparameters?: Record<string, unknown>;
  training_window?: string;
  features?: string[];
}

export interface PredictionProvider {
  readonly name: string;
  configure(config: PredictionModelConfig): Promise<void>;
  train(metric: string, data: TimeSeriesPoint[]): Promise<void>;
  predict(metric: string, horizon: string, range: TimeRange): Promise<PredictionResult>;
  evaluate(metric: string, actual: TimeSeriesPoint[], predicted: PredictionResult[]): Promise<number>;
  shutdown(): Promise<void>;
}
