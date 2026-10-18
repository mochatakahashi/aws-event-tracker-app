import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Config() {
  const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS credentials missing. Please set APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in Vercel Project Settings.'
    );
  }

  if (!bucketName) {
    throw new Error(
      'AWS_S3_BUCKET_NAME is not set. Please add AWS_S3_BUCKET_NAME in Vercel Project Settings.'
    );
  }

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
  });

  return { client, bucketName, region };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const { client, bucketName, region } = getS3Config();

    const ext = filename.split('.').pop() || 'jpg';
    const key = `events/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    // Served through /api/uploads?action=image so it works with a private bucket
    const publicUrl = `/api/uploads?action=image&key=${encodeURIComponent(key)}`;
    void region;

    return res.status(200).json({
      uploadUrl,
      fileUrl: publicUrl,
      key,
    });
  } catch (err: any) {
    console.error('Error generating presigned S3 upload URL:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate upload URL',
      code: err.name || 'UPLOAD_ERROR',
    });
  }
}
