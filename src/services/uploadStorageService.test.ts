import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecentUploads,
  getLatestUpload,
  saveUploadRecord,
  deleteUploadRecord,
} from './uploadStorageService';
import type { EventUploadItem } from '../types/upload';

describe('uploadStorageService', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('loads recent uploads with seed data sorted newest first', async () => {
    const uploads = await getRecentUploads();
    expect(uploads.length).toBeGreaterThanOrEqual(1);

    // Verify ordering
    for (let i = 0; i < uploads.length - 1; i++) {
      const current = new Date(uploads[i].uploadedAt).getTime();
      const next = new Date(uploads[i + 1].uploadedAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('retrieves the single latest upload', async () => {
    const latest = await getLatestUpload();
    expect(latest).toBeDefined();
    expect(latest?.id).toBeDefined();
    expect(latest?.url).toBeDefined();
  });

  it('saves a new upload record and puts it at the top of recent uploads', async () => {
    const newUpload: EventUploadItem = {
      id: 'upl-test-custom-1',
      url: 'https://example.com/test-banner.jpg',
      name: 'test-banner.jpg',
      size: 50000,
      mimeType: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      category: 'banner',
      storageType: 'local',
      eventId: 'evt-custom',
    };

    await saveUploadRecord(newUpload);

    const uploads = await getRecentUploads();
    expect(uploads[0].id).toBe('upl-test-custom-1');
    expect(uploads[0].name).toBe('test-banner.jpg');

    const latest = await getLatestUpload();
    expect(latest?.id).toBe('upl-test-custom-1');
  });

  it('filters uploads by category and eventId', async () => {
    const speakerUpload: EventUploadItem = {
      id: 'upl-speaker-test',
      url: 'https://example.com/speaker.jpg',
      name: 'speaker.jpg',
      size: 30000,
      mimeType: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      category: 'speaker',
      storageType: 'local',
      eventId: 'evt-special',
    };

    await saveUploadRecord(speakerUpload);

    const filtered = await getRecentUploads({ category: 'speaker' });
    expect(filtered.some((u) => u.id === 'upl-speaker-test')).toBe(true);

    const byEvent = await getRecentUploads({ eventId: 'evt-special' });
    expect(byEvent.length).toBe(1);
    expect(byEvent[0].id).toBe('upl-speaker-test');
  });

  it('deletes an upload record by id', async () => {
    const tempUpload: EventUploadItem = {
      id: 'upl-to-delete',
      url: 'https://example.com/delete-me.jpg',
      name: 'delete-me.jpg',
      uploadedAt: new Date().toISOString(),
      category: 'banner',
      storageType: 'local',
    };

    await saveUploadRecord(tempUpload);
    let uploads = await getRecentUploads();
    expect(uploads.some((u) => u.id === 'upl-to-delete')).toBe(true);

    await deleteUploadRecord('upl-to-delete');
    uploads = await getRecentUploads();
    expect(uploads.some((u) => u.id === 'upl-to-delete')).toBe(false);
  });
});
