import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let resources = await db.getResources();

    if (category && category !== 'All') {
      resources = resources.filter((r) => r.category === category);
    }
    if (type && type !== 'All') {
      resources = resources.filter((r) => r.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, count: resources.length, data: resources });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.url) {
      return NextResponse.json({ success: false, error: 'Title and URL are required' }, { status: 400 });
    }

    const resource = await db.createResource({
      title: body.title,
      url: body.url,
      category: body.category || 'Umum',
      description: body.description || '',
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []),
      type: body.type || (body.url.match(/\.(png|jpe?g|gif|webp|svg)/i) ? 'image' : 'link'),
    });

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

