/**
 * Pictures uploaded to S3 used to be saved as public bucket links, which show
 * "Access Denied" when the bucket is private (the default). Those links are
 * served through /api/uploads?action=image instead, which redirects to a
 * short-lived signed link. Other URLs (data:, other sites, already-proxied) are
 * left alone.
 */
const S3_LINK = /^https:\/\/[a-z0-9.-]+\.s3[.-]([a-z0-9-]+\.)?amazonaws\.com\/(events\/[\w.-]+)$/i;

export function imageSrc(url?: string | null): string | undefined {
  if (!url) return url ?? undefined;
  const m = url.match(S3_LINK);
  return m ? `/api/uploads?action=image&key=${encodeURIComponent(m[2])}` : url;
}
