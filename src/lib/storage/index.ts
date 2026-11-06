import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  provider: 'local' | 'cloudinary' | 'supabase';
  filename: string;
  size?: number;
}

export async function uploadImage(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER || (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') ? 'supabase' : 'local')).toLowerCase();

  // Extension sanitization
  const rawExt = path.extname(filename).toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const secureUniqueName = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

  // 1. Cloudinary Direct REST API
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (provider === 'cloudinary' && cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      const folder = 'productivity-system';
      const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

      const formData = new FormData();
      const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      formData.append('file', base64Data);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('folder', folder);
      formData.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return {
          url: json.secure_url,
          provider: 'cloudinary',
          filename: secureUniqueName,
          size: json.bytes,
        };
      }
    } catch (e) {
      console.error('Cloudinary upload error:', e);
    }
  }

  // 2. Supabase Storage REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (provider === 'supabase' && supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
    try {
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/productivity-images/${secureUniqueName}`;

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: fileBuffer as any,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/productivity-images/${secureUniqueName}`;
        return {
          url: publicUrl,
          provider: 'supabase',
          filename: secureUniqueName,
          size: fileBuffer.length,
        };
      }
    } catch (e) {
      console.error('Supabase storage error:', e);
    }
  }

  // 3. Fallback: Local Server Storage (/public/uploads)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, secureUniqueName);
  fs.writeFileSync(filePath, fileBuffer);

  return {
    url: `/uploads/${secureUniqueName}`,
    provider: 'local',
    filename: secureUniqueName,
    size: fileBuffer.length,
  };
}
