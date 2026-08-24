import { AnalyticsEvent } from '../../../interfaces';
import { PipelineContext, PipelineStage } from '../../../interfaces';

export type EnrichmentFunction = (event: AnalyticsEvent) => Record<string, unknown>;

export class EnrichStage implements PipelineStage {
  readonly name: string;

  constructor(
    name: string,
    private enrichments: EnrichmentFunction[],
  ) {
    this.name = name;
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    let enriched = { ...context.event };

    for (const enrich of this.enrichments) {
      const enrichmentData = enrich(enriched);
      enriched = {
        ...enriched,
        payload: {
          ...enriched.payload,
          ...enrichmentData,
        },
      };
    }

    return { ...context, event: enriched };
  }

  canHandle(_event: AnalyticsEvent): boolean {
    return true;
  }
}

export function createGeoEnrichment(): EnrichmentFunction {
  return (event: AnalyticsEvent) => {
    const ip = event.payload?.ip_address as string;
    if (!ip) return {};
    return {
      geo_enriched: true,
      ip_prefix: ip.substring(0, ip.lastIndexOf('.')),
    };
  };
}

export function createTimestampEnrichment(): EnrichmentFunction {
  return (_event: AnalyticsEvent) => ({
    enriched_at: new Date().toISOString(),
    processing_timestamp: Date.now(),
  });
}

export function createUserAgentEnrichment(): EnrichmentFunction {
  return (event: AnalyticsEvent) => {
    const ua = event.payload?.user_agent as string;
    if (!ua) return {};
    return {
      user_agent_parsed: true,
      is_mobile: ua.toLowerCase().includes('mobile'),
      browser: ua.includes('Chrome') ? 'chrome'
        : ua.includes('Firefox') ? 'firefox'
        : ua.includes('Safari') ? 'safari'
        : 'unknown',
    };
  };
}
