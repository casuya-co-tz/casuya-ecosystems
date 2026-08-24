import { MediaFactory } from 'casuya-media';
import * as fs from 'fs';
import * as path from 'path';

let media: MediaFactory;
const STORAGE_PATH = process.env.CASUYA_MEDIA_STORAGE || path.join(__dirname, '..', '..', 'storage', 'media');

export async function initMedia() {
  if (!fs.existsSync(STORAGE_PATH)) fs.mkdirSync(STORAGE_PATH, { recursive: true });
  media = new MediaFactory();
  await media.initialize();
}

export const mediaOps = {
  async upload(body: Record<string, unknown>) {
    const buffer = Buffer.from(body.data as string, 'base64');
    const item = await media.upload(buffer, body.filename as string, {
      lessonId: body.lessonId as string | undefined,
      schoolId: body.schoolId as string | undefined,
      tags: body.tags as string[] | undefined,
      process: body.process as boolean | undefined,
    });
    return item;
  },
  async get(id: string) {
    return media.get(id);
  },
  async list(query: Record<string, unknown> = {}) {
    return media.list(query as Parameters<typeof media.list>[0]);
  },
  async remove(id: string) {
    await media.delete(id);
    return { ok: true };
  },
  async deliver(id: string, query: Record<string, unknown> = {}) {
    const result = await media.deliver(id, query as Parameters<typeof media.deliver>[1]);
    return {
      contentType: result.contentType,
      contentLength: result.contentLength,
      buffer: result.buffer.toString('base64'),
      etag: result.etag,
      cacheControl: result.cacheControl,
    };
  },
  async thumbnail(id: string, body: Record<string, unknown>) {
    const result = await media.generateThumbnail(id, body as unknown as Parameters<typeof media.generateThumbnail>[1]);
    return result;
  },
  async stats() {
    return media.getStats();
  },
  async search(query: Record<string, unknown>) {
    return media.search(query as Parameters<typeof media.search>[0]);
  },
};
