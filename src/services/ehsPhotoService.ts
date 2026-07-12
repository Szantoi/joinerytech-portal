import { compressPhoto } from '../utils/imageCompression';

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

/**
 * Get presigned S3 URL for photo upload
 */
export async function getPresignedUrl(file: File): Promise<PresignedUrlResponse> {
  const response = await fetch('/api/ehs/photos/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      mime: file.type
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Upload photo to S3 using presigned URL
 * Compresses photo before upload
 */
export async function uploadToS3(presigned: PresignedUrlResponse, file: File): Promise<void> {
  const compressed = await compressPhoto(file);

  const response = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': file.type }
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }
}
