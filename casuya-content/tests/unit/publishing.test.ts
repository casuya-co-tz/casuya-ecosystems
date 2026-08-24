import { PublishingService, MemoryPublishingProvider } from '../../src/publishing';

describe('PublishingService', () => {
  let service: PublishingService;

  beforeEach(async () => {
    const provider = new MemoryPublishingProvider();
    service = new PublishingService(provider);
    await service.initialize();
  });

  it('should publish content', async () => {
    const state = await service.publish('content-1', 'author-1');
    expect(state.status).toBe('published');
    expect(state.publishedBy).toBe('author-1');
    expect(state.publishedAt).toBeDefined();
  });

  it('should unpublish content', async () => {
    await service.publish('content-1', 'author-1');
    const state = await service.unpublish('content-1');
    expect(state.status).toBe('draft');
  });

  it('should schedule publishing', async () => {
    const future = new Date(Date.now() + 86400000);
    const state = await service.schedule('content-1', future, 'author-1');
    expect(state.scheduledAt).toEqual(future);
  });

  it('should process scheduled publishing', async () => {
    const past = new Date(Date.now() - 3600000);
    await service.schedule('content-1', past, 'author-1');
    const result = await service.processScheduledPublishing();
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);

    const state = await service.getPublishingState('content-1');
    expect(state!.status).toBe('published');
  });

  it('should archive content', async () => {
    const state = await service.archive('content-1', 'admin', 'No longer needed');
    expect(state.status).toBe('archived');
  });

  it('should restore archived content', async () => {
    await service.archive('content-1', 'admin');
    const restored = await service.restore('content-1');
    expect(restored.status).toBe('draft');
  });

  it('should get published content', async () => {
    await service.publish('content-1', 'admin');
    await service.publish('content-2', 'admin');
    const published = await service.getPublishedContent();
    expect(published.total).toBe(2);
  });
});
