import { createHash } from 'node:crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function deleteCloudinaryImage(publicId) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return;
  const timestamp = Math.round(Date.now() / 1000);
  const str       = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = createHash('sha1').update(str).digest('hex');

  const body = new URLSearchParams({ public_id: publicId, api_key: API_KEY, timestamp, signature });
  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body,
  });
}
