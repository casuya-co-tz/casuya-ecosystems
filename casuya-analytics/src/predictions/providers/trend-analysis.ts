import { PredictionResult, TimeSeriesPoint, TimeRange } from '../../interfaces';
import { BasePredictionProvider } from './base-prediction';

export class TrendAnalysisProvider extends BasePredictionProvider {
  readonly name = 'trend-analysis';
  private historicalData: Map<string, TimeSeriesPoint[]> = new Map();

  async train(metric: string, data: TimeSeriesPoint[]): Promise<void> {
    await super.train(metric, data);
    this.historicalData.set(metric, [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
  }

  async predict(metric: string, horizon: string, range: TimeRange): Promise<PredictionResult> {
    const data = this.historicalData.get(metric);
    if (!data || data.length < 2) {
      return this.createDefaultResult(metric, horizon, 0);
    }

    const regression = this.linearRegression(data);
    const horizonMs = this.parseHorizon(horizon);
    const forecastEnd = new Date(range.end.getTime() + horizonMs);

    const predictedValue = regression.slope * forecastEnd.getTime() + regression.intercept;
    const residuals = data.map(p => p.value - (regression.slope * p.timestamp.getTime() + regression.intercept));
    const stdDev = this.standardDeviation(residuals);
    const confidenceInterval = 1.96 * stdDev;

    return {
      id: `pred_${metric}_${Date.now()}`,
      metric,
      model: this.name,
      predicted_value: Math.max(0, predictedValue),
      confidence_interval: [
        Math.max(0, predictedValue - confidenceInterval),
        predictedValue + confidenceInterval,
      ],
      confidence_level: 0.95,
      forecast_horizon: horizon,
      generated_at: new Date(),
      valid_until: forecastEnd,
      metadata: {
        data_points: data.length,
        r_squared: this.rSquared(data, regression),
        slope: regression.slope,
        intercept: regression.intercept,
      },
    };
  }

  async evaluate(metric: string, actual: TimeSeriesPoint[], predicted: PredictionResult[]): Promise<number> {
    if (actual.length === 0 || predicted.length === 0) return 0;

    const sorted = [...actual].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const actualValues = sorted.map(p => p.value);
    const predictedValues = predicted.map(p => p.predicted_value);

    const minLen = Math.min(actualValues.length, predictedValues.length);
    const mse = actualValues.slice(0, minLen).reduce(
      (sum, actual, i) => sum + Math.pow(actual - predictedValues[i], 2), 0,
    ) / minLen;

    return Math.sqrt(mse);
  }

  private linearRegression(data: TimeSeriesPoint[]): { slope: number; intercept: number } {
    const n = data.length;
    const xMean = data.reduce((s, p) => s + p.timestamp.getTime(), 0) / n;
    const yMean = data.reduce((s, p) => s + p.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (const point of data) {
      const xDiff = point.timestamp.getTime() - xMean;
      const yDiff = point.value - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    return { slope, intercept };
  }

  private rSquared(data: TimeSeriesPoint[], regression: { slope: number; intercept: number }): number {
    const yMean = data.reduce((s, p) => s + p.value, 0) / data.length;
    const ssRes = data.reduce((s, p) => {
      const predicted = regression.slope * p.timestamp.getTime() + regression.intercept;
      return s + Math.pow(p.value - predicted, 2);
    }, 0);
    const ssTot = data.reduce((s, p) => s + Math.pow(p.value - yMean, 2), 0);
    return ssTot !== 0 ? 1 - ssRes / ssTot : 0;
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
      metadata: { insufficient_data: true },
    };
  }
}
