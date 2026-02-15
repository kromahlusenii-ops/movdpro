import { NextRequest, NextResponse } from 'next/server'
import { clearProSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get('redirect') || '/login'

  await clearProSessionCookie()

  return NextResponse.redirect(new URL(redirect, request.url))
}
