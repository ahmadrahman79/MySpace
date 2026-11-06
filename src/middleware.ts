import { createClient as supabaseClient } from '@/utils/supabase/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Initialize Supabase and refresh session cookies
  const response = supabaseClient(request);
  // Continue the request pipeline
  return response;
}

export const config = {
  // Apply middleware to all routes except internal Next.js assets
  matcher: ['/((?!_next).*)', '/api/:path*'],
};
