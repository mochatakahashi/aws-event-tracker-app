/**
 * Service for uploading assets directly to Amazon S3 using pre-signed URLs.
 */
export async function uploadImageToS3(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // 1. Request presigned upload URL from serverless API
  const res = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'image/jpeg',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to get upload authorization (HTTP ${res.status})`
    );
  }

  const { uploadUrl, fileUrl } = await res.json();

  // 2. Upload file directly to S3 bucket via XMLHttpRequest to track progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(fileUrl);
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('The upload failed: check your connection and try again.'));
    // Never wait forever on a stalled connection
    xhr.timeout = 90_000;
    xhr.ontimeout = () => reject(new Error('The upload is taking too long. Check your connection and try again.'));
    xhr.send(file);
  });
}
