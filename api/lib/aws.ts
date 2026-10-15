import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const credentials = accessKeyId && secretAccessKey
  ? {
      accessKeyId,
      secretAccessKey,
    }
  : undefined;

export const s3Client = new S3Client({
  region,
  credentials,
});

const rawDdbClient = new DynamoDBClient({
  region,
  credentials,
});

export const ddbDocClient = DynamoDBDocumentClient.from(rawDdbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
export const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'aws_events';
