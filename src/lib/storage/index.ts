import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  provider: 'local' | 'cloudinary' | 'supabase' | 'uploadthing';
  filename: string;
  size?: number;
}

export async function uploadImage(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const provider = (process.env.STORAGE_PROVIDER || (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') ? 'supabase' : 'local')).toLowerCase();

  // 1. Cloudinary Direct REST API (Zero external SDK required)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (provider === 'cloudinary' && cloudName && apiKey && apiSecret) {
    try {
      const crypto = await import('crypto');
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
          filename: json.original_filename || filename,
          size: json.bytes,
        };
      } else {
        const errText = await res.text();
        console.error('Cloudinary REST API error:', errText);
      }
    } catch (e) {
      console.error('Cloudinary upload error, falling back to local storage:', e);
    }
  }

  // 2. Supabase Storage REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (provider === 'supabase' && supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
    try {
      const cleanName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/productivity-images/${cleanName}`;

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
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/productivity-images/${cleanName}`;
        return {
          url: publicUrl,
          provider: 'supabase',
          filename: cleanName,
          size: fileBuffer.length,
        };
      }
    } catch (e) {
      console.error('Supabase storage error, falling back to local storage:', e);
    }
  }

  // 3. Fallback: Local Server Storage (/public/uploads)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const cleanFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadsDir, cleanFilename);
  fs.writeFileSync(filePath, fileBuffer);

  return {
    url: `/uploads/${cleanFilename}`,
    provider: 'local',
    filename: cleanFilename,
    size: fileBuffer.length,
  };
}
