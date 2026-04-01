import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  // إذا كان المستخدم يحاول دخول اللوحة وهو غير مسجل دخول
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // إذا كان المستخدم مسجل دخول ويحاول فتح صفحة تسجيل الدخول مرة أخرى
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// تحديد المسارات التي يجب حمايتها
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.png (logo)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};
