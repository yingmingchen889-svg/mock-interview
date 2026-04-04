# Mock Interview App - Design Specification

## Context

Technical job seekers need a realistic way to practice interviews. Existing tools are mostly text-based or use rigid question banks. This app provides a **voice-based AI mock interview** experience that feels like talking to a real interviewer — with real-time follow-up questions, adaptive difficulty, and comprehensive post-interview feedback with progress tracking over time.

Target market: China (CNY pricing, WeChat/Alipay login & payment).

---

## Architecture

**Two-service architecture:**

1. **Next.js Web App** (TypeScript) — Frontend UI, API routes, auth, payment, report generation, data persistence
2. **Python Voice Agent** (LiveKit Agents SDK) — Real-time voice pipeline: STT, LLM orchestration, TTS

Connected via **LiveKit Cloud** (WebRTC SFU) for low-latency audio routing.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS + shadcn/ui + @livekit/components-react |
| Backend API | Next.js Route Handlers + tRPC |
| Voice Agent | Python + LiveKit Agents SDK + VoicePipelineAgent |
| STT | Deepgram Nova-3 (via LiveKit plugin, streaming WebSocket) |
| TTS | ElevenLabs Flash v2.5 (via LiveKit plugin, streaming) |
| LLM | Multi-model: OpenAI GPT-4o/4o-mini, Anthropic Claude Sonnet/Haiku (via LiveKit plugins) |
| Database | PostgreSQL (Neon serverless) + Prisma ORM |
| Cache | Redis (Upstash) — session state, rate limiting |
| Auth | NextAuth.js v5 — phone/email + WeChat/Alipay/Huawei OAuth |
| Payments | Alipay (Open Platform SDK) + WeChat Pay (JSAPI/Native) |
| File Storage | S3 or Vercel Blob — audio recordings, report exports |
| Hosting | Vercel (Next.js) + Railway or Fly.io (Python Agent) + LiveKit Cloud |

### Data Flow

1. **Start Interview**: Browser --> Next.js API (create LiveKit room + generate token) --> LiveKit Cloud dispatches Python agent --> Browser joins room via WebRTC
2. **Voice Conversation**: User speaks --> WebRTC --> LiveKit --> Agent (STT --> LLM --> TTS) --> LiveKit --> WebRTC --> Browser plays audio
3. **End Interview**: Agent sends full transcript to Next.js API --> Batch LLM call generates report --> Save to DB --> Browser shows report
4. **Progress Tracking**: Each report updates user skill scores --> Dashboard aggregates across sessions

---

## Voice Pipeline

### Per-Utterance Flow

```
User Speaks --> WebRTC (~50ms) --> VAD Detection (~100ms) --> Deepgram STT (~300ms) --> LLM (~200ms) --> TTS (~200ms) --> WebRTC (~50ms) --> User Hears
```

**Total latency: ~750-950ms** (conversational feel).

### Key Voice Features

- **Interruption Handling**: When user starts speaking while AI is talking, the agent stops mid-sentence and listens. Handled natively by LiveKit Agents SDK via VAD + audio track muting.
- **Streaming Pipeline**: LLM tokens stream into TTS in sentence chunks. Audio playback starts before full response is generated.
- **Turn Detection**: Silero VAD (built into LiveKit) detects end-of-speech. Handles pauses, filler words, and thinking silences without cutting off the user.
- **Transcript Capture**: Both user and AI utterances captured with timestamps. Full transcript sent to Next.js API on session end.

---

## Interview Flow

### State Machine

```
INTRO (2 min) --> TECHNICAL (20 min) --> BEHAVIORAL (5 min) --> Q&A (3 min) --> REPORT (async)
```

- **INTRO**: AI introduces itself, asks user to briefly introduce themselves. Warm-up.
- **TECHNICAL**: Core technical questions based on configured role and tech stack. AI probes deeply with follow-ups.
- **BEHAVIORAL**: STAR-method situational questions.
- **Q&A**: User asks the AI interviewer questions ("reverse interview").
- **REPORT**: After session ends, batch LLM call generates comprehensive evaluation.

### AI Prompt Architecture (4 layers)

1. **System Persona**: Senior technical interviewer persona — professional, encouraging but rigorous.
2. **Job Config**: Role (e.g. "Senior Frontend Engineer"), tech stack (React, TypeScript), difficulty level (Junior/Mid/Senior), focus areas.
3. **Session State**: Current phase, questions asked, running assessment of user performance.
4. **Evaluation** (post-interview only): Detailed rubric, scoring criteria, knowledge point mapping template.

### Follow-up Logic

- **Weak answer**: Give hints, rephrase, simplify to test baseline understanding.
- **Partial answer**: Ask targeted follow-up to probe specific gaps, test edge cases.
- **Strong answer**: Increase difficulty, explore advanced topics, move to next question.

---

## Data Model

### User

| Field | Type |
|-------|------|
| id | uuid (PK) |
| email | string? |
| phone | string? |
| name | string |
| avatarUrl | string? |
| subscriptionTier | enum: FREE, PRO, PREMIUM |
| preferredModel | string (default: "gpt-4o-mini") |
| preferredLanguage | string (default: "zh") |
| alipayUserId | string? |
| wechatOpenId | string? |
| huaweiUnionId | string? |
| createdAt / updatedAt | timestamp |

### Interview

| Field | Type |
|-------|------|
| id | uuid (PK) |
| userId | FK --> User |
| jobRole | string |
| techStack | string[] |
| difficulty | enum: JUNIOR, MID, SENIOR |
| modelUsed | string |
| status | enum: IN_PROGRESS, COMPLETED, CANCELLED |
| durationSeconds | int |
| livekitRoomId | string |
| createdAt / completedAt | timestamp |

### Transcript

| Field | Type |
|-------|------|
| id | uuid (PK) |
| interviewId | FK --> Interview |
| role | enum: USER, AI |
| content | text |
| phase | enum: INTRO, TECHNICAL, BEHAVIORAL, QA |
| startTime / endTime | timestamp |
| questionIndex | int? |

### Report

| Field | Type |
|-------|------|
| id | uuid (PK) |
| interviewId | FK --> Interview (unique) |
| overallScore | int (0-100) |
| summary | text |
| strengths | jsonb |
| weaknesses | jsonb |
| questionScores | jsonb[] |
| knowledgePoints | jsonb[] |
| improvementSuggestions | text[] |

### SkillProgress

| Field | Type |
|-------|------|
| id | uuid (PK) |
| userId | FK --> User |
| skillName | string (e.g. "React Hooks") |
| category | string (e.g. "Frontend") |
| currentScore | int (0-100) |
| history | jsonb[] |
| lastAssessedAt | timestamp |

### Subscription

| Field | Type |
|-------|------|
| id | uuid (PK) |
| userId | FK --> User |
| tier | enum: PRO, PREMIUM |
| paymentChannel | enum: ALIPAY, WECHAT |
| tradeNo | string (third-party transaction ID) |
| status | enum: ACTIVE, EXPIRED, CANCELLED |
| currentPeriodStart | timestamp |
| currentPeriodEnd | timestamp |
| autoRenew | boolean |
| createdAt / updatedAt | timestamp |

### KnowledgePoint

| Field | Type |
|-------|------|
| id | uuid (PK) |
| name | string (e.g. "Virtual DOM") |
| category | string (e.g. "React") |
| description | text |
| resourceLinks | string[] |
| relatedSkills | string[] |

---

## Auth & Payment

### Authentication

- Phone number + SMS verification code (MVP primary)
- Email + password
- WeChat OAuth login (Phase 2)
- Alipay OAuth login (Phase 2)
- Huawei ID login (Phase 2)

Implementation: NextAuth.js v5 with custom providers for WeChat/Alipay/Huawei.

### Payment

- Alipay (via Open Platform SDK)
- WeChat Pay (via JSAPI / Native Pay)
- Subscription auto-renewal support

### Subscription Tiers (CNY)

| Tier | Price | Interviews | Models | Features |
|------|-------|-----------|--------|----------|
| FREE | ¥0 | 3/month | GPT-4o-mini only | Basic text report |
| PRO | ¥39/month | 30/month | All models | Detailed report + knowledge points + progress tracking |
| PREMIUM | ¥99/month | Unlimited | All + priority API | Full report + resource links + advanced analytics + resume-based questions |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — product intro, pricing, CTA |
| `/login`, `/register` | Auth — phone/email login |
| `/dashboard` | Overview — recent interviews, skill radar chart, quick start |
| `/interview/new` | Interview setup — select role, tech stack, difficulty, model |
| `/interview/[id]` | Interview room — live voice: waveform, timer, phase indicator, real-time transcript |
| `/interview/[id]/report` | Report — score, strengths/weaknesses, per-question breakdown, knowledge links |
| `/history` | Interview history — past interviews list with scores, filters |
| `/progress` | Progress tracking — skill trends over time, radar chart, weak areas |
| `/settings` | Settings — profile, preferred model, language, subscription |
| `/pricing` | Pricing — tier comparison, payment integration |

---

## MVP Phasing

### Phase 1 — MVP (5-7 weeks)

- Voice interview core loop (LiveKit + Python agent with Deepgram/OpenAI GPT-4o-mini/ElevenLabs)
- Interview setup (predefined role/stack/difficulty selection)
- Interview state machine (INTRO --> TECHNICAL --> BEHAVIORAL --> Q&A)
- Post-interview report (overall score, per-question breakdown, strengths/weaknesses)
- Basic auth (phone number + email)
- Interview history list
- Core pages: Landing, Dashboard, Interview Setup/Room/Report, History, Settings

### Phase 2 — Monetization & Social (+3-4 weeks)

- Social login: WeChat, Alipay, Huawei ID OAuth
- Payment system: Alipay + WeChat Pay subscription billing
- Multi-model switching: Claude Sonnet, GPT-4o as paid tier options
- Progress tracking: skill radar chart, trend lines, weak area highlighting
- Knowledge points: link report findings to learning resources

### Phase 3 — Future

- Mobile app (React Native / Flutter)
- Audio recording playback for past interviews
- Resume upload for AI-generated custom questions
- Integrated code editor for live coding interviews
- Video/screen share for system design whiteboard (LiveKit native support)
