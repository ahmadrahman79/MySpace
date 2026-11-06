import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadImage(buffer, file.name, file.type || 'image/jpeg');

      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully to object storage',
        data: result,
      });
    }

    // JSON payload with base64 data
    const body = await req.json();
    if (!body.base64 || !body.filename) {
      return NextResponse.json({ success: false, error: 'base64 and filename are required' }, { status: 400 });
    }

    const matches = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let rawBase64 = body.base64;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    const result = await uploadImage(buffer, body.filename, mimeType);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully to object storage',
      data: result,
    });
  } catch (e: any) {
    console.error('Upload API error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

