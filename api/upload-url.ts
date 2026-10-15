import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from './lib/aws';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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

    if (!S3_BUCKET_NAME) {
      return res.status(500).json({
        error: 'AWS_S3_BUCKET_NAME is not configured in environment variables.',
      });
    }

    const ext = filename.split('.').pop() || 'jpg';
    const key = `events/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
    const publicUrl = `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    return res.status(200).json({
      uploadUrl,
      fileUrl: publicUrl,
      key,
    });
  } catch (err: any) {
    console.error('Error generating presigned S3 upload URL:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate upload URL' });
  }
}
