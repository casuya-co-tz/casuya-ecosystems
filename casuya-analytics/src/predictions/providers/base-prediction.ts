import { PredictionModelConfig, PredictionProvider, PredictionResult, TimeSeriesPoint, TimeRange } from '../../interfaces';

export abstract class BasePredictionProvider implements PredictionProvider {
  public abstract readonly name: string;
  protected modelConfig!: PredictionModelConfig;
  protected trained = false;
  protected slope = 0;
  protected intercept = 0;
  protected residualStdDev = 0;
  protected r2Score = 0;
  protected lastDataPoints: TimeSeriesPoint[] = [];

  async configure(config: PredictionModelConfig): Promise<void> {
    this.modelConfig = config;
  }

  async train(_metric: string, _data: TimeSeriesPoint[]): Promise<void> {
    if (_data.length < 2) {
      this.trained = true;
      return;
    }

    const sorted = [..._data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.lastDataPoints = sorted;

    const n = sorted.length;
    const xMean = sorted.reduce((s, p) => s + p.timestamp.getTime(), 0) / n;
    const yMean = sorted.reduce((s, p) => s + p.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (const point of sorted) {
      const xDiff = point.timestamp.getTime() - xMean;
      const yDiff = point.value - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    this.slope = denominator !== 0 ? numerator / denominator : 0;
    this.intercept = yMean - this.slope * xMean;

    const residuals = sorted.map(p => p.value - (this.slope * p.timestamp.getTime() + this.intercept));
    this.residualStdDev = this.computeStdDev(residuals);

    const ssRes = residuals.reduce((s, r) => s + r * r, 0);
    const ssTot = sorted.reduce((s, p) => s + Math.pow(p.value - yMean, 2), 0);
    this.r2Score = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    this.trained = true;
  }

  async predict(_metric: string, _horizon: string, _range: TimeRange): Promise<PredictionResult> {
    const match = _horizon.match(/^(\d+)\s*(m|h|d|w|M)$/);
    const amount = match ? parseInt(match[1], 10) : 1;
    const unit = match ? match[2] : 'd';
    const multipliers: Record<string, number> = { m: 60000, h: 3600000, d: 86400000, w: 604800000, M: 2592000000 };
    const horizonMs = amount * (multipliers[unit] ?? 86400000);
    const forecastEnd = new Date(_range.end.getTime() + horizonMs);
    const predictedValue = this.slope * forecastEnd.getTime() + this.intercept;
    const ciMargin = 1.96 * this.residualStdDev;

    return {
      id: crypto.randomUUID(),
      metric: _metric,
      model: this.name,
      predicted_value: predictedValue,
      confidence_interval: [
        predictedValue - ciMargin,
        predictedValue + ciMargin,
      ],
      confidence_level: Math.round(this.r2Score * 100) / 100,
      forecast_horizon: _horizon,
      generated_at: new Date(),
      valid_until: forecastEnd,
      metadata: {
        slope: this.slope,
        intercept: this.intercept,
        r_squared: this.r2Score,
        residual_std_dev: this.residualStdDev,
        data_points: this.lastDataPoints.length,
      },
    };
  }

  async evaluate(_metric: string, _actual: TimeSeriesPoint[], _predicted: PredictionResult[]): Promise<number> {
    if (_actual.length === 0 || _predicted.length === 0) return 0;

    const minLen = Math.min(_actual.length, _predicted.length);
    let sumAPE = 0;
    let count = 0;

    for (let i = 0; i < minLen; i++) {
      const actualVal = _actual[i].value;
      const predVal = _predicted[i].predicted_value;
      if (actualVal === 0) continue;
      sumAPE += Math.abs((actualVal - predVal) / actualVal);
      count++;
    }

    return count > 0 ? (sumAPE / count) * 100 : 0;
  }

  async shutdown(): Promise<void> {
    this.trained = false;
    this.slope = 0;
    this.intercept = 0;
    this.residualStdDev = 0;
    this.r2Score = 0;
    this.lastDataPoints = [];
  }

  protected computeStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

}
