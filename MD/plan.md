# 코드없이 — 기술 개발 계획서

> Web + Android + iOS 멀티플랫폼, 확장 가능한 인프라 기반 개발 플랜
> 기준 문서: `without-code.md` (PRD) + `FeatureDetail-FlowChart.html` (전체 기능 명세 87개)
> 작성일: 2026-03-22

---

## 1. 플랫폼 전략 결정

### 왜 Next.js + Expo(React Native) 조합인가

| 기준 | Next.js + Expo | Flutter | React Native Web |
|------|---------------|---------|-----------------|
| SEO (피드·프로젝트 상세) | ✅ SSR/SSG 완전 지원 | ❌ 웹 SEO 미성숙 | ⚠️ SSR 구현 복잡 |
| OG 이미지 자동생성 | ✅ Next.js API Route | ❌ 서버 불가 | ⚠️ 별도 서버 필요 |
| iOS/Android 앱 품질 | ✅ 네이티브 동등 | ✅ 최고 | ✅ 동등 |
| 코드 공유율 | ~60% (hooks, types, supabase) | ~80% | ~90% |
| 생태계 성숙도 | ✅ 최고 | ⚠️ 웹 미성숙 | ⚠️ 일부 제한 |
| 개발 속도 | ✅ 빠름 | ⚠️ Dart 진입비용 | ⚠️ 디버깅 복잡 |

**결정**: **Next.js 14 (Web) + Expo SDK (iOS/Android)** — Turborepo 모노레포

- 피드, 프로젝트 상세는 SEO가 핵심이므로 Next.js SSR 필수
- 모바일은 Expo로 iOS App Store + Google Play Store 동시 배포
- TypeScript + Supabase 클라이언트를 공유 패키지로 묶어 로직 중복 제거

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                        Clients                          │
│                                                         │
│   Next.js Web          Expo iOS        Expo Android     │
│   (Vercel Edge)        (App Store)     (Play Store)     │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │ Supabase JS SDK (공유)
┌────────────────────────▼────────────────────────────────┐
│                  Supabase (BaaS Core)                   │
│                                                         │
│  Auth (카카오·구글·GitHub)  │  PostgreSQL (RLS 활성화)   │
│  Storage (thumbnails 버킷)  │  Realtime (알림·피드·DM)   │
│  Edge Functions (OG이미지·주간베스트·이메일·에스크로)     │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Supporting Infrastructure                  │
│                                                         │
│  Upstash Redis       Cloudflare CDN      Expo EAS       │
│  (피드캐시·Rate       (이미지·정적자산     (앱빌드·OTA     │
│   Limit·트렌딩집계)    글로벌 배포)        업데이트)       │
│                                                         │
│  Resend (이메일)     토스페이먼츠/카카오페이 (결제)        │
│  (주간다이제스트)     (프리미엄 멤버십 구독)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 데이터 흐름
1. **읽기 (피드)**: Redis 캐시 HIT → 즉시 반환 / MISS → Supabase 쿼리 → Redis 저장
2. **쓰기 (포스팅)**: Supabase DB → Realtime 브로드캐스트 → 구독 클라이언트 실시간 반영
3. **이미지**: 업로드 → Supabase Storage → Cloudflare CDN 전파 → 엣지에서 서빙
4. **알림**: DB Insert (notifications 테이블) + 설정 확인 → Supabase Realtime (인앱) + Expo Push (FCM/APNs) + Resend (이메일)
5. **결제**: 클라이언트 → 토스페이먼츠/카카오페이 → Webhook → Supabase Edge Function → 구독 활성화

---

## 3. 모노레포 구조

```
without-code/                         ← Turborepo 루트
├── apps/
│   ├── web/                          ← Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/               ← 로그인·온보딩
│   │   │   ├── (feed)/               ← 메인 피드 (/)
│   │   │   ├── projects/[id]/        ← 프로젝트 상세 (SSR + OG)
│   │   │   ├── posts/[id]/           ← 자유 게시글 상세
│   │   │   ├── profile/[username]/   ← 유저 프로필
│   │   │   ├── search/               ← 통합 검색·탐색
│   │   │   ├── tags/[slug]/          ← 해시태그 페이지
│   │   │   ├── tools/[slug]/         ← AI 툴 디렉토리
│   │   │   ├── weekly-best/          ← 주간 베스트
│   │   │   ├── prompts/              ← 프롬프트 라이브러리
│   │   │   ├── qna/                  ← Q&A 게시판
│   │   │   ├── notifications/        ← 알림 센터
│   │   │   ├── messages/             ← DM
│   │   │   ├── matching/             ← 매칭 시스템
│   │   │   ├── settings/             ← 설정
│   │   │   └── api/                  ← Edge API Routes
│   │   │       ├── og/               ← OG 이미지 생성
│   │   │       └── sitemap/          ← 동적 사이트맵
│   │   ├── components/               ← 웹 전용 컴포넌트
│   │   └── next.config.ts
│   │
│   └── mobile/                       ← Expo SDK (iOS + Android)
│       ├── app/                      ← Expo Router (파일 기반 라우팅)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx         ← 피드
│       │   │   ├── search.tsx        ← 검색·탐색
│       │   │   ├── upload.tsx        ← 업로드 (FAB)
│       │   │   ├── notifications.tsx ← 알림
│       │   │   └── profile.tsx       ← 내 프로필
│       │   ├── projects/[id].tsx
│       │   ├── profile/[username].tsx
│       │   ├── qna/index.tsx
│       │   ├── messages/index.tsx
│       │   ├── matching/index.tsx
│       │   ├── settings/index.tsx
│       │   └── onboarding/           ← 온보딩 플로우
│       ├── components/               ← 모바일 전용 컴포넌트
│       └── app.json
│
├── packages/
│   ├── supabase/                     ← DB 타입·클라이언트·RLS
│   │   ├── client.ts
│   │   ├── types.ts                  ← supabase gen 자동 생성
│   │   └── queries/
│   │       ├── projects.ts
│   │       ├── posts.ts
│   │       ├── users.ts
│   │       ├── feed.ts
│   │       ├── notifications.ts
│   │       ├── messages.ts
│   │       └── matching.ts
│   │
│   ├── ui/                           ← 디자인 토큰 + 공유 컴포넌트
│   │   ├── tokens.ts                 ← 컬러·폰트·간격 상수
│   │   └── theme.ts
│   │
│   └── hooks/                        ← 공유 React Query 훅
│       ├── useFeed.ts
│       ├── useProject.ts
│       ├── useAuth.ts
│       ├── useNotifications.ts
│       ├── useMessages.ts
│       └── useMatching.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_init_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_indexes.sql
│   │   ├── 004_triggers.sql          ← 카운터 자동 집계, 알림 자동 생성
│   │   └── 005_functions.sql         ← 피드 알고리즘, 주간베스트 집계
│   ├── functions/
│   │   ├── og-image/                 ← OG 이미지 생성 (Satori)
│   │   ├── weekly-best/              ← 주간 베스트 Cron
│   │   ├── send-notification/        ← 푸시 + 이메일 발송
│   │   ├── payment-webhook/          ← 결제 Webhook 처리
│   │   └── delete-account/           ← 계정 탈퇴 처리 (7일 유예)
│   └── seed.sql
│
├── turbo.json
├── package.json
└── tsconfig.base.json
```

---

## 4. 기술 스택 전체 목록

### Frontend
| 역할 | 기술 | 선택 이유 |
|------|------|---------|
| 웹 프레임워크 | **Next.js 14** (App Router) | SSR/SSG, SEO, OG 이미지 |
| 모바일 프레임워크 | **Expo SDK 52** | iOS/Android 동시, OTA 업데이트 |
| 모바일 라우팅 | **Expo Router** | 파일 기반, 딥링크 지원 |
| 언어 | **TypeScript** | 전 레포 타입 안전성 |
| 모노레포 | **Turborepo** + pnpm | 빌드 캐시, 패키지 공유 |
| 상태관리 | **TanStack Query** | 서버 상태·캐싱 |
| 폼 | **React Hook Form** + Zod | 검증 스키마 공유 |
| 웹 스타일링 | **Tailwind CSS** | 디자인 토큰 직접 매핑 |
| 모바일 스타일링 | **NativeWind** | 웹과 동일한 토큰 체계 |
| 마크다운 에디터 | **Tiptap** (웹) / **react-native-markdown-editor** (모바일) | 프로젝트 설명, Q&A 본문 |
| 이미지 처리 | **next/image** (웹) / **expo-image** (모바일) | 캐싱, WebP |
| 이미지 크롭 | **react-image-crop** / **expo-image-manipulator** | 썸네일 크롭 |
| 딥링크 | **expo-linking** | 공유 링크 → 앱 내 페이지 이동 |

### Backend / 인프라
| 역할 | 기술 | 선택 이유 |
|------|------|---------|
| 인증 | **Supabase Auth** | 카카오·구글·GitHub OAuth |
| 데이터베이스 | **Supabase PostgreSQL** | RLS, Realtime, 관계형 |
| 스토리지 | **Supabase Storage** | 이미지·동영상 버킷 |
| 실시간 | **Supabase Realtime** | 알림, DM, 피드 업데이트 |
| 서버 로직 | **Supabase Edge Functions** (Deno) | OG이미지·결제웹훅·알림발송 |
| 캐시 | **Upstash Redis** | 피드 캐시, Rate Limiting, 트렌딩 집계 |
| CDN | **Cloudflare** | 이미지·정적 자산 글로벌 배포 |
| 웹 배포 | **Vercel** | Next.js 최적화 |
| 앱 빌드·배포 | **Expo EAS** | App Store / Play Store CI/CD |
| 푸시 알림 | **Expo Push Notifications** | FCM(Android) + APNs(iOS) |
| 이메일 | **Resend** | 주간 다이제스트, 중요 알림 |
| 결제 | **토스페이먼츠** + **카카오페이** | 프리미엄 멤버십, 매칭 수수료 |
| GitHub API | **Octokit** | Repo 불러오기, 스타/포크 수 |

---

## 5. 전체 기능 목록 (87개) — 우선순위 분류

### 우선순위 기준
- **MUST**: 없으면 서비스 안 됨 — 모든 Phase에서 최우선
- **SHOULD**: 경쟁력에 직결 — MVP 완성도에 포함 권장
- **COULD**: 있으면 좋음 — Post-MVP 로드맵

### 01. 인증 & 계정 관리
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 소셜 로그인 (카카오·구글·GitHub) | MUST | 1 |
| 온보딩 (닉네임·관심툴·프로필사진·관심카테고리) | MUST | 1 |
| JWT 세션·Refresh Token·다중 디바이스 | MUST | 1 |
| 로그아웃 (현재기기/모든기기) | MUST | 1 |
| 이용약관·개인정보 동의 | MUST | 1 |
| 계정 탈퇴 (7일 유예 + 익명화) | MUST | 2 |
| 계정 비활성화 (30일 복구) | SHOULD | 3 |
| 본인인증 연동 (PASS) | COULD | Post |

### 02. 유저 프로필
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 프로필 페이지 (아바타·닉네임·자기소개·툴태그·외부링크·통계) | MUST | 1 |
| 프로필 편집 (아바타·닉네임30일제한·자기소개·툴태그·링크) | MUST | 1 |
| 팔로우 / 언팔로우 | MUST | 2 |
| 팔로워 / 팔로잉 목록 (검색 포함) | MUST | 2 |
| 내 활동 탭 (프로젝트·좋아요·북마크·댓글·Q&A·빌드일지) | MUST | 2 |
| 프로필 공유 (링크 복사·OG 이미지) | SHOULD | 3 |
| 프리미엄 프로필 뱃지·커스텀 테마 | COULD | Post |
| 활동 통계 대시보드 (프리미엄) | COULD | Post |

### 03. 프로젝트 쇼케이스
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 프로젝트 업로드 (제목60자·마크다운설명·데모URL·GitHub·썸네일·툴태그5개·카테고리) | MUST | 1 |
| 멀티미디어 업로드 (스크린샷10장·GIF·동영상30초) | MUST | 1 |
| 이미지 크롭·리사이즈 | MUST | 1 |
| 초안 자동저장 (30초 간격) | SHOULD | 2 |
| 프로젝트 수정 (수정됨 뱃지) | MUST | 1 |
| 프로젝트 소프트 삭제 (30일 후 하드삭제) | MUST | 1 |
| 프로젝트 상세 (갤러리·설명·링크·태그·통계·댓글) | MUST | 1 |
| 데모 링크 OG 미리보기 | SHOULD | 2 |
| 프로젝트 통계 (조회수·좋아요·북마크·유입경로) | SHOULD | 2 |
| 신고 기능 | MUST | 2 |
| 프로젝트 버전 관리 (v1.0, 변경 로그) | COULD | Post |
| 프로젝트 임베드 (iframe) | COULD | Post |

### 04. 메인 피드 & 게시글
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 통합 피드 (프로젝트 카드 + 자유 게시글 혼합) | MUST | 1 |
| 무한 스크롤 (커서 기반 페이지네이션) | MUST | 1 |
| 스켈레톤 로딩 UI | MUST | 1 |
| 비로그인 피드 (인기순 기본) | MUST | 1 |
| 정렬 옵션 (최신순·인기순·팔로잉) | MUST | 1 |
| 자유 게시글 작성 (텍스트·이미지4장·툴태그) | MUST | 1 |
| 게시글 수정·삭제 | MUST | 1 |
| 풀다운 새로고침 | MUST | 1 |
| 피드 필터 (전체·프로젝트·게시글·태그별) | SHOULD | 2 |
| 알고리즘 피드 (개인화 추천) | SHOULD | 3 |
| 피드 뮤트 (유저·태그 숨기기) | COULD | Post |

### 05. 검색 & 탐색
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 통합 검색 (프로젝트·유저·태그·Q&A 탭) | MUST | 2 |
| 툴 태그 필터 (다중 선택) | MUST | 2 |
| 해시태그 페이지 | MUST | 2 |
| 주간 베스트 프로젝트 페이지 | MUST | 3 |
| 검색 자동완성 | SHOULD | 2 |
| 최근 검색어 저장·삭제 | SHOULD | 2 |
| 카테고리 필터 (웹앱·모바일앱·자동화·디자인·게임) | SHOULD | 2 |
| 트렌딩 태그 (실시간) | SHOULD | 3 |
| AI 툴 디렉토리 (툴별 전용 페이지·리뷰) | SHOULD | Post |

### 06. 소셜 인터랙션
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 좋아요 (낙관적 업데이트·더블탭) | MUST | 2 |
| 댓글 (대댓글 1depth·수정·삭제·작성자 하이라이트) | MUST | 2 |
| 북마크 (폴더 분류 포함) | MUST | 2 |
| 공유 (링크복사·카카오톡·트위터·스레드) | MUST | 2 |
| 신고 (스팸·부적절·저작권·기타) | MUST | 2 |
| 차단 (상호 비노출·팔로우 해제·DM 차단) | MUST | 2 |
| 멘션 (@유저명 자동완성) | SHOULD | 3 |
| DM (1:1 텍스트·이미지·읽음 표시) | SHOULD | Post |

### 07. 알림 시스템
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 인앱 알림 목록 (읽음·안읽음·종류별 아이콘) | MUST | 2 |
| 알림 뱃지 (실시간) | MUST | 2 |
| 푸시 알림 (FCM·APNs·딥링크) | MUST | 2 |
| 알림 설정 (종류별·푸시·이메일·방해금지) | MUST | 2 |
| 이메일 알림 (주간 다이제스트) | SHOULD | 3 |
| 알림 일괄 읽음 | SHOULD | 2 |

### 08. Q&A 게시판
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 질문 작성 (마크다운·스크린샷·툴태그) | MUST | 3 |
| 답변 작성 (마크다운·코드블록) | MUST | 3 |
| 베스트 답변 채택 (해결됨 상태) | MUST | 3 |
| 답변 투표 (도움됐어요) | SHOULD | 3 |
| 관련 질문 추천 | COULD | Post |

### 09. 프롬프트 공유
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 프롬프트 선택적 공개 (전체·일부·비공개) | MUST | 3 |
| 프롬프트 스텝 분할 표시 | SHOULD | 3 |
| 프롬프트 원클릭 복사 (복사 횟수 카운트) | MUST | 3 |
| 프롬프트 평가 (도움됐어요 투표) | SHOULD | 3 |
| 프롬프트 검색 (전문 검색) | SHOULD | Post |
| 프롬프트 라이브러리 (커뮤니티 인기 모음) | COULD | Post |

### 10. 빌드 일지 (Build in Public)
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 빌드 일지 작성 (오늘한일·배운점·다음할일 템플릿) | SHOULD | Post |
| 프로젝트 연결·타임라인 표시 | SHOULD | Post |
| 진행률 % 표시 | COULD | Post |
| 빌드 일지 피드 | COULD | Post |
| 구독·알림 | COULD | Post |

### 11. GitHub 연동
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| GitHub 계정 연결·해제 | SHOULD | Post |
| Repo 불러오기 (자동 프로젝트 정보 입력) | SHOULD | Post |
| README 자동 렌더링 | COULD | Post |
| 스타·포크 수 표시 | COULD | Post |
| 커밋 활동 그래프 | COULD | Post |

### 12. 바이브코더 ↔ 개발자 매칭
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 매칭 프로필 등록 (역할·스킬셋·관심분야·가능시간) | COULD | Post |
| 프로젝트 의뢰 작성 (예산·기간·필요기술) | COULD | Post |
| 매칭 추천 알고리즘 | COULD | Post |
| 의뢰 지원 (포트폴리오 첨부) | COULD | Post |
| 매칭 전용 채팅방 | COULD | Post |
| 상호 리뷰 & 평점 | COULD | Post |
| 에스크로 결제·수수료 정산 | COULD | Post |

### 13. 프리미엄 멤버십 & 결제
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 구독 관리 (플랜변경·결제수단·자동갱신취소·영수증) | MUST | Post |
| 환불 정책 (전자상거래법 준수) | MUST | Post |
| 토스페이먼츠·카카오페이 결제 연동 | SHOULD | Post |
| 멤버십 플랜 안내 (무료 vs 프리미엄 비교) | SHOULD | Post |
| 포트폴리오 강조 노출·검색 부스트 | SHOULD | Post |
| 고급 통계 (방문자 분석·유입 경로) | SHOULD | Post |
| 7일 무료 체험 | SHOULD | Post |
| 프로필 커스터마이징 (배경·테마) | COULD | Post |

### 14. SEO & 공유 최적화
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| OG 이미지 자동 생성 | MUST | 3 |
| SEO 메타 태그 (모든 페이지) | MUST | 1 |
| XML 사이트맵 + Google Search Console | MUST | 3 |
| 딥링크 (공유 링크 → 앱 내 이동) | SHOULD | 3 |
| 카카오톡 공유 SDK (커스텀 템플릿) | SHOULD | 3 |
| JSON-LD 구조화 데이터 | SHOULD | 3 |
| RSS 피드 | COULD | Post |

### 15. 설정 & 개인정보
| 기능 | 우선순위 | Phase |
|------|---------|-------|
| 알림 설정 (종류별·푸시·이메일·방해금지) | MUST | 2 |
| 계정 설정 (소셜계정 관리·닉네임30일제한) | MUST | 2 |
| 개인정보 설정 (프로필공개범위·활동내역·검색노출) | MUST | 2 |
| 차단 유저 관리 | MUST | 2 |
| 앱 버전 정보·이용약관·개인정보처리방침 | MUST | 1 |
| 데이터 다운로드 (GDPR, JSON/ZIP) | SHOULD | 3 |
| 언어 설정 (한국어 기본) | COULD | Post |
| 앱 캐시 관리 (모바일) | COULD | Post |

---

## 6. 데이터베이스 설계

### 전체 테이블 목록

```
핵심 엔티티
├── profiles                  ← 유저 프로필
├── projects                  ← 프로젝트 쇼케이스
├── project_media             ← 스크린샷·동영상 (최대 10장)
├── project_drafts            ← 초안 자동저장
├── project_prompts           ← 프롬프트 (차별화 핵심)
├── posts                     ← 자유 게시글
├── tools                     ← AI 툴 목록
└── project_tools             ← 프로젝트-툴 다대다

소셜 그래프
├── follows                   ← 팔로우 관계
├── blocks                    ← 차단 관계
├── likes                     ← 좋아요 (projects·posts·comments)
├── comments                  ← 댓글·대댓글
└── bookmarks                 ← 북마크 (폴더 분류)

커뮤니티
├── qna_questions             ← Q&A 질문
├── qna_answers               ← Q&A 답변
├── qna_votes                 ← 답변 투표
├── build_logs                ← 빌드 일지
└── build_log_subscriptions   ← 빌드 일지 구독

알림
├── notifications             ← 인앱 알림
├── notification_settings     ← 유저별 알림 설정
└── push_tokens               ← Expo Push 토큰

DM (Post-MVP)
├── dm_rooms                  ← 1:1 DM 채팅방
└── dm_messages               ← DM 메시지

매칭 (Post-MVP)
├── matching_profiles         ← 매칭용 프로필
├── matching_requests         ← 프로젝트 의뢰
└── matching_applications     ← 지원서

결제
├── subscriptions             ← 프리미엄 구독 현황
└── payment_logs              ← 결제 이력

관리
├── reports                   ← 신고
├── weekly_bests              ← 주간 베스트
└── tool_reviews              ← AI 툴 리뷰
```

### 핵심 테이블 스키마

#### profiles
```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  bio             TEXT,
  avatar_url      TEXT,
  website_url     TEXT,
  github_handle   TEXT,
  interest_tools  TEXT[],                      -- 온보딩에서 선택한 관심 툴
  interest_cats   TEXT[],                      -- 관심 카테고리
  is_premium      BOOLEAN DEFAULT FALSE,
  premium_until   TIMESTAMPTZ,
  username_changed_at TIMESTAMPTZ,             -- 30일 변경 제한용
  follower_count  INT DEFAULT 0,               -- 비정규화 카운터
  following_count INT DEFAULT 0,
  project_count   INT DEFAULT 0,
  expo_push_token TEXT,                        -- 푸시 알림 토큰
  is_active       BOOLEAN DEFAULT TRUE,        -- 계정 비활성화
  delete_requested_at TIMESTAMPTZ,             -- 탈퇴 요청 시각 (7일 유예)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### projects
```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 60),
  description     TEXT NOT NULL,              -- 마크다운
  demo_url        TEXT NOT NULL CHECK (demo_url LIKE 'https://%'),
  github_url      TEXT CHECK (github_url IS NULL OR github_url LIKE 'https://%'),
  thumbnail_url   TEXT,
  category        TEXT,                       -- 웹앱·모바일앱·자동화·디자인·게임
  like_count      INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  bookmark_count  INT DEFAULT 0,
  view_count      INT DEFAULT 0,
  prompt_copy_count INT DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_deleted      BOOLEAN DEFAULT FALSE,      -- 소프트 삭제
  deleted_at      TIMESTAMPTZ,
  has_prompt      BOOLEAN DEFAULT FALSE,      -- 프롬프트 공개 여부
  version         TEXT DEFAULT 'v1.0',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### project_media (멀티미디어)
```sql
CREATE TABLE project_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('image', 'gif', 'video')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### project_drafts (초안 자동저장)
```sql
CREATE TABLE project_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,                 -- 폼 전체 상태 저장
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### project_prompts (핵심 차별화 — Phase 1부터 스키마 포함)
```sql
CREATE TABLE project_prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_order  INT NOT NULL,
  tool_name   TEXT,
  content     TEXT NOT NULL,
  result_desc TEXT,
  is_masked   BOOLEAN DEFAULT FALSE,          -- 일부 공개 마스킹
  is_public   BOOLEAN DEFAULT FALSE,
  copy_count  INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### posts (자유 게시글)
```sql
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 1000),
  image_urls    TEXT[],                       -- 최대 4장
  tool_tags     TEXT[],
  type          TEXT DEFAULT 'general' CHECK (type IN ('general', 'prompt_share')),
  like_count    INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### follows / blocks
```sql
CREATE TABLE follows (
  follower_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE TABLE blocks (
  blocker_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);
```

#### likes / comments / bookmarks
```sql
CREATE TABLE likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT likes_one_target CHECK (
    (CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  folder_name TEXT DEFAULT '기본',           -- 폴더 분류
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### notifications + 설정
```sql
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN (
    'like','comment','reply','mention','follow',
    'weekly_best','system','answer','answer_accepted'
  )),
  entity_type  TEXT CHECK (entity_type IN ('project','post','comment','qna','build_log')),
  entity_id    UUID,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_settings (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  like_inapp     BOOLEAN DEFAULT TRUE,
  like_push      BOOLEAN DEFAULT TRUE,
  comment_inapp  BOOLEAN DEFAULT TRUE,
  comment_push   BOOLEAN DEFAULT TRUE,
  follow_inapp   BOOLEAN DEFAULT TRUE,
  follow_push    BOOLEAN DEFAULT TRUE,
  mention_inapp  BOOLEAN DEFAULT TRUE,
  mention_push   BOOLEAN DEFAULT TRUE,
  system_inapp   BOOLEAN DEFAULT TRUE,
  system_email   BOOLEAN DEFAULT TRUE,
  weekly_email   BOOLEAN DEFAULT TRUE,
  dnd_start      TIME,                        -- 방해금지 시작 시각
  dnd_end        TIME                         -- 방해금지 종료 시각
);
```

#### Q&A
```sql
CREATE TABLE qna_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  tool_tags   TEXT[],
  image_urls  TEXT[],
  is_resolved BOOLEAN DEFAULT FALSE,
  answer_count INT DEFAULT 0,
  view_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qna_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_best     BOOLEAN DEFAULT FALSE,
  vote_score  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qna_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id   UUID NOT NULL REFERENCES qna_answers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful  BOOLEAN NOT NULL,
  UNIQUE (answer_id, user_id)
);
```

#### reports (신고)
```sql
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','post','comment','user')),
  entity_id   UUID NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN ('spam','inappropriate','copyright','other')),
  detail      TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### weekly_bests
```sql
CREATE TABLE weekly_bests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  rank       INT NOT NULL,
  score      INT NOT NULL,   -- 좋아요×3 + 댓글×5 + 북마크×4 + 조회×1
  UNIQUE (project_id, week_start)
);
```

#### subscriptions (프리미엄 결제)
```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  status          TEXT NOT NULL CHECK (status IN ('trial','active','cancelled','expired')),
  provider        TEXT CHECK (provider IN ('toss','kakao')),
  provider_sub_id TEXT,                       -- 결제사 구독 ID
  started_at      TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sub_id      UUID REFERENCES subscriptions(id),
  amount      INT NOT NULL,
  currency    TEXT DEFAULT 'KRW',
  status      TEXT NOT NULL CHECK (status IN ('success','failed','refunded')),
  provider    TEXT,
  provider_tx_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 핵심 인덱스
```sql
-- 피드
CREATE INDEX idx_projects_created_at    ON projects(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_projects_popularity    ON projects(like_count DESC, view_count DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_posts_created_at       ON posts(created_at DESC) WHERE is_deleted = FALSE;

-- 툴 태그 필터
CREATE INDEX idx_project_tools_tool     ON project_tools(tool_id);
CREATE INDEX idx_project_tools_proj     ON project_tools(project_id);

-- 알림
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- 팔로우 피드
CREATE INDEX idx_follows_follower       ON follows(follower_id);
CREATE INDEX idx_follows_following      ON follows(following_id);

-- 차단 (피드에서 차단 유저 제외)
CREATE INDEX idx_blocks_blocker         ON blocks(blocker_id);

-- 댓글
CREATE INDEX idx_comments_project       ON comments(project_id, created_at) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_post          ON comments(post_id, created_at) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_parent        ON comments(parent_id);

-- 검색 Full-text
CREATE INDEX idx_projects_fts ON projects USING GIN(
  to_tsvector('simple', title || ' ' || description)
) WHERE is_deleted = FALSE;

CREATE INDEX idx_qna_fts ON qna_questions USING GIN(
  to_tsvector('simple', title || ' ' || content)
);

-- 주간 베스트
CREATE INDEX idx_weekly_bests_week      ON weekly_bests(week_start DESC, rank ASC);

-- 구독
CREATE INDEX idx_subscriptions_user     ON subscriptions(user_id, status, expires_at);

-- 신고
CREATE INDEX idx_reports_status         ON reports(status, created_at) WHERE status = 'pending';
```

### RLS 정책 핵심 원칙
```sql
-- 전체 공개 읽기 (차단 필터는 앱 레이어에서 처리)
-- 쓰기는 반드시 auth.uid() 검증
-- 신고·결제·탈퇴 처리는 Edge Function에서 Service Role Key 사용

-- 차단 유저 콘텐츠 숨김 패턴
CREATE POLICY "차단된 유저 콘텐츠 비노출" ON projects FOR SELECT
  USING (
    auth.uid() IS NULL OR
    author_id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
    )
  );
```

---

## 7. 확장성 전략

### 트래픽 단계별 대응

| 단계 | MAU | 대응 |
|------|-----|------|
| MVP | ~1만 | Supabase Pro ($25/월), 기본 설정 |
| 성장 | ~10만 | pgBouncer 활성화, Upstash Redis 도입, Cloudflare Images CDN |
| 스케일 | 10만+ | Supabase Enterprise + Read Replica, Meilisearch 검색 분리 |

### 피드 캐싱 전략 (Redis)
```
feed:latest:{cursor}          → 최신순 피드 (TTL: 1분)
feed:popular:{cursor}         → 인기순 피드 (TTL: 5분)
feed:tool:{slug}:{cursor}     → 툴별 피드 (TTL: 3분)
trending:tags                 → 트렌딩 태그 (TTL: 10분)
project:{id}:view_count       → 조회수 버퍼 (5분마다 DB flush)
user:{id}:rate:upload         → 업로드 Rate Limiting
search:autocomplete:{query}   → 자동완성 캐시 (TTL: 5분)
```

---

## 8. 인증 시스템

### 소셜 로그인 + 온보딩 플로우
```
OAuth 완료 → 기존 회원? → JWT 발급 → 메인 피드
           → 신규 회원? → 이용약관 동의 → 온보딩 시작
                          ├── 닉네임 설정
                          ├── 프로필 사진 (선택)
                          ├── 관심 AI 툴 선택 (3개 이상)
                          └── 관심 카테고리 선택 → JWT 발급 → 메인 피드
```

### 계정 탈퇴 플로우
```
탈퇴 요청 → OAuth 재인증 → 7일 유예 시작
  → 7일 내 로그인: 탈퇴 철회
  → 7일 후: Edge Function이 개인정보 익명화 + 콘텐츠 익명 전환 + 완전 삭제
```

### 모바일 인증
- `expo-auth-session` + `expo-web-browser` — OAuth 딥링크
- `expo-secure-store` — Refresh Token (Keychain/Keystore)

---

## 9. 알림 시스템

### 알림 발송 파이프라인
```
DB Trigger (INSERT on likes/comments/follows/...)
  → notifications 테이블 INSERT
  → notification_settings 조회
  → 인앱: Supabase Realtime → 클라이언트 실시간 뱃지 업데이트
  → 푸시: Edge Function → 방해금지 시간 확인 → Expo Push API → FCM/APNs
  → 이메일: Edge Function → Resend → 주간 다이제스트 큐 또는 즉시 발송
```

---

## 10. OG 이미지 자동 생성

```
GET /api/og?type=project&id={id}
  → DB에서 프로젝트 정보 조회
  → Satori로 JSX → SVG 렌더링
     ├── 썸네일 이미지
     ├── 프로젝트 제목 (Pretendard)
     ├── 작성자 아바타·닉네임
     ├── 사용 툴 태그 뱃지
     └── 코드없이 브랜드 로고 (#1C1C1A 배경, #E8483A 포인트)
  → Cloudflare Cache (TTL: 24h)
  → 1200×630 PNG 반환

Next.js generateMetadata:
  openGraph.images = ['/api/og?type=project&id={id}']
  twitter.card = 'summary_large_image'
```

---

## 11. Phase별 개발 계획

### Phase 0 — 인프라 셋업 (Day 1~3)
| 태스크 | 담당 |
|--------|------|
| Turborepo 모노레포 초기 설정 (pnpm workspaces) | 공통 |
| Supabase 프로젝트 생성 + 로컬 Docker 환경 | 공통 |
| DB 마이그레이션 001~005 전체 적용 | 공통 |
| RLS 정책 전체 적용 | 공통 |
| Vercel 프로젝트 연결 | Web |
| Expo EAS 프로젝트 초기화 | Mobile |
| 디자인 토큰 패키지 (컬러·폰트) | 공통 |
| Supabase Auth 소셜 OAuth 설정 (카카오·구글·GitHub) | 공통 |

---

### Phase 1 — 기반 기능 (Week 1~2)
**완료 기준**: 로그인 → 온보딩 → 프로젝트 업로드 → 피드 → 상세 조회

| 태스크 | 플랫폼 | 우선순위 |
|--------|--------|---------|
| 소셜 로그인 (카카오·구글·GitHub) | Web + Mobile | P0 |
| 온보딩 플로우 (닉네임·툴태그·카테고리) | Web + Mobile | P0 |
| 이용약관·개인정보 동의 | Web + Mobile | P0 |
| 프로젝트 업로드 (기본 폼 + 이미지 + https 검증) | Web + Mobile | P0 |
| 멀티미디어 업로드 (스크린샷 10장·GIF·동영상) | Web + Mobile | P0 |
| 이미지 크롭·리사이즈 | Web + Mobile | P0 |
| 메인 피드 (최신순·무한스크롤·스켈레톤 로딩) | Web + Mobile | P0 |
| 비로그인 피드 (인기순) | Web + Mobile | P0 |
| 프로젝트 상세 페이지 (SSR) | Web | P0 |
| 프로젝트 상세 페이지 (Mobile) | Mobile | P0 |
| 자유 게시글 작성·수정·삭제 | Web + Mobile | P0 |
| 프로젝트 수정·소프트 삭제 | Web + Mobile | P0 |
| 기본 SEO 메타 태그 | Web | P0 |
| 앱 버전 정보·이용약관·개인정보처리방침 | Web + Mobile | P0 |

---

### Phase 2 — 소셜 기능 (Week 3~4)

| 태스크 | 플랫폼 | 우선순위 |
|--------|--------|---------|
| 좋아요 (낙관적 업데이트·더블탭) | Web + Mobile | P0 |
| 댓글·대댓글 (멘션 알림 포함) | Web + Mobile | P0 |
| 북마크 (폴더 분류) | Web + Mobile | P0 |
| 공유 (링크복사·카카오톡·트위터·스레드) | Web + Mobile | P0 |
| 신고 (스팸·부적절·저작권) | Web + Mobile | P0 |
| 차단 (상호 비노출·팔로우 해제) | Web + Mobile | P0 |
| 유저 프로필 페이지 | Web + Mobile | P0 |
| 프로필 편집 (닉네임 30일 제한) | Web + Mobile | P0 |
| 팔로우·언팔로우 | Web + Mobile | P0 |
| 팔로워·팔로잉 목록 | Web + Mobile | P0 |
| 내 활동 탭 (프로젝트·좋아요·북마크·댓글) | Web + Mobile | P0 |
| 통합 검색 (프로젝트·유저·태그·Q&A) | Web + Mobile | P0 |
| 검색 자동완성·최근 검색어 | Web + Mobile | P1 |
| 카테고리·툴태그 필터 | Web + Mobile | P0 |
| 해시태그 페이지 | Web + Mobile | P0 |
| 인앱 알림 (목록·뱃지·실시간) | Web + Mobile | P0 |
| 푸시 알림 (FCM·APNs·딥링크) | Mobile | P0 |
| 알림 설정 (종류별·방해금지) | Web + Mobile | P0 |
| 알림 일괄 읽음 | Web + Mobile | P1 |
| 계정 설정 화면 | Web + Mobile | P0 |
| 개인정보 설정 (공개 범위·검색 노출) | Web + Mobile | P0 |
| 차단 유저 관리 화면 | Web + Mobile | P0 |
| 계정 탈퇴 (7일 유예·익명화) | Web + Mobile | P0 |
| 피드 필터 탭 (전체·프로젝트·게시글) | Web + Mobile | P1 |
| Upstash Redis 도입 (피드 캐싱) | 공통 | P1 |

---

### Phase 3 — 성장 기능 (Week 5~8)

| 태스크 | 플랫폼 | 우선순위 |
|--------|--------|---------|
| Q&A 게시판 (질문·답변·채택·투표) | Web + Mobile | P0 |
| 프롬프트 공개 기능 (전체·일부·비공개·마스킹) | Web + Mobile | P0 |
| 프롬프트 스텝 표시·복사·평가 | Web + Mobile | P0 |
| OG 이미지 자동 생성 (Satori) | Web | P0 |
| XML 사이트맵 + Google Search Console | Web | P0 |
| 딥링크 (공유 → 앱 내 이동) | Mobile | P0 |
| 카카오톡 공유 SDK | Web + Mobile | P1 |
| JSON-LD 구조화 데이터 | Web | P1 |
| 주간 베스트 Cron Job + 페이지 | 공통 | P0 |
| 트렌딩 태그 (Redis Sorted Set) | 공통 | P1 |
| 이메일 알림 (Resend·주간 다이제스트) | 공통 | P1 |
| 데이터 다운로드 (GDPR, JSON/ZIP) | Web + Mobile | P1 |
| 초안 자동저장 (30초 간격) | Web + Mobile | P1 |
| 데모 링크 OG 미리보기 | Web + Mobile | P1 |
| 알고리즘 피드 (개인화 추천) | 공통 | P1 |
| 프로젝트 통계·유입 경로 | Web + Mobile | P1 |
| Cloudflare Images CDN 연동 | 공통 | P1 |

---

### Post-MVP — 정식 출시 완성 기능

| 카테고리 | 기능 |
|---------|------|
| 소셜 | DM (1:1 채팅·이미지·읽음), 멘션 자동완성 |
| 커뮤니티 | 빌드 일지 연재·타임라인·구독, 프롬프트 라이브러리 |
| GitHub | 계정 연결, Repo 불러오기, README 렌더링 |
| 탐색 | AI 툴 디렉토리 (전용 페이지·리뷰), 피드 뮤트 |
| 수익화 | 프리미엄 멤버십 (토스페이먼츠·카카오페이·7일체험) |
| 매칭 | 바이브코더↔개발자 매칭, 에스크로 결제 |
| 계정 | 계정 비활성화, 본인인증, 언어 설정 |
| 기타 | RSS 피드, 프로젝트 임베드, 버전 관리 |

---

## 12. 배포 전략

### Web — Vercel
```
main 브랜치 push → Vercel 자동 배포
├── Production: withoutcodeo.kr
├── Preview: PR마다 미리보기 URL 자동 생성
└── Edge Middleware: 로그인 보호 라우트, 지역 감지
```

### Mobile — Expo EAS
```
코드 변경 → EAS Build (CI) → 바이너리 생성
  → iOS: TestFlight → App Store 심사
  → Android: Internal Track → Play Store 출시

긴급 패치 (JS 변경만): EAS Update (OTA) → 즉시 반영
```

### Supabase
```
로컬: supabase start (Docker)
스테이징: Supabase 별도 프로젝트
프로덕션: Supabase Pro → 10만 MAU 이후 Enterprise
마이그레이션: supabase db push (CI 자동 실행)
```

---

## 13. 환경 변수

```bash
# Web (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        ← 서버사이드 전용 (절대 클라이언트 노출 금지)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
KAKAO_PAY_CID=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Mobile (app.config.ts)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=
```

> `SUPABASE_SERVICE_ROLE_KEY`는 모바일 앱 포함 절대 금지 — RLS 우회 가능

---

## 14. 개발 환경 체크리스트

```
□ pnpm v9+ 설치
□ Node.js 20 LTS
□ Docker Desktop (Supabase 로컬)
□ Supabase CLI
□ Expo CLI + EAS CLI
□ iOS: Xcode 15+
□ Android: Android Studio
□ 카카오 개발자 앱 등록 (kakao.com/developers)
□ Supabase 프로젝트 생성 + OAuth 설정
□ Upstash Redis 계정
□ Resend 계정 (이메일)
□ 토스페이먼츠 개발자 계정
□ Vercel 프로젝트 연결
□ EAS 프로젝트 초기화
□ Cloudflare 계정 (CDN·Images)
```

---

## 15. 핵심 의사결정 요약

| 결정 | 선택 | 이유 |
|------|------|------|
| 플랫폼 | Next.js + Expo 모노레포 | SEO(SSR) + 네이티브 품질 모두 충족 |
| DB | Supabase PostgreSQL | PRD 명시, RLS, 빠른 개발 |
| 캐시 | Upstash Redis | 서버리스 친화, 피드·트렌딩 캐싱 |
| 이미지 CDN | Cloudflare | 글로벌 엣지, Storage 연동 |
| 앱 배포 | Expo EAS | iOS/Android 동시, OTA |
| 이메일 | Resend | 개발자 친화, 주간 다이제스트 |
| 결제 | 토스페이먼츠 + 카카오페이 | 한국 시장 표준 |
| 모노레포 | Turborepo | 빌드 캐시, 패키지 공유 |
| 알림 파이프라인 | DB Trigger → Edge Function | 설정·방해금지 처리 중앙화 |
| 프롬프트 스키마 | Phase 0 (DB 설계 시점)부터 포함 | 차별화 핵심, 나중 추가 시 마이그레이션 복잡 |
| 소프트 삭제 | 프로젝트·댓글·게시글 전체 | 30일 유예, 신고 처리 후 복구 가능성 |
| 차단 필터 | 앱 레이어 (RLS 아님) | RLS 복잡도 vs 쿼리 성능 균형 |

---

*기준 문서: `MD/without-code.md`, `MD/FeatureDetail-FlowChart.html`*
*작성: Claude Code — 2026-03-22*

---

## 16. WBS — 세부 작업 분해 (Work Breakdown Structure)

> 전체 6단계 · 준비 태스크 그룹 8개 · MVP 약 8주 · 3 플랫폼(Web/iOS/AOS) · 87 기능 · 180+ 세부 항목
>
> 플랫폼: `[WEB]` = Next.js / `[MOBILE]` = Expo (iOS+Android) / `[공통]` = 공유 패키지·인프라
> 우선순위: `P0` = MUST(블로킹) / `P1` = SHOULD(강력권장) / `P2` = COULD(있으면좋음)

---

### Phase 0 — 환경 준비 & 인프라 셋업 (Day 1~3)

#### 0-A. 개발 도구 설치
| 완료 | 작업 | 플랫폼 | 비고 |
|------|------|--------|------|
| [x] | pnpm v9+ 설치 | 공통 | v10.32.1 |
| [x] | Node.js 20 LTS 설치 | 공통 | v20.20.1 (nvm) |
| [x] | Docker Desktop 설치 | 공통 | v28.3.3 |
| [x] | Supabase CLI 설치 | 공통 | v2.75.0 |
| [x] | Expo CLI 설치 | MOBILE | v55 (npx expo) |
| [x] | EAS CLI 설치 | MOBILE | v18.4.0 |
| [x] | Xcode 15+ 설치 (iOS 시뮬레이터) | MOBILE | v26.2 (/Volumes/Mac SSD/Applications/Xcode.app) |
| [x] | Android Studio 설치 (Android 에뮬레이터) | MOBILE | 기존 설치 확인 |

#### 0-B. 외부 서비스 계정 등록
| 완료 | 서비스 | 목적 | 우선순위 |
|------|--------|------|---------|
| [x] | Supabase 프로젝트 생성 | DB · Auth · Storage · Realtime | P0 |
| [x] | Vercel 프로젝트 연결 | Next.js 웹 배포 | P0 |
| [x] | Expo EAS 프로젝트 초기화 | iOS / Android 빌드 & 배포 | P0 |
| [x] | 카카오 개발자 앱 등록 | 카카오 OAuth · 공유 SDK | P0 |
| [x] | 구글 Cloud Console OAuth 앱 등록 | 구글 소셜 로그인 | P0 |
| [x] | GitHub OAuth App 등록 | GitHub 소셜 로그인 | P0 |
| [x] | Upstash Redis 계정 생성 | 피드 캐시 · Rate Limit · 트렌딩 | P1 |
| [x] | Resend 계정 생성 | 이메일 알림 · 주간 다이제스트 | P1 |
| [-] | 토스페이먼츠 개발자 계정 생성 | 프리미엄 결제 (Post-MVP 시점에 진행) | 제외 |
| [x] | Cloudflare 계정 생성 (CDN · Images) | 이미지 글로벌 배포 | P1 |
| [-] | Google Search Console 등록 | SEO · 사이트맵 제출 (배포 후 진행) | 보류 |
| [-] | Apple Developer Program 등록 | App Store 배포 (배포 직전 진행) | 보류 |
| [-] | Google Play Console 등록 | Play Store 배포 (배포 직전 진행) | 보류 |

#### 0-C. Turborepo 모노레포 초기화
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | Turborepo + pnpm workspaces 루트 설정 (turbo.json, pnpm-workspace.yaml) | 공통 | P0 |
| [x] | apps/web — Next.js 14 App Router 초기화 | WEB | P0 |
| [x] | apps/mobile — Expo SDK 55 초기화 (Expo Router) | MOBILE | P0 |
| [x] | packages/supabase — client.ts · types.ts · queries/ 패키지 설정 | 공통 | P0 |
| [x] | packages/ui — 디자인 토큰 (tokens.ts, theme.ts) | 공통 | P0 |
| [x] | packages/hooks — 공유 React Query 훅 뼈대 설정 | 공통 | P0 |
| [x] | tsconfig.base.json 공통 TypeScript 설정 | 공통 | P0 |
| [x] | ESLint · Prettier 공통 설정 | 공통 | P0 |

#### 0-D. Supabase DB 셋업 (마이그레이션 001~005 + RLS)
| 완료 | 작업 | 내용 | 우선순위 |
|------|------|------|---------|
| [x] | supabase start (로컬 Docker) | 개발 환경 로컬 DB 실행 | P0 |
| [x] | 001_init_schema.sql | 전체 테이블 생성 (profiles, projects, project_media, posts, follows, blocks, likes, comments, bookmarks, notifications, notification_settings, push_tokens, qna_questions, qna_answers, qna_votes, weekly_bests, reports, subscriptions, payment_logs, tools, project_tools, project_prompts, project_drafts, build_logs) | P0 |
| [x] | 002_rls_policies.sql | RLS 전체 정책 (읽기 공개 / 쓰기 auth.uid() 검증 / 차단 필터) | P0 |
| [x] | 003_indexes.sql | 피드·알림·팔로우·검색 Full-text·주간베스트 인덱스 전체 | P0 |
| [x] | 004_triggers.sql | 좋아요/댓글/팔로우 카운터 자동 집계 트리거 + 알림 자동 INSERT 트리거 | P0 |
| [x] | 005_functions.sql | 피드 알고리즘 함수, 주간베스트 집계 함수 | P0 |
| [x] | seed.sql | 기본 AI 툴 태그 데이터 (Cursor, Claude, Lovable, Bolt, Replit, v0 등) | P0 |
| [x] | supabase gen types typescript 자동 생성 → packages/supabase/types.ts | 타입 자동 동기화 | P0 |

#### 0-E. OAuth & 인증 설정
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | Supabase Auth — 카카오 OAuth Provider 설정 | 공통 | P0 | 대시보드 수동 설정 필요 (config.toml 미지원) — 주석으로 안내 추가 |
| [x] | Supabase Auth — 구글 OAuth Provider 설정 | 공통 | P0 | supabase/config.toml [auth.external.google] 추가, env var 기반 |
| [x] | Supabase Auth — GitHub OAuth Provider 설정 | 공통 | P0 | supabase/config.toml [auth.external.github] 추가, env var 기반 |
| [x] | Supabase Storage — thumbnails 버킷 생성 (5MB 제한, 공개) | 공통 | P0 | supabase/migrations/006_storage_thumbnails.sql |
| [x] | expo-auth-session + expo-web-browser 딥링크 OAuth 설정 | MOBILE | P0 | apps/mobile/app/_layout.tsx, 딥링크 redirect URL config.toml에 등록 |
| [x] | expo-secure-store Refresh Token 저장 설정 (Keychain/Keystore) | MOBILE | P0 | createMobileClient(secureStorage) 패턴, packages/supabase/client.ts |
| [x] | Next.js middleware — 보호 라우트 설정 (로그인 필요 경로) | WEB | P0 | apps/web/middleware.ts, @supabase/ssr 기반 |

#### 0-F. 디자인 시스템 셋업
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | 컬러 토큰 정의 (Ink #1C1C1A / Red #E8483A / White #F7F7F5 / Charcoal / Stone / Cloud / Light BG) | 공통 | P0 | packages/ui/tokens.ts |
| [x] | Tailwind CSS 설치 + tailwind.config.ts 토큰 매핑 (Web) | WEB | P0 | apps/web/tailwind.config.ts, packages/ui/tokens import |
| [x] | NativeWind 설치 + 동일 토큰 체계 설정 (Mobile) | MOBILE | P0 | nativewind@4, babel.config.js, metro.config.js, tailwind.config.ts, global.css |
| [x] | Pretendard 웹폰트 설정 (Web) + expo-font 설정 (Mobile) | 공통 | P0 | Web: CDN @import in globals.css / Mobile: expo-font useFonts in _layout.tsx (폰트 파일 assets/fonts/ 에 별도 배치 필요) |
| [x] | 공통 UI 컴포넌트 뼈대 (Button, Input, Card, Badge, Toast, Skeleton) | 공통 | P0 | packages/ui/components/types.ts, apps/web/components/ui/, apps/mobile/components/ui/ |

#### 0-G. CI/CD 파이프라인 설정
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | Vercel — main 브랜치 자동 배포 연결 | WEB | P0 | vercel.json 생성 (Vercel 대시보드에서 Git 연결 필요) |
| [x] | Vercel — PR Preview URL 자동 생성 설정 | WEB | P1 | Vercel Git 연결 시 자동 활성화 |
| [x] | EAS Build — eas.json 프로파일 설정 (development / preview / production) | MOBILE | P0 | apps/mobile/eas.json 생성 |
| [x] | GitHub Actions — supabase db push 마이그레이션 자동 적용 | 공통 | P1 | .github/workflows/supabase-migrate.yml 생성 |
| [x] | 환경 변수 전체 등록 (Vercel Env, EAS Secrets, 로컬 .env.local) | 공통 | P0 | .env.local.example 템플릿 생성 — 실제 값 등록은 아래 수동 작업 가이드 참고 |

> ⚠️ **SUPABASE_SERVICE_ROLE_KEY**는 서버사이드 전용 — 절대 모바일 앱·클라이언트 번들에 포함 금지 (RLS 전체 우회 가능)

#### 0-H. API 명세 작성
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | Edge Function 목록 정의 — send-notification / payment-confirm / payment-cancel / github-import / weekly-best-cron | 공통 | P0 |
| [x] | Edge Function별 Request/Response 스키마 문서화 (JSON 예시 포함) | 공통 | P0 |
| [x] | Next.js API Routes 명세 — `/api/og` (OG 이미지), `/api/webhook/toss`, `/api/webhook/kakao` | WEB | P0 |
| [x] | packages/supabase/queries/ 파일 구조 설계 — auth.ts / projects.ts / feed.ts / social.ts / search.ts / notifications.ts / premium.ts | 공통 | P0 |
| [x] | 외부 연동 API 인터페이스 정리 — 토스페이먼츠 결제 흐름, 카카오페이 흐름, Resend 이메일 템플릿, FCM/APNs 페이로드 구조 | 공통 | P1 |
| [x] | Supabase Realtime 채널 목록 정의 — notifications:{userId}, feed:public, dm:{roomId} | 공통 | P1 |
| [x] | 공통 에러 코드 · 응답 형식 표준화 (성공/실패 페이로드 구조 통일) | 공통 | P1 |
| [x] | Cursor 기반 페이지네이션 인터페이스 표준 정의 (limit, cursor, hasMore) | 공통 | P1 |

> 📝 **API 명세는 개발 전 완료** — 프론트(Web/Mobile)·백엔드(Edge Functions) 간 계약 역할. 명세 없이 구현 시작 시 Web/Mobile 간 인터페이스 불일치 발생 가능

---

### Phase 1 — 기반 기능 (Week 1~2)

> 완료 기준: 로그인 → 온보딩 → 프로젝트 업로드 → 피드 조회 → 상세 페이지 진입까지 전체 플로우 작동

#### 1-A. 인증 & 온보딩
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [x] | 로그인 화면 UI (카카오 / 구글 / GitHub 버튼) | WEB·MOBILE | P0 |
| [x] | 소셜 OAuth 로그인 연동 (Supabase Auth) | 공통 | P0 |
| [x] | useAuth 훅 (세션 상태, 로그인/로그아웃) | 공통 | P0 |
| [x] | 이용약관 · 개인정보 동의 화면 (마케팅 선택 동의 포함) | WEB·MOBILE | P0 |
| [x] | 온보딩 Step 1 — 닉네임 설정 (자동 제안 + 수정, 유일성 검사) | WEB·MOBILE | P0 |
| [x] | 온보딩 Step 2 — 프로필 사진 업로드 (선택, Supabase Storage) | WEB·MOBILE | P0 |
| [x] | 온보딩 Step 3 — 관심 AI 툴 선택 (3개 이상 필수) | WEB·MOBILE | P0 |
| [x] | 온보딩 Step 4 — 관심 카테고리 선택 | WEB·MOBILE | P0 |
| [ ] | 서비스 소개 슬라이드 3장 (최초 1회) | WEB·MOBILE | P1 |
| [ ] | 비로그인 접근 시 로그인 유도 바텀시트 (쓰기 차단) | WEB·MOBILE | P1 |
| [x] | 로그아웃 (현재 기기 / 모든 기기) | WEB·MOBILE | P0 |

#### 1-B. 프로젝트 쇼케이스 업로드
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 업로드 폼 UI (제목 60자 / 설명 / 데모 URL / GitHub URL / 카테고리) | WEB·MOBILE | P0 |
| [ ] | 마크다운 에디터 — Tiptap (Web) / react-native-markdown-editor (Mobile) | WEB·MOBILE | P0 |
| [ ] | 썸네일 이미지 업로드 (Supabase Storage thumbnails 버킷, 5MB) | WEB·MOBILE | P0 |
| [ ] | 이미지 크롭 · 리사이즈 — react-image-crop (Web) / expo-image-manipulator (Mobile) | WEB·MOBILE | P0 |
| [ ] | 추가 스크린샷 최대 10장 업로드 (project_media INSERT) | WEB·MOBILE | P0 |
| [ ] | GIF / 동영상 업로드 (30초 이하 검증) | WEB·MOBILE | P0 |
| [ ] | 업로드 % 프로그레스바 | WEB·MOBILE | P0 |
| [ ] | Zod 유효성 검사 스키마 (https:// 검증, 60자 제한 등) | 공통 | P0 |
| [ ] | 툴 태그 다중 선택 UI (최대 5개) | WEB·MOBILE | P0 |
| [ ] | 카테고리 선택 UI (웹앱 / 모바일앱 / 자동화 / 디자인 / 게임 등) | WEB·MOBILE | P0 |
| [ ] | Supabase DB INSERT — projects + project_media + project_tools | 공통 | P0 |
| [ ] | 프로젝트 수정 (모든 필드, "수정됨" 뱃지 표시) | WEB·MOBILE | P0 |
| [ ] | 프로젝트 소프트 삭제 (확인 다이얼로그, is_deleted = true) | WEB·MOBILE | P0 |

#### 1-C. 메인 피드
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 피드 페이지 레이아웃 (정렬 탭 + 카드 그리드) | WEB·MOBILE | P0 |
| [ ] | useFeed 훅 — cursor-based pagination (20개씩) | 공통 | P0 |
| [ ] | 프로젝트 쇼케이스 카드 컴포넌트 (썸네일 + 제목 + 툴태그 + 좋아요수) | WEB·MOBILE | P0 |
| [ ] | 자유 게시글 카드 컴포넌트 (텍스트 프리뷰 + 이미지 + 댓글수) | WEB·MOBILE | P0 |
| [ ] | 스켈레톤 로딩 UI | WEB·MOBILE | P0 |
| [ ] | 무한 스크롤 (Web: IntersectionObserver / Mobile: FlatList onEndReached) | WEB·MOBILE | P0 |
| [ ] | 정렬 탭 (최신순 / 인기순) | WEB·MOBILE | P0 |
| [ ] | 비로그인 피드 — 인기순 기본 제공 | WEB·MOBILE | P0 |
| [ ] | 풀다운 새로고침 (Mobile RefreshControl) | MOBILE | P0 |

#### 1-D. 자유 게시글
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 게시글 유형 선택 모달 (쇼케이스 / 자유 게시글) | WEB·MOBILE | P0 |
| [ ] | 자유 게시글 작성 폼 (텍스트 최대 1,000자) | WEB·MOBILE | P0 |
| [ ] | 게시글 수정 / 소프트 삭제 (작성자 본인만) | WEB·MOBILE | P0 |
| [ ] | Supabase DB INSERT/UPDATE — posts 테이블 | 공통 | P0 |

#### 1-E. 프로젝트 상세 페이지
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 상세 페이지 SSR 구현 — /projects/[id] (generateMetadata 포함) | WEB | P0 |
| [ ] | 상세 화면 — Mobile | MOBILE | P0 |
| [ ] | 이미지 갤러리 슬라이더 (썸네일 + 스크린샷) | WEB·MOBILE | P0 |
| [ ] | 데모 링크 버튼 (새 탭 / 인앱 브라우저) | WEB·MOBILE | P0 |
| [ ] | GitHub 링크 버튼 | WEB·MOBILE | P0 |
| [ ] | 조회수 카운트 +1 (비로그인 포함, view_count UPDATE) | 공통 | P0 |
| [ ] | useProject 훅 | 공통 | P0 |

#### 1-F. 기본 설정 & SEO 뼈대
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 기본 SEO 메타 태그 (title · description · og · twitter:card) — 전체 페이지 | WEB | P0 |
| [ ] | 앱 버전 정보 · 이용약관 · 개인정보처리방침 화면 | WEB·MOBILE | P0 |
| [ ] | 하단 탭 네비게이션 (피드 · 검색 · 업로드 · 알림 · 프로필) | MOBILE | P0 |
| [ ] | 사이드바 / 헤더 네비게이션 (Web) | WEB | P0 |

---

### Phase 2 — 소셜 기능 (Week 3~4)

#### 2-A. 소셜 인터랙션 (좋아요 · 댓글 · 북마크 · 공유)
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 좋아요 버튼 (낙관적 업데이트, likes INSERT/DELETE) | WEB·MOBILE | P0 |
| [ ] | 더블탭 좋아요 제스처 (Mobile) | MOBILE | P0 |
| [ ] | 댓글 입력창 · 목록 표시 (시간순, 작성자 하이라이트) | WEB·MOBILE | P0 |
| [ ] | 대댓글 (1depth, parent_id 참조) | WEB·MOBILE | P0 |
| [ ] | 댓글 수정 · 소프트 삭제 (본인 · 게시글 작성자) | WEB·MOBILE | P0 |
| [ ] | 댓글 좋아요 | WEB·MOBILE | P0 |
| [ ] | 북마크 토글 (폴더명 지정, bookmarks INSERT) | WEB·MOBILE | P0 |
| [ ] | 공유 모달 (링크 복사 · 카카오톡 · X · 스레드) | WEB·MOBILE | P0 |
| [ ] | 신고 모달 (스팸 · 부적절 · 저작권 · 기타, reports INSERT) | WEB·MOBILE | P0 |
| [ ] | 차단 (확인 모달 → blocks INSERT → 상호 팔로우 해제) | WEB·MOBILE | P0 |

#### 2-B. 유저 프로필 & 팔로우
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 유저 프로필 페이지 (/profile/[username]) | WEB·MOBILE | P0 |
| [ ] | 프로필 편집 화면 (닉네임 30일 제한 · 자기소개 · 외부 링크) | WEB·MOBILE | P0 |
| [ ] | 프로필 이미지 변경 (Supabase Storage 업로드) | WEB·MOBILE | P0 |
| [ ] | 팔로우 / 언팔로우 버튼 (follows INSERT/DELETE) | WEB·MOBILE | P0 |
| [ ] | 팔로워 · 팔로잉 목록 모달 | WEB·MOBILE | P0 |
| [ ] | 내 활동 탭 (프로젝트 · 좋아요 · 북마크 · 댓글 · Q&A · 빌드 일지) | WEB·MOBILE | P0 |
| [ ] | useProfile 훅 | 공통 | P0 |

#### 2-C. 검색 & 탐색
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 검색 페이지 레이아웃 (/search) | WEB·MOBILE | P0 |
| [ ] | 통합 검색 (탭: 프로젝트 · 유저 · 태그 · Q&A) — PostgreSQL Full-text Search | WEB·MOBILE | P0 |
| [ ] | 검색 자동완성 (타이핑 시 인기 키워드 · 유저 · 태그 제안) | WEB·MOBILE | P1 |
| [ ] | 최근 검색어 저장 · 삭제 (로컬, 최대 10개) | WEB·MOBILE | P1 |
| [ ] | 툴 태그 필터 칩 (다중 선택) | WEB·MOBILE | P0 |
| [ ] | 카테고리 필터 | WEB·MOBILE | P0 |
| [ ] | 해시태그 페이지 (/tags/[slug]) — 태그별 콘텐츠 모아보기 | WEB·MOBILE | P0 |
| [ ] | 검색 결과 정렬 (최신순 / 인기순 / 관련도순) | WEB·MOBILE | P0 |
| [ ] | 피드 필터 탭 (전체 / 프로젝트만 / 게시글만) | WEB·MOBILE | P1 |

#### 2-D. 알림 시스템
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | DB Trigger — 좋아요 · 댓글 · 팔로우 → notifications 테이블 자동 INSERT | 공통 | P0 |
| [ ] | 알림 목록 페이지 (읽음 · 안읽음 · 종류별 아이콘) | WEB·MOBILE | P0 |
| [ ] | 알림 뱃지 실시간 업데이트 (Supabase Realtime 구독) | WEB·MOBILE | P0 |
| [ ] | Expo Push Token 등록 (push_tokens 테이블 저장) | MOBILE | P0 |
| [ ] | Edge Function: send-notification (방해금지 시간 확인 → FCM/APNs 발송) | 공통 | P0 |
| [ ] | 알림 클릭 → 해당 콘텐츠 딥링크 이동 | WEB·MOBILE | P0 |
| [ ] | 알림 설정 화면 (종류별 on/off · 방해금지 시간대) | WEB·MOBILE | P0 |
| [ ] | 알림 일괄 읽음 처리 | WEB·MOBILE | P1 |
| [ ] | useNotifications 훅 | 공통 | P0 |

#### 2-E. 계정 설정 & 개인정보
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 계정 설정 화면 (소셜 계정 연결 관리) | WEB·MOBILE | P0 |
| [ ] | 개인정보 설정 (프로필 공개 범위 · 활동 내역 · 검색 노출) | WEB·MOBILE | P0 |
| [ ] | 차단 유저 목록 화면 (차단 해제 포함) | WEB·MOBILE | P0 |
| [ ] | 계정 탈퇴 플로우 (OAuth 재인증 → 7일 유예 안내 → 비활성화) | WEB·MOBILE | P0 |
| [ ] | Edge Function: delete-account (7일 후 개인정보 익명화 + 완전 삭제) | 공통 | P0 |

#### 2-F. 인프라 확장 (Phase 2 시점)
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | Upstash Redis 도입 — 피드 캐시 키 설계 및 적용 (feed:latest, feed:popular) | 공통 | P1 |
| [ ] | Rate Limiting 적용 (업로드 · 댓글 · 좋아요 rate:upload 키) | 공통 | P1 |

---

### Phase 3 — 성장 기능 (Week 5~8)

#### 3-A. Q&A 게시판
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | Q&A 목록 페이지 (최신순 · 답변 많은 순 · 미답변 필터) | WEB·MOBILE | P0 |
| [ ] | 질문 작성 (마크다운 에디터 + 스크린샷 첨부 + 툴 태그) | WEB·MOBILE | P0 |
| [ ] | 유사 질문 자동 추천 (중복 방지) | WEB·MOBILE | P2 |
| [ ] | 답변 작성 (마크다운 + 코드 블록 하이라이팅) | WEB·MOBILE | P0 |
| [ ] | 베스트 답변 채택 → 질문 "해결됨" 상태 변경 (is_best, is_resolved) | WEB·MOBILE | P0 |
| [ ] | 답변 투표 (도움됐어요 / 아니에요, qna_votes) | WEB·MOBILE | P1 |
| [ ] | Q&A 알림 연동 (답변 등록 시 질문자 알림, 채택 시 답변자 알림) | 공통 | P0 |

#### 3-B. 프롬프트 공개 기능 (차별화 핵심)
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 업로드 폼에 프롬프트 섹션 추가 (공개 범위 선택: 전체 · 일부 · 비공개) | WEB·MOBILE | P0 |
| [ ] | 스텝 분할 UI (Step 1, 2, 3… 순서대로 입력) | WEB·MOBILE | P1 |
| [ ] | 일부 공개 마스킹 (is_masked, 특정 스텝 숨기기) | WEB·MOBILE | P1 |
| [ ] | 프로젝트 상세 — 프롬프트 섹션 (펼치기 · 접기) | WEB·MOBILE | P0 |
| [ ] | 원클릭 복사 버튼 + 복사 횟수 카운트 (copy_count UPDATE) | WEB·MOBILE | P0 |
| [ ] | 프롬프트 평가 (도움됐어요 투표, helpful_count) | WEB·MOBILE | P1 |

#### 3-C. SEO & 공유 최적화
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | OG 이미지 자동 생성 Edge Function (/api/og — Satori JSX → SVG → PNG 1200×630) | WEB | P0 |
| [ ] | OG 이미지 구성 (썸네일 + 프로젝트 제목 + 작성자 아바타 + 툴태그 + 코드없이 로고) | WEB | P0 |
| [ ] | generateMetadata 전체 페이지 적용 (openGraph.images, twitter.card) | WEB | P0 |
| [ ] | XML 사이트맵 자동 생성 (/api/sitemap) → Google Search Console 제출 | WEB | P0 |
| [ ] | JSON-LD 구조화 데이터 (Article · Person · SoftwareApplication) | WEB | P1 |
| [ ] | 카카오톡 공유 SDK 연동 (커스텀 템플릿: 썸네일 + 제목 + CTA 버튼) | WEB·MOBILE | P1 |
| [ ] | 딥링크 설정 — expo-linking (공유 링크 → 앱 내 해당 페이지 이동) | MOBILE | P0 |
| [ ] | 데모 링크 OG 미리보기 (OG 메타 파싱 → 링크 프리뷰 카드 표시) | WEB·MOBILE | P1 |

#### 3-D. 주간 베스트 & 트렌딩
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | Edge Function: weekly-best Cron Job (일요일 자정, 좋아요×3 + 댓글×5 + 북마크×4 + 조회×1 → Top 5) | 공통 | P0 |
| [ ] | 주간 베스트 페이지 (/weekly-best) | WEB·MOBILE | P0 |
| [ ] | 피드 상단 주간 베스트 배너 슬라이더 (월~일 자동 갱신) | WEB·MOBILE | P0 |
| [ ] | 베스트 선정 뱃지 (프로젝트 카드 · 상세 페이지 영구 표시) | WEB·MOBILE | P0 |
| [ ] | 주간 베스트 당선 알림 (선정 작성자에게 개별 알림) | 공통 | P0 |
| [ ] | 트렌딩 태그 — Redis Sorted Set 집계 (TTL: 10분, 검색 페이지 상단 표시) | 공통 | P1 |

#### 3-E. 고도화 & 인프라 최적화
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 이메일 알림 (Resend 연동 — 주간 다이제스트 큐, 중요 알림 즉시 발송) | 공통 | P1 |
| [ ] | GDPR 데이터 다운로드 (내 데이터 전체 JSON/ZIP) | WEB·MOBILE | P1 |
| [ ] | 초안 자동저장 (30초 간격, project_drafts UPSERT, 이어 쓰기) | WEB·MOBILE | P1 |
| [ ] | 알고리즘 피드 (관심 툴 태그 + 팔로잉 활동 + 인터랙션 이력 기반 개인화) | 공통 | P1 |
| [ ] | 프로젝트 통계 대시보드 (조회수 · 좋아요 · 유입 경로 분석) | WEB·MOBILE | P1 |
| [ ] | Cloudflare Images CDN 연동 (이미지 · 정적 자산 글로벌 배포) | 공통 | P1 |
| [ ] | 결제 Webhook Edge Function 뼈대 준비 (payment-webhook) | 공통 | P1 |
| [ ] | 멘션 @닉네임 자동완성 (댓글 입력 시 유저 제안, 알림 발송) | WEB·MOBILE | P1 |
| [ ] | 팔로잉 전용 피드 탭 | WEB·MOBILE | P1 |

---

### Post-MVP — 정식 출시 완성 기능 (Week 9~)

#### P-A. DM 다이렉트 메시지
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | DM 채팅방 목록 화면 (/messages) | WEB·MOBILE | P1 |
| [ ] | 1:1 텍스트 메시지 전송 (Supabase Realtime) | WEB·MOBILE | P1 |
| [ ] | 이미지 전송 · 읽음 표시 | WEB·MOBILE | P1 |
| [ ] | 차단된 유저 DM 차단 | 공통 | P1 |
| [ ] | useMessages 훅 (dm_rooms · dm_messages) | 공통 | P1 |

#### P-B. 빌드 일지 (Build in Public)
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 빌드 일지 작성 (프로젝트 연결, 오늘 한 일 · 배운 점 · 다음 할 일 템플릿) | WEB·MOBILE | P1 |
| [ ] | 타임라인 형식 열람 (프로젝트 상세 > 빌드 일지 탭) | WEB·MOBILE | P1 |
| [ ] | 진행률 % 수동 입력 표시 | WEB·MOBILE | P2 |
| [ ] | 빌드 일지 구독 → 새 일지 알림 | 공통 | P2 |

#### P-C. GitHub 연동
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | GitHub 계정 연결 · 해제 (설정 화면) | WEB·MOBILE | P1 |
| [ ] | Repo 목록 불러오기 (Octokit) → 프로젝트 정보 자동 채우기 | WEB·MOBILE | P1 |
| [ ] | README.md 자동 렌더링 (프로젝트 상세) | WEB·MOBILE | P2 |
| [ ] | 스타 · 포크 수 표시 (프로젝트 카드) | WEB·MOBILE | P2 |
| [ ] | 커밋 활동 그래프 (잔디 스타일) | WEB·MOBILE | P2 |

#### P-D. AI 툴 디렉토리
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | AI 툴 디렉토리 페이지 (/tools) — 전체 툴 목록 | WEB·MOBILE | P1 |
| [ ] | 툴 전용 페이지 (/tools/[slug]) — 툴 설명 + 관련 프로젝트 + 사용자 리뷰 | WEB·MOBILE | P1 |
| [ ] | 툴 리뷰 작성 · 평점 (tool_reviews 테이블) | WEB·MOBILE | P1 |

#### P-E. 프리미엄 멤버십 & 결제
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 프리미엄 안내 페이지 (무료 vs 프리미엄 기능 비교 표) | WEB·MOBILE | P1 |
| [ ] | 토스페이먼츠 결제 연동 (월간 / 연간 구독) | WEB·MOBILE | P1 |
| [ ] | 카카오페이 결제 연동 | WEB·MOBILE | P1 |
| [ ] | 7일 무료 체험 로직 (trial_ends_at, 1회 한정) | 공통 | P1 |
| [ ] | Edge Function: payment-webhook (결제사 → 구독 활성화) | 공통 | P1 |
| [ ] | 구독 관리 화면 (플랜 변경 · 결제 수단 · 자동갱신 취소 · 영수증 조회) | WEB·MOBILE | P0 |
| [ ] | 환불 처리 (전자상거래법 준수, 미사용 기간 비례 환불) | 공통 | P0 |
| [ ] | 프리미엄 효과 적용 (피드 상단 하이라이트 · 검색 부스트 · 프리미엄 뱃지) | 공통 | P1 |
| [ ] | 고급 통계 (방문자 분석 · 유입 경로 · 인터랙션 추이 그래프) | WEB·MOBILE | P1 |

#### P-F. 바이브코더 ↔ 개발자 매칭
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 매칭 프로필 등록 (역할 · 스킬셋 · 관심 분야 · 가능 시간대) | WEB·MOBILE | P2 |
| [ ] | 프로젝트 의뢰 작성 (설명 · 필요 기술 · 예산 · 기간) | WEB·MOBILE | P2 |
| [ ] | 매칭 추천 알고리즘 + 개발자 지원 (포트폴리오 첨부) | 공통 | P2 |
| [ ] | 매칭 전용 채팅방 (수락 시 자동 생성) | WEB·MOBILE | P2 |
| [ ] | 상호 리뷰 · 평점 + 에스크로 수수료 결제 | 공통 | P2 |
| [ ] | useMatching 훅 (matching_profiles · matching_requests) | 공통 | P2 |

#### P-G. 기타
| 완료 | 작업 | 플랫폼 | 우선순위 |
|------|------|--------|---------|
| [ ] | 프롬프트 라이브러리 페이지 (/prompts) — 커뮤니티 인기 프롬프트 모음 | WEB·MOBILE | P2 |
| [ ] | RSS 피드 (/rss.xml) | WEB | P2 |
| [ ] | 프로젝트 임베드 iframe 코드 제공 | WEB | P2 |
| [ ] | 계정 비활성화 (30일 내 복구 가능) | WEB·MOBILE | P2 |
| [ ] | 언어 설정 (영어 지원 시 언어 전환) | WEB·MOBILE | P2 |
| [ ] | 앱 캐시 관리 (모바일) | MOBILE | P2 |
| [ ] | 피드 뮤트 (특정 유저 · 태그 숨기기) | WEB·MOBILE | P2 |

---

### 배포 & 출시 체크리스트 (런칭 전)

#### Web — Vercel 배포
- [ ] 도메인 withoutcodeo.kr 연결 & SSL 인증서 확인
- [ ] Production 환경 변수 전체 등록 (NEXT_PUBLIC_*, SUPABASE_SERVICE_ROLE_KEY 등)
- [ ] Edge Middleware 보호 라우트 확인 (로그인 필요 경로)
- [ ] main 브랜치 자동 배포 확인
- [ ] Lighthouse 성능 · SEO · 접근성 점수 확인
- [ ] Google Search Console 사이트맵 제출 확인
- [ ] OG 이미지 SNS 미리보기 테스트 (카카오톡, X, 스레드)

#### Mobile — Expo EAS 배포
- [ ] EAS Build — iOS / Android Production 빌드 생성
- [ ] iOS: TestFlight 업로드 → App Store 심사 제출
- [ ] Android: Internal Track → Play Store 출시
- [ ] EAS Update (OTA) 설정 확인 (JS 변경 즉시 반영)
- [ ] Expo Push Notification 실기기 테스트 (FCM + APNs)
- [ ] 딥링크 실기기 테스트 (공유 링크 → 앱 내 이동)
- [ ] 앱 아이콘 · 스플래시 스크린 최종 확인

#### Supabase — 프로덕션 전환
- [ ] Supabase Free → Pro 플랜 업그레이드 ($25/월)
- [ ] 모든 마이그레이션 Production DB 적용 확인
- [ ] RLS 정책 전체 활성화 확인 (비인증 쓰기 차단)
- [ ] Edge Functions 배포 (og-image, weekly-best, send-notification, delete-account)
- [ ] weekly-best Cron Job 스케줄 확인 (매주 일요일 자정)
- [ ] Storage 버킷 정책 확인 (thumbnails 공개, 5MB 제한)
- [ ] 데이터베이스 백업 설정 확인

#### 보안 & 법무 체크
- [ ] 이용약관 · 개인정보처리방침 법무 검토 완료
- [ ] GDPR 데이터 삭제 · 다운로드 기능 동작 확인
- [ ] 결제 전자상거래법 준수 (청약철회 · 환불 정책) 확인
- [ ] SERVICE_ROLE_KEY 클라이언트 미노출 확인
- [ ] 신고 · 차단 플로우 실제 동작 확인

---

*WBS 기준 문서: Doc/WBS.html · 작성: 2026-03-23*
