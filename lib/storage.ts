import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Minter di signed URL R2 — sola LETTURA. Server-only: usa credenziali R2 (segrete),
// mai nel bundle client. Primo passo del merge BFF↔web (decisione M3, scelta Databros).
// L'upload/re-encode/strip-EXIF vive nel BFF (services/backend/lib/storage.ts): qui NON serve.

let _s3: S3Client | null = null;

function s3(): S3Client | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    endpoint.includes("PLACEHOLDER") ||
    accessKeyId.includes("PLACEHOLDER")
  ) {
    return null;
  }
  if (!_s3) {
    _s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _s3;
}

export function isR2Configured(): boolean {
  return s3() !== null && Boolean(process.env.R2_BUCKET);
}

// SEC-6: signed URL a TTL breve, content-type fisso, origine R2 (senza cookie app).
// Ritorna null se R2 non è configurato o la firma fallisce (la UI mostra il placeholder).
export async function signedPhotoUrl(key: string, ttlSeconds = 120): Promise<string | null> {
  const client = s3();
  const bucket = process.env.R2_BUCKET;
  if (!client || !bucket) return null;
  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: "image/webp" }),
      { expiresIn: ttlSeconds }
    );
  } catch {
    return null;
  }
}
