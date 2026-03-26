import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/auth/callback',
  '/projects',   // 프로젝트 목록/상세 — 비로그인 열람 허용
  '/posts',
  '/profile',
  '/search',
  '/tags',
  '/tools',
  '/weekly-best',
  '/qna',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 세션 갱신 (Refresh Token 자동 처리)
  const { data: { user } } = await supabase.auth.getUser()

  // 보호된 경로에 비로그인 접근 시 → 로그인으로 리다이렉트
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 이미 로그인한 상태에서 /login 접근 시 → 메인으로
  if (user && request.nextUrl.pathname === '/login') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  return response
}

export const config = {
  matcher: [
    // 정적 파일, _next, api/og(공개), sitemap 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|api/og|api/sitemap|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
