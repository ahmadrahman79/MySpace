import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
      }

      // 1. Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
          { status: 400 }
        );
      }

      // 2. Validate MIME type
      const mimeType = file.type || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { success: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadImage(buffer, file.name, mimeType);

      return NextResponse.json({
        success: true,
        message: 'File berhasil diunggah dengan aman',
        data: result,
      });
    }

    // JSON payload with base64 data
    const body = await req.json();
    if (!body.base64 || !body.filename) {
      return NextResponse.json(
        { success: false, error: 'Parameter base64 dan filename wajib diisi' },
        { status: 400 }
      );
    }

    const matches = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let rawBase64 = body.base64;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran gambar terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      );
    }

    const result = await uploadImage(buffer, body.filename, mimeType);

    return NextResponse.json({
      success: true,
      message: 'File berhasil diunggah dengan aman',
      data: result,
    });
  } catch (e: any) {
    console.error('Upload API error:', e);
    return NextResponse.json({ success: false, error: 'Gagal memproses file upload' }, { status: 500 });
  }
}
