import { PredictionModelConfig, PredictionResult, TimeSeriesPoint, TimeRange } from '../../interfaces';
import { BasePredictionProvider } from './base-prediction';

export class MovingAverageProvider extends BasePredictionProvider {
  readonly name = 'moving-average';
  private historicalData: Map<string, TimeSeriesPoint[]> = new Map();
  private windowSize = 7;

  async configure(config: PredictionModelConfig): Promise<void> {
    await super.configure(config);
    if (config.hyperparameters?.windowSize) {
      this.windowSize = config.hyperparameters.windowSize as number;
    }
  }

  async train(metric: string, data: TimeSeriesPoint[]): Promise<void> {
    await super.train(metric, data);
    const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.historicalData.set(metric, sorted);
  }

  async predict(metric: string, horizon: string, range: TimeRange): Promise<PredictionResult> {
    const data = this.historicalData.get(metric);
    if (!data || data.length < this.windowSize) {
      return this.createDefaultResult(metric, horizon, 0);
    }

    const recent = data.slice(-this.windowSize);
    const ma = recent.reduce((s, p) => s + p.value, 0) / recent.length;
    const stdDev = this.standardDeviation(recent.map(p => p.value));
    const horizonMs = this.parseHorizon(horizon);
    const forecastEnd = new Date(range.end.getTime() + horizonMs);

    return {
      id: `pred_${metric}_${Date.now()}`,
      metric,
      model: this.name,
      predicted_value: Math.max(0, ma),
      confidence_interval: [
        Math.max(0, ma - 1.96 * stdDev),
        ma + 1.96 * stdDev,
      ],
      confidence_level: 0.95,
      forecast_horizon: horizon,
      generated_at: new Date(),
      valid_until: forecastEnd,
      metadata: {
        window_size: this.windowSize,
        data_points: data.length,
        moving_average: ma,
      },
    };
  }

  async evaluate(metric: string, actual: TimeSeriesPoint[], predicted: PredictionResult[]): Promise<number> {
    if (actual.length === 0 || predicted.length === 0) return 0;
    const minLen = Math.min(actual.length, predicted.length);
    const mse = actual.slice(0, minLen).reduce(
      (sum, p, i) => sum + Math.pow(p.value - predicted[i].predicted_value, 2), 0,
    ) / minLen;
    return Math.sqrt(mse);
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private parseHorizon(horizon: string): number {
    const match = horizon.match(/^(\d+)\s*(m|h|d|w|M)$/);
    if (!match) return 86400000;
    const amount = parseInt(match[1], 10);
    switch (match[2]) {
      case 'm': return amount * 60000;
      case 'h': return amount * 3600000;
      case 'd': return amount * 86400000;
      case 'w': return amount * 604800000;
      case 'M': return amount * 2592000000;
      default: return amount * 86400000;
    }
  }

  private createDefaultResult(metric: string, horizon: string, value: number): PredictionResult {
    return {
      id: `pred_${metric}_${Date.now()}`,
      metric,
      model: this.name,
      predicted_value: value,
      confidence_interval: [0, 0],
      confidence_level: 0,
      forecast_horizon: horizon,
      generated_at: new Date(),
      valid_until: new Date(Date.now() + this.parseHorizon(horizon)),
      metadata: { insufficient_data: true, required_points: this.windowSize },
    };
  }
}
