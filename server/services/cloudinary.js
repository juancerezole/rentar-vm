import { createHash } from 'node:crypto';
import { config } from '../config.js';

// Elimina una imagen de Cloudinary. Lanza si Cloudinary devuelve error —
// los callers deciden cómo manejarlo (típicamente loggear y seguir).
export async function deleteCloudinaryImage(publicId) {
  if (!config.cloudinary.enabled) return { skipped: true };

  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    api_key:   apiKey,
    timestamp: String(timestamp),
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`cloudinary destroy ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json().catch(() => ({}));
  // Cloudinary devuelve { result: 'ok' | 'not found' } en éxitos. Cualquier
  // otra cosa ('error', etc.) la tratamos como fallo.
  if (data.result && data.result !== 'ok' && data.result !== 'not found') {
    throw new Error(`cloudinary destroy result=${data.result}`);
  }
  return data;
}
