import { TrendAnalysisProvider } from '../src/predictions/providers/trend-analysis';
import { MovingAverageProvider } from '../src/predictions/providers/moving-average';
import { AnomalyDetectorProvider } from '../src/predictions/providers/anomaly-detector';
import { TimeRange } from '../src/interfaces';

describe('TrendAnalysisProvider', () => {
  let provider: TrendAnalysisProvider;

  beforeEach(async () => {
    provider = new TrendAnalysisProvider();
    await provider.configure({ model: 'linear', hyperparameters: {} });
  });

  it('should predict with linear regression', async () => {
    const now = Date.now();
    const data = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(now + i * 3600000),
      value: 100 + i * 5,
    }));

    await provider.train('growth_metric', data);

    const range: TimeRange = { start: new Date(now), end: new Date(now + 19 * 3600000), granularity: 'hour' };
    const result = await provider.predict('growth_metric', '1d', range);

    expect(result.predicted_value).toBeGreaterThan(0);
    expect(result.confidence_interval[0]).toBeLessThanOrEqual(result.confidence_interval[1]);
    expect(result.metadata?.r_squared).toBeCloseTo(1, 0);
  });

  it('should return default for insufficient data', async () => {
    const range: TimeRange = { start: new Date(), end: new Date(), granularity: 'hour' };
    const result = await provider.predict('empty', '1d', range);
    expect(result.predicted_value).toBe(0);
    expect(result.confidence_level).toBe(0);
  });

  it('should evaluate prediction error', async () => {
    const now = Date.now();
    const trainData = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(now + i * 3600000),
      value: i * 10,
    }));

    await provider.train('eval_metric', trainData);
    const range: TimeRange = { start: new Date(now), end: new Date(now + 9 * 3600000), granularity: 'hour' };
    const prediction = await provider.predict('eval_metric', '1h', range);

    const actual = [{ timestamp: new Date(now + 10 * 3600000), value: 100 }];
    const rmse = await provider.evaluate('eval_metric', actual, [prediction]);
    expect(rmse).toBeGreaterThanOrEqual(0);
  });
});

describe('MovingAverageProvider', () => {
  let provider: MovingAverageProvider;

  beforeEach(async () => {
    provider = new MovingAverageProvider();
    await provider.configure({ model: 'ma', hyperparameters: { windowSize: 3 } });
  });

  it('should compute moving average forecast', async () => {
    const now = Date.now();
    const data = [10, 20, 30, 40, 50, 60].map((v, i) => ({
      timestamp: new Date(now + i * 3600000),
      value: v,
    }));

    await provider.train('ma_metric', data);
    const range: TimeRange = { start: new Date(now), end: new Date(now + 5 * 3600000), granularity: 'hour' };
    const result = await provider.predict('ma_metric', '1h', range);

    expect(result.predicted_value).toBeCloseTo(50, 0);
    expect(result.metadata?.window_size).toBe(3);
  });

  it('should return default for insufficient data', async () => {
    const now = Date.now();
    const data = [{ timestamp: new Date(now), value: 100 }];

    await provider.train('short', data);
    const range: TimeRange = { start: new Date(now), end: new Date(now), granularity: 'hour' };
    const result = await provider.predict('short', '1h', range);

    expect(result.metadata?.insufficient_data).toBe(true);
  });
});

describe('AnomalyDetectorProvider', () => {
  let provider: AnomalyDetectorProvider;

  beforeEach(async () => {
    provider = new AnomalyDetectorProvider();
    await provider.configure({ model: 'zscore', hyperparameters: { threshold: 2 } });
  });

  it('should detect anomalous values', async () => {
    const now = Date.now();
    const baseline = [48, 49, 50, 51, 52];
    const data = [
      ...Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(now + i * 3600000),
        value: baseline[i % baseline.length],
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        timestamp: new Date(now + (20 + i) * 3600000),
        value: 500,
      })),
    ];

    await provider.train('anomaly_metric', data);
    const range: TimeRange = { start: new Date(now), end: new Date(now + 21 * 3600000), granularity: 'hour' };
    const result = await provider.predict('anomaly_metric', '1h', range);

    expect(result.metadata?.is_anomaly).toBe(true);
    expect(result.metadata?.z_score).toBeGreaterThan(2);
  });

  it('should report no anomaly for normal data', async () => {
    const now = Date.now();
    const data = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(now + i * 3600000),
      value: 50 + Math.random() * 5,
    }));

    await provider.train('normal_metric', data);
    const range: TimeRange = { start: new Date(now), end: new Date(now + 19 * 3600000), granularity: 'hour' };
    const result = await provider.predict('normal_metric', '1h', range);

    expect(result.metadata?.is_anomaly).toBe(false);
  });
});
