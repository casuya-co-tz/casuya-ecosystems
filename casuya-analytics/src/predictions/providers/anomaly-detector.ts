import { PredictionModelConfig, PredictionResult, TimeSeriesPoint, TimeRange } from '../../interfaces';
import { BasePredictionProvider } from './base-prediction';

export class AnomalyDetectorProvider extends BasePredictionProvider {
  readonly name = 'anomaly-detector';
  private historicalData: Map<string, TimeSeriesPoint[]> = new Map();
  private threshold = 3;
  private recentWindowSize = 10;

  async configure(config: PredictionModelConfig): Promise<void> {
    await super.configure(config);
    if (config.hyperparameters?.threshold) {
      this.threshold = config.hyperparameters.threshold as number;
    }
    if (config.hyperparameters?.recentWindowSize) {
      this.recentWindowSize = config.hyperparameters.recentWindowSize as number;
    }
  }

  async train(metric: string, data: TimeSeriesPoint[]): Promise<void> {
    await super.train(metric, data);
    this.historicalData.set(metric, [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
  }

  async predict(metric: string, horizon: string, range: TimeRange): Promise<PredictionResult> {
    const data = this.historicalData.get(metric);
    if (!data || data.length < 3) {
      return this.createDefaultResult(metric, horizon);
    }

    const values = data.map(p => p.value);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = this.standardDeviation(values, mean);

    const recentPoints = data.slice(-Math.min(this.recentWindowSize, data.length));
    let maxZScore = 0;
    let isAnomaly = false;

    for (const point of recentPoints) {
      const z = stdDev > 0 ? Math.abs(point.value - mean) / stdDev : 0;
      if (z > this.threshold) {
        isAnomaly = true;
        maxZScore = Math.max(maxZScore, z);
      }
    }

    if (maxZScore === 0) {
      const recentMean = recentPoints.reduce((s, p) => s + p.value, 0) / recentPoints.length;
      maxZScore = stdDev > 0 ? Math.abs(recentMean - mean) / stdDev : 0;
    }

    const horizonMs = this.parseHorizon(horizon);
    const forecastEnd = new Date(range.end.getTime() + horizonMs);
    const predictedValue = recentPoints.reduce((s, p) => s + p.value, 0) / recentPoints.length;

    return {
      id: `pred_${metric}_${Date.now()}`,
      metric,
      model: this.name,
      predicted_value: predictedValue,
      confidence_interval: [
        Math.max(0, predictedValue - this.threshold * stdDev),
        predictedValue + this.threshold * stdDev,
      ],
      confidence_level: Math.min(0.99, 1 - 1 / (1 + maxZScore)),
      forecast_horizon: horizon,
      generated_at: new Date(),
      valid_until: forecastEnd,
      metadata: {
        is_anomaly: isAnomaly,
        z_score: maxZScore,
        threshold: this.threshold,
        baseline_mean: mean,
        baseline_std: stdDev,
        recent_mean: predictedValue,
        data_points: data.length,
        anomalous_points: recentPoints.filter(p => {
          const z = stdDev > 0 ? Math.abs(p.value - mean) / stdDev : 0;
          return z > this.threshold;
        }).length,
      },
    };
  }

  async evaluate(metric: string, actual: TimeSeriesPoint[], predicted: PredictionResult[]): Promise<number> {
    if (actual.length === 0 || predicted.length === 0) return 0;
    const anomalies = predicted.filter(p => p.metadata?.is_anomaly === true);
    return anomalies.length > 0 ? anomalies.length / predicted.length : 0;
  }

  private standardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
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

  private createDefaultResult(metric: string, horizon: string): PredictionResult {
    return {
      id: `pred_${metric}_${Date.now()}`,
      metric,
      model: this.name,
      predicted_value: 0,
      confidence_interval: [0, 0],
      confidence_level: 0,
      forecast_horizon: horizon,
      generated_at: new Date(),
      valid_until: new Date(Date.now() + this.parseHorizon(horizon)),
      metadata: { insufficient_data: true },
    };
  }
}
