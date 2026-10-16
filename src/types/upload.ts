/**
 * Represents an uploaded event picture or asset stored in
 * persistent file storage (S3 and/or local IndexedDB).
 */
export interface EventUploadItem {
  id: string;
  url: string;
  name: string;
  size?: number; // Size in bytes
  mimeType?: string;
  uploadedAt: string; // ISO 8601 string
  eventId?: string;
  eventTitle?: string;
  category?: 'banner' | 'speaker' | 'gallery' | 'general';
  storageType: 's3' | 'local';
  width?: number;
  height?: number;
}
