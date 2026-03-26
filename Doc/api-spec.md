# 코드없이 — API 명세서

> 작성일: 2026-03-26
> 이 문서는 Web(Next.js) · Mobile(Expo) · 백엔드(Supabase Edge Functions) 간 계약 역할을 합니다.
> 명세 없이 구현을 시작하면 플랫폼 간 인터페이스 불일치가 발생합니다.

---

## 목차

1. [공통 응답 형식](#1-공통-응답-형식)
2. [공통 에러 코드](#2-공통-에러-코드)
3. [페이지네이션 표준](#3-페이지네이션-표준)
4. [Supabase Queries 구조](#4-supabase-queries-구조)
5. [Edge Functions](#5-edge-functions)
6. [Next.js API Routes](#6-nextjs-api-routes)
7. [Supabase Realtime 채널](#7-supabase-realtime-채널)
8. [외부 연동 인터페이스](#8-외부-연동-인터페이스)

---

## 1. 공통 응답 형식

모든 Edge Function과 Next.js API Route는 아래 구조를 따릅니다.

### 성공

```json
{
  "success": true,
  "data": { ... }
}
```

### 실패

```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "사람이 읽을 수 있는 설명"
  }
}
```

### HTTP 상태 코드 사용 기준

| 상태 코드 | 용도 |
|-----------|------|
| 200 | 성공 (조회 · 업데이트) |
| 201 | 성공 (리소스 생성) |
| 400 | 잘못된 요청 (입력 검증 실패) |
| 401 | 인증 필요 (JWT 없음 또는 만료) |
| 403 | 권한 없음 (본인 리소스 아님, RLS 차단 등) |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 username 등) |
| 429 | Rate Limit 초과 |
| 500 | 서버 내부 오류 |

---

## 2. 공통 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_REQUIRED` | 401 | 로그인이 필요한 기능 |
| `AUTH_EXPIRED` | 401 | JWT 만료 — 클라이언트가 리프레시 후 재시도 |
| `FORBIDDEN` | 403 | 본인 소유 리소스가 아님 |
| `NOT_FOUND` | 404 | 요청한 리소스가 존재하지 않음 |
| `VALIDATION_ERROR` | 400 | 필수 필드 누락 또는 형식 오류 |
| `DUPLICATE_USERNAME` | 409 | 이미 사용 중인 username |
| `RATE_LIMIT` | 429 | 너무 많은 요청 (Upstash Redis 기반) |
| `BLOCKED_USER` | 403 | 차단된 사용자 — 조회/인터랙션 불가 |
| `PREMIUM_REQUIRED` | 403 | 프리미엄 전용 기능 |
| `PAYMENT_FAILED` | 400 | 결제 실패 또는 검증 오류 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## 3. 페이지네이션 표준

피드, 댓글, 알림 등 목록성 API는 **Cursor 기반 페이지네이션**을 사용합니다.
offset 방식은 실시간 피드에서 중복·누락이 발생하므로 사용하지 않습니다.

### 요청 파라미터

```ts
interface PaginationRequest {
  limit?: number    // 기본값 20, 최대 50
  cursor?: string   // 이전 응답의 nextCursor 값 (없으면 첫 페이지)
}
```

### 응답 구조

```ts
interface PaginationResponse<T> {
  success: true
  data: {
    items: T[]
    nextCursor: string | null  // null이면 마지막 페이지
    hasMore: boolean
  }
}
```

### cursor 값 기준

| 엔드포인트 | cursor 기준 컬럼 |
|-----------|----------------|
| 메인 피드 | `projects.created_at` (ISO 8601) |
| 댓글 목록 | `comments.created_at` (ISO 8601) |
| 알림 목록 | `notifications.created_at` (ISO 8601) |
| DM 메시지 | `messages.created_at` (ISO 8601) |
| 팔로워/팔로잉 | `follows.created_at` (ISO 8601) |

### 사용 예시

```ts
// 첫 페이지
const { data } = await getProjectFeed({ limit: 20 })

// 다음 페이지
const { data: nextPage } = await getProjectFeed({
  limit: 20,
  cursor: data.nextCursor,
})
```

---

## 4. Supabase Queries 구조

`packages/supabase/queries/` 각 파일의 함수 목록과 시그니처입니다.
모든 함수는 Supabase JS 클라이언트를 직접 사용하며, Web/Mobile에서 공유합니다.

---

### 4-1. `auth.ts`

```ts
// 프로필 조회 (내 정보)
getMyProfile(): Promise<Profile>

// 프로필 조회 (username으로)
getProfileByUsername(username: string): Promise<Profile>

// 프로필 수정
updateProfile(updates: {
  display_name?: string
  bio?: string
  avatar_url?: string
  website_url?: string
  github_handle?: string
  interest_tools?: string[]
  interest_cats?: string[]
}): Promise<Profile>

// username 변경 (30일 1회 제한)
changeUsername(newUsername: string): Promise<void>

// 회원 탈퇴 요청 (soft delete — delete_requested_at 설정)
requestAccountDeletion(): Promise<void>

// 로그아웃 (현재 기기)
signOut(): Promise<void>

// 로그아웃 (모든 기기 — scope: 'global')
signOutAll(): Promise<void>

// 온보딩 완료 여부 확인 (username이 없으면 온보딩 필요)
isOnboardingComplete(userId: string): Promise<boolean>
```

---

### 4-2. `projects.ts`

```ts
// 프로젝트 생성
createProject(input: {
  title: string               // max 60자
  description: string
  demo_url: string            // https:// 필수
  github_url?: string
  thumbnail_url?: string
  category?: string
  tool_ids?: string[]         // project_tools 연결
  prompts?: ProjectPromptInput[]
}): Promise<Project>

// 프로젝트 수정
updateProject(id: string, updates: Partial<ProjectInput>): Promise<Project>

// 프로젝트 삭제 (soft delete)
deleteProject(id: string): Promise<void>

// 프로젝트 상세 조회
getProject(id: string): Promise<ProjectDetail>
// ProjectDetail = Project + author Profile + tools + prompts + 내 좋아요/북마크 여부

// 내 프로젝트 목록
getMyProjects(params: PaginationRequest): Promise<PaginationResponse<Project>>

// 특정 유저의 프로젝트 목록
getUserProjects(userId: string, params: PaginationRequest): Promise<PaginationResponse<Project>>

// 썸네일 업로드 (Supabase Storage)
uploadThumbnail(file: File | Blob): Promise<string>  // 반환: 공개 URL

// 프로젝트 버전 추가
addProjectVersion(projectId: string, version: string): Promise<void>

// 임시저장
saveDraft(draft: Partial<ProjectInput>): Promise<ProjectDraft>
getDraft(draftId: string): Promise<ProjectDraft>
deleteDraft(draftId: string): Promise<void>
```

---

### 4-3. `feed.ts`

```ts
// 메인 피드 (팔로잉 + 추천 혼합)
getFeed(params: PaginationRequest & {
  filter?: 'all' | 'following'
  category?: string
  tool_slug?: string
}): Promise<PaginationResponse<FeedItem>>
// FeedItem = Project + author 기본 정보 + 내 좋아요/북마크 여부

// 주간 베스트 피드
getWeeklyBest(week?: string): Promise<WeeklyBest[]>
// week: 'YYYY-WW' 형식, 없으면 최신 주

// 해시태그/카테고리 피드
getTagFeed(tag: string, params: PaginationRequest): Promise<PaginationResponse<FeedItem>>

// AI 툴 페이지 피드
getToolFeed(toolSlug: string, params: PaginationRequest): Promise<PaginationResponse<FeedItem>>

// 좋아요
likeProject(projectId: string): Promise<void>
unlikeProject(projectId: string): Promise<void>

// 북마크
bookmarkProject(projectId: string): Promise<void>
unbookmarkProject(projectId: string): Promise<void>

// 북마크 목록
getBookmarks(params: PaginationRequest): Promise<PaginationResponse<FeedItem>>

// 프로젝트 조회수 증가 (debounce 처리 권장)
incrementViewCount(projectId: string): Promise<void>

// 댓글 목록
getComments(projectId: string, params: PaginationRequest): Promise<PaginationResponse<Comment>>

// 댓글 작성
createComment(projectId: string, content: string, parentId?: string): Promise<Comment>

// 댓글 삭제 (soft delete)
deleteComment(commentId: string): Promise<void>

// 프롬프트 복사 카운트 증가
incrementPromptCopyCount(projectId: string): Promise<void>
```

---

### 4-4. `social.ts`

```ts
// 팔로우
followUser(targetUserId: string): Promise<void>
unfollowUser(targetUserId: string): Promise<void>

// 팔로워 목록
getFollowers(userId: string, params: PaginationRequest): Promise<PaginationResponse<ProfileSummary>>

// 팔로잉 목록
getFollowing(userId: string, params: PaginationRequest): Promise<PaginationResponse<ProfileSummary>>

// 내가 팔로우하는지 여부
isFollowing(targetUserId: string): Promise<boolean>

// 차단
blockUser(targetUserId: string): Promise<void>
unblockUser(targetUserId: string): Promise<void>

// 차단 목록
getBlockList(): Promise<ProfileSummary[]>

// 신고
reportContent(input: {
  target_type: 'project' | 'post' | 'comment' | 'user'
  target_id: string
  reason: string
}): Promise<void>

// 자유 게시글 (posts)
createPost(input: { content: string; image_urls?: string[] }): Promise<Post>
updatePost(id: string, input: Partial<PostInput>): Promise<Post>
deletePost(id: string): Promise<void>
getPost(id: string): Promise<PostDetail>
likePost(postId: string): Promise<void>
unlikePost(postId: string): Promise<void>

// DM
getDMRooms(): Promise<DMRoom[]>
getDMMessages(roomId: string, params: PaginationRequest): Promise<PaginationResponse<DMMessage>>
sendDMMessage(roomId: string, content: string): Promise<DMMessage>
createDMRoom(targetUserId: string): Promise<DMRoom>
```

---

### 4-5. `search.ts`

```ts
// 통합 검색
search(query: string, params: PaginationRequest & {
  type?: 'all' | 'projects' | 'users' | 'posts' | 'prompts'
}): Promise<{
  projects: PaginationResponse<FeedItem>
  users: PaginationResponse<ProfileSummary>
  posts: PaginationResponse<Post>
}>

// 프로젝트 검색 (Full-text)
searchProjects(query: string, params: PaginationRequest): Promise<PaginationResponse<FeedItem>>

// 유저 검색
searchUsers(query: string, params: PaginationRequest): Promise<PaginationResponse<ProfileSummary>>

// 해시태그/카테고리 목록
getTags(): Promise<Tag[]>

// AI 툴 목록
getTools(): Promise<Tool[]>

// 트렌딩 검색어 (Upstash Redis 기반)
getTrendingKeywords(): Promise<string[]>
```

---

### 4-6. `notifications.ts`

```ts
// 알림 목록
getNotifications(params: PaginationRequest): Promise<PaginationResponse<Notification>>

// 읽지 않은 알림 수
getUnreadCount(): Promise<number>

// 알림 읽음 처리 (단건)
markAsRead(notificationId: string): Promise<void>

// 전체 읽음 처리
markAllAsRead(): Promise<void>

// 알림 설정 조회
getNotificationSettings(): Promise<NotificationSettings>

// 알림 설정 수정
updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings>
// NotificationSettings: { like, comment, follow, weekly_best, dm, system } x { push, email, inapp }

// Expo Push Token 등록 (앱 시작 시)
registerPushToken(token: string): Promise<void>

// Expo Push Token 삭제 (로그아웃 시)
removePushToken(): Promise<void>

// Q&A
getQnaQuestions(params: PaginationRequest): Promise<PaginationResponse<QnaQuestion>>
getQnaQuestion(id: string): Promise<QnaQuestionDetail>
createQnaQuestion(input: { title: string; content: string; tags?: string[] }): Promise<QnaQuestion>
createQnaAnswer(questionId: string, content: string): Promise<QnaAnswer>
voteQnaAnswer(answerId: string, value: 1 | -1): Promise<void>
acceptQnaAnswer(answerId: string): Promise<void>
```

---

### 4-7. `premium.ts`

```ts
// 구독 상태 조회
getSubscription(): Promise<Subscription | null>

// 결제 준비 (토스페이먼츠 — orderId 생성)
prepareTossPayment(plan: 'monthly' | 'yearly'): Promise<{
  orderId: string
  amount: number
  orderName: string
}>

// 결제 준비 (카카오페이 — ready API 호출)
prepareKakaoPayment(plan: 'monthly' | 'yearly'): Promise<{
  tid: string
  next_redirect_app_url: string
  next_redirect_mobile_url: string
  next_redirect_pc_url: string
}>

// 구독 취소
cancelSubscription(): Promise<void>

// 결제 내역
getPaymentHistory(params: PaginationRequest): Promise<PaginationResponse<PaymentLog>>
```

---

## 5. Edge Functions

`supabase/functions/` 아래 각 함수의 엔드포인트, 인증 방식, Request/Response 스키마입니다.

---

### 5-1. `send-notification`

**역할**: 알림 INSERT 트리거에서 호출 — 대상 유저의 설정을 확인 후 Expo Push + Resend 이메일 발송
**호출 방식**: Supabase DB 트리거 (직접 HTTP 호출 없음)
**인증**: `SUPABASE_SERVICE_ROLE_KEY` (서버 내부)

```ts
// Request (DB 트리거에서 전달)
interface SendNotificationRequest {
  notification_id: string  // notifications 테이블 PK
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'weekly_best' | 'dm' | 'system'
  actor_id?: string        // 행위자 (좋아요/댓글/팔로우를 누른 유저)
  target_type?: 'project' | 'post' | 'comment'
  target_id?: string
  message: string
}

// Response
{ "success": true }
```

---

### 5-2. `payment-confirm`

**역할**: 토스페이먼츠 결제 승인 요청 → 검증 → 구독 활성화
**엔드포인트**: `POST /functions/v1/payment-confirm`
**인증**: Bearer JWT (Supabase Auth)

```ts
// Request
interface PaymentConfirmRequest {
  provider: 'toss'
  paymentKey: string
  orderId: string
  amount: number
}

// Response (성공)
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "monthly" | "yearly",
      "starts_at": "2026-03-26T00:00:00Z",
      "ends_at": "2026-04-26T00:00:00Z"
    }
  }
}
```

---

### 5-3. `payment-cancel`

**역할**: 구독 취소 요청 → 토스페이먼츠 취소 API → DB 업데이트
**엔드포인트**: `POST /functions/v1/payment-cancel`
**인증**: Bearer JWT (Supabase Auth)

```ts
// Request
interface PaymentCancelRequest {
  provider: 'toss'
  paymentKey: string
  cancelReason: string
}

// Response (성공)
{ "success": true }
```

---

### 5-4. `github-import`

**역할**: GitHub URL에서 프로젝트 README / 메타데이터 가져오기 (프로젝트 업로드 보조)
**엔드포인트**: `POST /functions/v1/github-import`
**인증**: Bearer JWT (Supabase Auth)

```ts
// Request
interface GithubImportRequest {
  github_url: string  // https://github.com/owner/repo
}

// Response (성공)
{
  "success": true,
  "data": {
    "title": "레포 이름",
    "description": "README 첫 문단 (최대 500자)",
    "demo_url": "homepage 필드 값 (있을 경우)",
    "topics": ["react", "typescript"]  // GitHub 토픽 → 태그 추천
  }
}
```

---

### 5-5. `weekly-best-cron`

**역할**: 매주 월요일 00:00 KST — 지난 주 베스트 프로젝트 집계 → `weekly_bests` 테이블 INSERT
**엔드포인트**: `POST /functions/v1/weekly-best-cron`
**인증**: `Authorization: Bearer CRON_SECRET` (Supabase Cron 또는 외부 스케줄러)

```ts
// Request — body 없음

// Response
{
  "success": true,
  "data": {
    "week": "2026-13",       // YYYY-WW
    "inserted_count": 10
  }
}
```

**집계 기준**: 7일 내 `like_count * 2 + comment_count + bookmark_count + view_count * 0.1` 합산 상위 10개

---

## 6. Next.js API Routes

`apps/web/app/api/` 아래 라우트 명세입니다.

---

### 6-1. `GET /api/og`

**역할**: 프로젝트 / 유저 프로필 OG 이미지 동적 생성 (satori + resvg)
**캐시**: `Cache-Control: public, max-age=86400, stale-while-revalidate=3600`
**인증**: 불필요

```
GET /api/og?type=project&id={projectId}
GET /api/og?type=profile&username={username}
```

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `type` | ✅ | `project` \| `profile` |
| `id` | type=project 시 ✅ | 프로젝트 UUID |
| `username` | type=profile 시 ✅ | 유저 username |

**응답**: `image/png` (1200×630px)

---

### 6-2. `POST /api/webhook/toss`

**역할**: 토스페이먼츠 결제 웹훅 수신 → 구독 상태 동기화
**인증**: `Toss-Signature` 헤더 검증 (HMAC-SHA256)

```ts
// Webhook Payload (토스페이먼츠 → 우리 서버)
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "data": {
    "paymentKey": "...",
    "orderId": "...",
    "status": "DONE" | "CANCELED" | "PARTIAL_CANCELED"
  }
}

// Response
{ "success": true }
```

---

### 6-3. `POST /api/webhook/kakao`

**역할**: 카카오페이 결제 완료 웹훅 수신 → 구독 상태 동기화
**인증**: 요청 IP 화이트리스트 검증 (카카오 공개 IP 범위)

```ts
// Webhook Payload (카카오페이 → 우리 서버)
{
  "tid": "...",
  "cid": "...",
  "status": "SUCCESS_PAYMENT" | "CANCEL_PAYMENT",
  "partner_order_id": "..."
}

// Response
{ "success": true }
```

---

## 7. Supabase Realtime 채널

클라이언트에서 구독하는 Realtime 채널 목록입니다.

| 채널 이름 | 이벤트 | 설명 |
|----------|--------|------|
| `notifications:{userId}` | INSERT on `notifications` | 내 알림 실시간 수신 |
| `feed:public` | INSERT on `projects` | 메인 피드 새 프로젝트 알림 |
| `dm:{roomId}` | INSERT on `messages` | DM 실시간 메시지 수신 |

### 구독 예시 (공유 패키지)

```ts
// 알림 채널
const channel = supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    (payload) => onNewNotification(payload.new)
  )
  .subscribe()

// 정리
return () => supabase.removeChannel(channel)
```

---

## 8. 외부 연동 인터페이스

---

### 8-1. Expo Push Notifications (FCM/APNs)

`send-notification` Edge Function 내부에서 Expo Push API를 호출합니다.

```ts
// Expo Push API 페이로드
interface ExpoPushMessage {
  to: string            // 'ExponentPushToken[...]'
  title: string
  body: string
  data?: {
    type: 'like' | 'comment' | 'follow' | 'dm' | 'system'
    target_id?: string  // 딥링크용 ID
  }
  sound?: 'default'
  badge?: number        // iOS 배지 카운트
}

// 엔드포인트
POST https://exp.host/--/api/v2/push/send
```

**딥링크 라우팅** (앱에서 `data.type + data.target_id`로 분기)

| type | 이동 화면 |
|------|----------|
| `like` / `comment` | `/projects/{target_id}` |
| `follow` | `/profile/{actor_id}` |
| `dm` | `/messages/{target_id}` |
| `system` | `/notifications` |

---

### 8-2. Resend 이메일

`send-notification` Edge Function에서 알림 설정에 이메일이 켜진 경우 발송합니다.

```ts
// Resend API 페이로드
interface ResendEmailPayload {
  from: 'no-reply@withoutcode.kr'
  to: string           // 수신자 이메일
  subject: string
  react: JSX.Element   // React Email 컴포넌트
}

// 이메일 템플릿 목록
type EmailTemplate =
  | 'notification-like'       // 누군가 내 프로젝트를 좋아했어요
  | 'notification-comment'    // 누군가 댓글을 남겼어요
  | 'notification-follow'     // 새 팔로워가 생겼어요
  | 'weekly-digest'           // 주간 베스트 다이제스트
```

---

### 8-3. Cloudflare Images

이미지 업로드는 Supabase Storage를 기본으로 사용합니다.
트래픽 증가 후 Cloudflare Images로 이전 시 아래 인터페이스를 사용합니다.

```
# 업로드 (서버사이드 — Next.js API Route 또는 Edge Function)
POST https://api.cloudflare.com/client/v4/accounts/{accountId}/images/v1
Authorization: Bearer {CLOUDFLARE_IMAGES_API_TOKEN}
Content-Type: multipart/form-data

# 서빙 URL
https://imagedelivery.net/{accountHash}/{imageId}/public
https://imagedelivery.net/{accountHash}/{imageId}/thumbnail  # 320x320 crop
```
