# Mock Interview App — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-based AI mock interview web app where users configure a technical role, have a real-time voice conversation with an AI interviewer, and receive a comprehensive post-interview report.

**Architecture:** Two-service system — a Next.js 15 web app (TypeScript) handles UI, auth, API, and reports; a Python voice agent (LiveKit Agents SDK) handles the real-time STT → LLM → TTS pipeline. LiveKit Cloud connects them via WebRTC.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, tRPC, Prisma, PostgreSQL (Neon), NextAuth.js v5, Python 3.12, LiveKit Agents SDK, Deepgram, OpenAI, ElevenLabs.

**Design spec:** `docs/superpowers/specs/2026-04-04-mock-interview-app-design.md`

---

## File Structure

### Next.js Web App (`/`)

```
package.json
next.config.ts
tailwind.config.ts
tsconfig.json
.env.local.example
prisma/
  schema.prisma
src/
  app/
    layout.tsx                     # Root layout with providers
    page.tsx                       # Landing page
    (auth)/
      login/page.tsx               # Login page
      register/page.tsx            # Register page
    (app)/
      layout.tsx                   # Authenticated layout with sidebar nav
      dashboard/page.tsx           # Dashboard
      interview/
        new/page.tsx               # Interview setup form
        [id]/
          page.tsx                 # Interview room (LiveKit)
          report/page.tsx          # Post-interview report
      history/page.tsx             # Interview history list
      settings/page.tsx            # User settings
  components/
    ui/                            # shadcn/ui components (auto-generated)
    interview/
      interview-setup-form.tsx     # Role/stack/difficulty selector
      interview-room.tsx           # LiveKit room wrapper with controls
      interview-timer.tsx          # Session timer with phase indicator
      audio-visualizer.tsx         # Waveform visualization
      transcript-panel.tsx         # Real-time transcript display
    report/
      report-summary.tsx           # Overall score + summary card
      question-scores.tsx          # Per-question breakdown
      strengths-weaknesses.tsx     # Strengths/weaknesses lists
    dashboard/
      recent-interviews.tsx        # Recent interview cards
      quick-start.tsx              # Quick start CTA
    history/
      interview-list.tsx           # Filterable interview history table
    layout/
      app-sidebar.tsx              # Sidebar navigation
      header.tsx                   # Top header bar
  server/
    api/
      root.ts                     # tRPC root router
      routers/
        interview.ts              # Interview CRUD + LiveKit token generation
        report.ts                 # Report generation + retrieval
        user.ts                   # User profile + settings
    auth.ts                       # NextAuth config
    db.ts                         # Prisma client singleton
    trpc.ts                       # tRPC init + context
  lib/
    livekit.ts                    # LiveKit server SDK helpers (room creation, token gen)
    report-generator.ts           # Batch LLM call to generate interview report
    prompts/
      evaluation.ts               # Report generation prompt template
    interview-config.ts           # Predefined roles, tech stacks, difficulty presets
    utils.ts                      # Shared utility functions
  types/
    interview.ts                  # Shared TypeScript types for interview domain
```

### Python Voice Agent (`/agent`)

```
agent/
  pyproject.toml                  # Python project config (uv/pip)
  .env.example                    # Env var template
  main.py                         # Agent entrypoint — registers worker with LiveKit
  interview_agent.py              # VoicePipelineAgent subclass — interview logic
  prompts.py                      # System persona + job config + session state prompt builders
  state_machine.py                # Interview phase state machine (INTRO→TECHNICAL→BEHAVIORAL→QA)
  transcript_store.py             # In-memory transcript accumulator, sends to API on session end
  config.py                       # Settings loader from env vars
  tests/
    test_state_machine.py         # State machine transition tests
    test_prompts.py               # Prompt builder tests
    test_transcript_store.py      # Transcript accumulation tests
```

---

## Task Breakdown

### Task 1: Next.js Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "D:/Claude Code Projects/MockInterview"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Select defaults when prompted. This creates the full Next.js 15 scaffold with App Router, TypeScript, Tailwind, ESLint.

- [ ] **Step 2: Install core dependencies**

```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod prisma @prisma/client next-auth@beta livekit-server-sdk @livekit/components-react @livekit/components-styles lucide-react class-variance-authority clsx tailwind-merge
npm install -D @types/node prisma
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Then add base components:

```bash
npx shadcn@latest add button card input label select textarea badge separator avatar dropdown-menu sheet tabs dialog form toast
```

- [ ] **Step 4: Create `.env.local.example`**

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/mockinterview?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# LiveKit
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""
LIVEKIT_URL="wss://your-app.livekit.cloud"

# OpenAI (for report generation)
OPENAI_API_KEY=""
```

- [ ] **Step 5: Update `.gitignore`**

Append to the existing `.gitignore`:

```
# env
.env.local
.env.production

# superpowers brainstorm
.superpowers/
```

- [ ] **Step 6: Verify the dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on `http://localhost:3000` with the default page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn/ui, tRPC deps"
```

---

### Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`, `src/server/db.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SubscriptionTier {
  FREE
  PRO
  PREMIUM
}

enum Difficulty {
  JUNIOR
  MID
  SENIOR
}

enum InterviewStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TranscriptRole {
  USER
  AI
}

enum InterviewPhase {
  INTRO
  TECHNICAL
  BEHAVIORAL
  QA
}

model User {
  id                String           @id @default(uuid())
  email             String?          @unique
  phone             String?          @unique
  name              String
  avatarUrl         String?
  passwordHash      String?
  subscriptionTier  SubscriptionTier @default(FREE)
  preferredModel    String           @default("gpt-4o-mini")
  preferredLanguage String           @default("zh")
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  interviews    Interview[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Interview {
  id              String          @id @default(uuid())
  userId          String
  jobRole         String
  techStack       String[]
  difficulty      Difficulty
  modelUsed       String
  status          InterviewStatus @default(IN_PROGRESS)
  durationSeconds Int?
  livekitRoomId   String?
  createdAt       DateTime        @default(now())
  completedAt     DateTime?

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  transcripts Transcript[]
  report      Report?
}

model Transcript {
  id            String         @id @default(uuid())
  interviewId   String
  role          TranscriptRole
  content       String
  phase         InterviewPhase
  startTime     DateTime
  endTime       DateTime?
  questionIndex Int?

  interview Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
}

model Report {
  id                     String   @id @default(uuid())
  interviewId            String   @unique
  overallScore           Int
  summary                String
  strengths              Json
  weaknesses             Json
  questionScores         Json
  knowledgePoints        Json
  improvementSuggestions String[]
  createdAt              DateTime @default(now())

  interview Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
}

model SkillProgress {
  id             String   @id @default(uuid())
  userId         String
  skillName      String
  category       String
  currentScore   Int      @default(0)
  history        Json     @default("[]")
  lastAssessedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillName])
}

model Subscription {
  id                 String   @id @default(uuid())
  userId             String
  tier               SubscriptionTier
  paymentChannel     String
  tradeNo            String?
  status             String   @default("ACTIVE")
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  autoRenew          Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

And add the corresponding relations to the User model. In the User model above, add after `sessions`:

```
  skillProgress SkillProgress[]
  subscriptions Subscription[]
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/server/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 4: Generate Prisma client**

Set `DATABASE_URL` in `.env.local` to a real Neon connection string (or local PostgreSQL), then:

```bash
npx prisma generate
```

Expected: `Prisma Client generated successfully`.

- [ ] **Step 5: Push schema to database**

```bash
npx prisma db push
```

Expected: Tables created in the database.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/server/db.ts
git commit -m "feat: add Prisma schema with User, Interview, Transcript, Report models"
```

---

### Task 3: tRPC Setup

**Files:**
- Create: `src/server/trpc.ts`, `src/server/api/root.ts`, `src/server/api/routers/interview.ts`, `src/server/api/routers/report.ts`, `src/server/api/routers/user.ts`, `src/app/api/trpc/[trpc]/route.ts`, `src/lib/trpc-client.ts`, `src/components/providers.tsx`

- [ ] **Step 1: Create tRPC initialization**

Create `src/server/trpc.ts`:

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "./db";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const createTRPCContext = async () => {
  const session = await getServerSession(authOptions);
  return { db, session };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});
```

- [ ] **Step 2: Create stub routers**

Create `src/server/api/routers/interview.ts`:

```typescript
import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";

export const interviewRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.interview.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { report: { select: { overallScore: true } } },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.interview.findFirstOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { transcripts: true, report: true },
      });
    }),
});
```

Create `src/server/api/routers/report.ts`:

```typescript
import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";

export const reportRouter = router({
  getByInterviewId: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.report.findUniqueOrThrow({
        where: { interviewId: input.interviewId },
        include: {
          interview: {
            select: { jobRole: true, techStack: true, difficulty: true, durationSeconds: true, createdAt: true },
          },
        },
      });
    }),
});
```

Create `src/server/api/routers/user.ts`:

```typescript
import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
    });
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        preferredModel: z.string().optional(),
        preferredLanguage: z.enum(["zh", "en"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),
});
```

- [ ] **Step 3: Create root router**

Create `src/server/api/root.ts`:

```typescript
import { router } from "../trpc";
import { interviewRouter } from "./routers/interview";
import { reportRouter } from "./routers/report";
import { userRouter } from "./routers/user";

export const appRouter = router({
  interview: interviewRouter,
  report: reportRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Create tRPC API route handler**

Create `src/app/api/trpc/[trpc]/route.ts`:

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

- [ ] **Step 5: Create client-side tRPC setup**

Create `src/lib/trpc-client.ts`:

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

export const trpc = createTRPCReact<AppRouter>();
```

Create `src/components/providers.tsx`:

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
```

- [ ] **Step 6: Wire providers into root layout**

Update `src/app/layout.tsx` to wrap children with `<Providers>`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MockInterview - AI 模拟面试",
  description: "Voice-based AI mock interview for technical positions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: Build succeeds (auth config will be stubbed in next task).

- [ ] **Step 8: Commit**

```bash
git add src/server/ src/app/api/trpc/ src/lib/trpc-client.ts src/components/providers.tsx src/app/layout.tsx
git commit -m "feat: set up tRPC with interview, report, and user routers"
```

---

### Task 4: Authentication (NextAuth.js v5)

**Files:**
- Create: `src/server/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Install bcrypt for password hashing**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Create NextAuth config**

Create `src/server/auth.ts`:

```typescript
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

- [ ] **Step 3: Create NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/server/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Create register API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { email: ["Email already registered"] } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
```

- [ ] **Step 5: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your MockInterview account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Create register page**

Create `src/app/(auth)/register/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      const firstError = Object.values(data.error).flat()[0] as string;
      setError(firstError || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new MockInterview account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (min 6 characters)</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Add NextAuth type augmentation**

Create `src/types/next-auth.d.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/server/auth.ts src/app/api/auth/ src/app/\(auth\)/ src/types/next-auth.d.ts
git commit -m "feat: add NextAuth.js with email/password credentials auth"
```

---

### Task 5: Interview Config & Types

**Files:**
- Create: `src/lib/interview-config.ts`, `src/types/interview.ts`

- [ ] **Step 1: Define shared interview types**

Create `src/types/interview.ts`:

```typescript
export type InterviewPhase = "INTRO" | "TECHNICAL" | "BEHAVIORAL" | "QA";

export type Difficulty = "JUNIOR" | "MID" | "SENIOR";

export interface InterviewConfig {
  jobRole: string;
  techStack: string[];
  difficulty: Difficulty;
  model: string;
}

export interface QuestionScore {
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  phase: InterviewPhase;
}

export interface KnowledgePoint {
  name: string;
  category: string;
  mastery: "weak" | "partial" | "strong";
  suggestion: string;
}

export interface ReportData {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  questionScores: QuestionScore[];
  knowledgePoints: KnowledgePoint[];
  improvementSuggestions: string[];
}
```

- [ ] **Step 2: Define predefined interview options**

Create `src/lib/interview-config.ts`:

```typescript
export const JOB_ROLES = [
  { value: "frontend", label: "Frontend Engineer", icon: "🖥️" },
  { value: "backend", label: "Backend Engineer", icon: "⚙️" },
  { value: "fullstack", label: "Full Stack Engineer", icon: "🔄" },
  { value: "algorithm", label: "Algorithm Engineer", icon: "🧮" },
  { value: "data", label: "Data Engineer", icon: "📊" },
  { value: "devops", label: "DevOps Engineer", icon: "🚀" },
  { value: "mobile", label: "Mobile Developer", icon: "📱" },
  { value: "ai-ml", label: "AI/ML Engineer", icon: "🤖" },
] as const;

export const TECH_STACKS: Record<string, string[]> = {
  frontend: ["React", "Vue", "Angular", "TypeScript", "Next.js", "CSS/Tailwind", "Webpack/Vite", "Browser APIs"],
  backend: ["Node.js", "Python", "Java", "Go", "Spring Boot", "Express", "FastAPI", "gRPC"],
  fullstack: ["React", "Node.js", "TypeScript", "Next.js", "PostgreSQL", "Redis", "Docker", "REST/GraphQL"],
  algorithm: ["Data Structures", "Dynamic Programming", "Graph Algorithms", "Sorting/Searching", "Math", "System Design"],
  data: ["SQL", "Spark", "Kafka", "Airflow", "Python", "ETL", "Data Modeling", "BigQuery/Snowflake"],
  devops: ["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS", "Linux", "Monitoring", "Networking"],
  mobile: ["React Native", "Flutter", "Swift/iOS", "Kotlin/Android", "App Performance", "Native APIs"],
  "ai-ml": ["PyTorch", "TensorFlow", "NLP", "Computer Vision", "MLOps", "Statistics", "Deep Learning"],
};

export const DIFFICULTY_OPTIONS = [
  { value: "JUNIOR" as const, label: "Junior (0-2 YOE)", description: "Basic concepts, simple implementation" },
  { value: "MID" as const, label: "Mid-level (2-5 YOE)", description: "Design patterns, system thinking" },
  { value: "SENIOR" as const, label: "Senior (5+ YOE)", description: "Architecture, trade-offs, leadership" },
];

export const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast, cost-effective", tier: "FREE" as const },
  { value: "gpt-4o", label: "GPT-4o", description: "Most capable", tier: "PRO" as const },
  { value: "claude-sonnet", label: "Claude Sonnet", description: "Detailed reasoning", tier: "PRO" as const },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/types/interview.ts src/lib/interview-config.ts
git commit -m "feat: add interview config presets and shared types"
```

---

### Task 6: LiveKit Server Helpers + Interview Create API

**Files:**
- Create: `src/lib/livekit.ts`, add `create` mutation to `src/server/api/routers/interview.ts`

- [ ] **Step 1: Create LiveKit server helpers**

Create `src/lib/livekit.ts`:

```typescript
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const livekitHost = process.env.LIVEKIT_URL!;
const apiKey = process.env.LIVEKIT_API_KEY!;
const apiSecret = process.env.LIVEKIT_API_SECRET!;

export const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

export async function createInterviewRoom(roomName: string): Promise<void> {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 300, // 5 minutes empty timeout
    maxParticipants: 2, // user + agent
  });
}

export async function generateUserToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return await token.toJwt();
}
```

- [ ] **Step 2: Add `create` mutation and `getToken` query to interview router**

Update `src/server/api/routers/interview.ts`:

```typescript
import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { createInterviewRoom, generateUserToken } from "@/lib/livekit";

export const interviewRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.interview.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { report: { select: { overallScore: true } } },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.interview.findFirstOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { transcripts: true, report: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobRole: z.string().min(1),
        techStack: z.array(z.string()).min(1),
        difficulty: z.enum(["JUNIOR", "MID", "SENIOR"]),
        model: z.string().default("gpt-4o-mini"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const interview = await ctx.db.interview.create({
        data: {
          userId: ctx.session.user.id,
          jobRole: input.jobRole,
          techStack: input.techStack,
          difficulty: input.difficulty,
          modelUsed: input.model,
        },
      });

      const roomName = `interview-${interview.id}`;
      await createInterviewRoom(roomName);

      await ctx.db.interview.update({
        where: { id: interview.id },
        data: { livekitRoomId: roomName },
      });

      return { interviewId: interview.id, roomName };
    }),

  getToken: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const interview = await ctx.db.interview.findFirstOrThrow({
        where: { id: input.interviewId, userId: ctx.session.user.id },
      });

      if (!interview.livekitRoomId) {
        throw new Error("Interview room not created");
      }

      const token = await generateUserToken(
        interview.livekitRoomId,
        ctx.session.user.id,
        ctx.session.user.name ?? "User"
      );

      return { token, roomName: interview.livekitRoomId, wsUrl: process.env.LIVEKIT_URL! };
    }),

  complete: protectedProcedure
    .input(
      z.object({
        interviewId: z.string().uuid(),
        durationSeconds: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.interview.update({
        where: { id: input.interviewId, userId: ctx.session.user.id },
        data: {
          status: "COMPLETED",
          durationSeconds: input.durationSeconds,
          completedAt: new Date(),
        },
      });
    }),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/livekit.ts src/server/api/routers/interview.ts
git commit -m "feat: add LiveKit room creation, token generation, and interview CRUD"
```

---

### Task 7: Transcript Ingestion API

**Files:**
- Create: `src/app/api/interview/[id]/transcript/route.ts`

This is a plain REST endpoint (not tRPC) because the Python agent calls it directly.

- [ ] **Step 1: Create transcript ingestion endpoint**

Create `src/app/api/interview/[id]/transcript/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";

const transcriptSchema = z.object({
  entries: z.array(
    z.object({
      role: z.enum(["USER", "AI"]),
      content: z.string(),
      phase: z.enum(["INTRO", "TECHNICAL", "BEHAVIORAL", "QA"]),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
      questionIndex: z.number().int().optional(),
    })
  ),
});

// Secret shared between Python agent and Next.js API
const AGENT_SECRET = process.env.AGENT_API_SECRET ?? "dev-secret";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: interviewId } = await params;

  // Simple shared-secret auth for agent-to-server communication
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${AGENT_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = transcriptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const interview = await db.interview.findUnique({ where: { id: interviewId } });
  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  await db.transcript.createMany({
    data: parsed.data.entries.map((entry) => ({
      interviewId,
      role: entry.role,
      content: entry.content,
      phase: entry.phase,
      startTime: new Date(entry.startTime),
      endTime: entry.endTime ? new Date(entry.endTime) : null,
      questionIndex: entry.questionIndex,
    })),
  });

  return NextResponse.json({ ok: true, count: parsed.data.entries.length });
}
```

- [ ] **Step 2: Add `AGENT_API_SECRET` to `.env.local.example`**

Append to `.env.local.example`:

```
# Agent-to-server auth
AGENT_API_SECRET="generate-a-random-secret-here"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/interview/ .env.local.example
git commit -m "feat: add transcript ingestion REST endpoint for Python agent"
```

---

### Task 8: Report Generation

**Files:**
- Create: `src/lib/prompts/evaluation.ts`, `src/lib/report-generator.ts`, add `generate` mutation to `src/server/api/routers/report.ts`

- [ ] **Step 1: Create evaluation prompt template**

Create `src/lib/prompts/evaluation.ts`:

```typescript
import type { InterviewPhase } from "@/types/interview";

interface TranscriptEntry {
  role: "USER" | "AI";
  content: string;
  phase: InterviewPhase;
  questionIndex?: number | null;
}

export function buildEvaluationPrompt(
  jobRole: string,
  techStack: string[],
  difficulty: string,
  transcripts: TranscriptEntry[]
): string {
  const formattedTranscript = transcripts
    .map(
      (t) =>
        `[${t.phase}] ${t.role === "AI" ? "Interviewer" : "Candidate"}: ${t.content}`
    )
    .join("\n\n");

  return `You are a senior technical interview evaluator. Analyze this mock interview transcript and produce a structured evaluation report.

## Interview Context
- **Position**: ${jobRole}
- **Tech Stack**: ${techStack.join(", ")}
- **Difficulty**: ${difficulty}

## Transcript
${formattedTranscript}

## Instructions
Evaluate the candidate's performance and respond with ONLY a JSON object (no markdown fences) matching this exact structure:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment in Chinese>",
  "strengths": ["<strength 1 in Chinese>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1 in Chinese>", "<weakness 2>", ...],
  "questionScores": [
    {
      "question": "<the question asked>",
      "score": <0-100>,
      "maxScore": 100,
      "feedback": "<specific feedback in Chinese>",
      "phase": "<INTRO|TECHNICAL|BEHAVIORAL|QA>"
    }
  ],
  "knowledgePoints": [
    {
      "name": "<knowledge point name>",
      "category": "<category>",
      "mastery": "<weak|partial|strong>",
      "suggestion": "<learning suggestion in Chinese>"
    }
  ],
  "improvementSuggestions": ["<suggestion 1 in Chinese>", "<suggestion 2>", ...]
}

Evaluate rigorously but fairly. Be specific in feedback — reference exact answers the candidate gave. All text fields should be in Chinese (Simplified).`;
}
```

- [ ] **Step 2: Create report generator**

Create `src/lib/report-generator.ts`:

```typescript
import OpenAI from "openai";
import { buildEvaluationPrompt } from "./prompts/evaluation";
import type { ReportData, InterviewPhase } from "@/types/interview";

// Install: npm install openai
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TranscriptEntry {
  role: "USER" | "AI";
  content: string;
  phase: InterviewPhase;
  questionIndex?: number | null;
}

export async function generateReport(
  jobRole: string,
  techStack: string[],
  difficulty: string,
  transcripts: TranscriptEntry[]
): Promise<ReportData> {
  const prompt = buildEvaluationPrompt(jobRole, techStack, difficulty, transcripts);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  const reportData: ReportData = JSON.parse(content);
  return reportData;
}
```

- [ ] **Step 3: Install OpenAI SDK**

```bash
npm install openai
```

- [ ] **Step 4: Add `generate` mutation to report router**

Update `src/server/api/routers/report.ts`:

```typescript
import { router, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { generateReport } from "@/lib/report-generator";

export const reportRouter = router({
  getByInterviewId: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.report.findUniqueOrThrow({
        where: { interviewId: input.interviewId },
        include: {
          interview: {
            select: { jobRole: true, techStack: true, difficulty: true, durationSeconds: true, createdAt: true },
          },
        },
      });
    }),

  generate: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const interview = await ctx.db.interview.findFirstOrThrow({
        where: { id: input.interviewId, userId: ctx.session.user.id },
        include: { transcripts: { orderBy: { startTime: "asc" } } },
      });

      if (interview.status !== "COMPLETED") {
        throw new Error("Interview must be completed before generating report");
      }

      const existing = await ctx.db.report.findUnique({
        where: { interviewId: input.interviewId },
      });
      if (existing) return existing;

      const reportData = await generateReport(
        interview.jobRole,
        interview.techStack,
        interview.difficulty,
        interview.transcripts.map((t) => ({
          role: t.role,
          content: t.content,
          phase: t.phase,
          questionIndex: t.questionIndex,
        }))
      );

      return ctx.db.report.create({
        data: {
          interviewId: input.interviewId,
          overallScore: reportData.overallScore,
          summary: reportData.summary,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          questionScores: reportData.questionScores,
          knowledgePoints: reportData.knowledgePoints,
          improvementSuggestions: reportData.improvementSuggestions,
        },
      });
    }),
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts/evaluation.ts src/lib/report-generator.ts src/server/api/routers/report.ts package.json package-lock.json
git commit -m "feat: add report generation with OpenAI evaluation prompt"
```

---

### Task 9: Python Voice Agent

**Files:**
- Create: `agent/pyproject.toml`, `agent/.env.example`, `agent/config.py`, `agent/state_machine.py`, `agent/prompts.py`, `agent/transcript_store.py`, `agent/interview_agent.py`, `agent/main.py`, `agent/tests/test_state_machine.py`, `agent/tests/test_prompts.py`, `agent/tests/test_transcript_store.py`

- [ ] **Step 1: Create Python project config**

Create `agent/pyproject.toml`:

```toml
[project]
name = "mock-interview-agent"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "livekit-agents>=0.12",
    "livekit-plugins-deepgram>=0.9",
    "livekit-plugins-openai>=0.10",
    "livekit-plugins-elevenlabs>=0.9",
    "livekit-plugins-silero>=0.7",
    "httpx>=0.27",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-asyncio>=0.24"]

[build-system]
requires = ["setuptools>=75"]
build-backend = "setuptools.build_meta"
```

- [ ] **Step 2: Create env example**

Create `agent/.env.example`:

```
LIVEKIT_URL=wss://your-app.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
DEEPGRAM_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
NEXT_API_URL=http://localhost:3000
AGENT_API_SECRET=generate-a-random-secret-here
```

- [ ] **Step 3: Create config loader**

Create `agent/config.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    LIVEKIT_URL: str = os.environ["LIVEKIT_URL"]
    LIVEKIT_API_KEY: str = os.environ["LIVEKIT_API_KEY"]
    LIVEKIT_API_SECRET: str = os.environ["LIVEKIT_API_SECRET"]
    DEEPGRAM_API_KEY: str = os.environ["DEEPGRAM_API_KEY"]
    OPENAI_API_KEY: str = os.environ["OPENAI_API_KEY"]
    ELEVENLABS_API_KEY: str = os.environ["ELEVENLABS_API_KEY"]
    NEXT_API_URL: str = os.environ.get("NEXT_API_URL", "http://localhost:3000")
    AGENT_API_SECRET: str = os.environ.get("AGENT_API_SECRET", "dev-secret")
```

- [ ] **Step 4: Write state machine tests**

Create `agent/tests/__init__.py` (empty file).

Create `agent/tests/test_state_machine.py`:

```python
from state_machine import InterviewStateMachine, InterviewPhase


def test_initial_phase_is_intro():
    sm = InterviewStateMachine()
    assert sm.current_phase == InterviewPhase.INTRO


def test_advance_from_intro_to_technical():
    sm = InterviewStateMachine()
    sm.advance()
    assert sm.current_phase == InterviewPhase.TECHNICAL


def test_advance_through_all_phases():
    sm = InterviewStateMachine()
    phases = [InterviewPhase.INTRO]
    for _ in range(3):
        sm.advance()
        phases.append(sm.current_phase)
    assert phases == [
        InterviewPhase.INTRO,
        InterviewPhase.TECHNICAL,
        InterviewPhase.BEHAVIORAL,
        InterviewPhase.QA,
    ]


def test_advance_past_qa_stays_at_qa():
    sm = InterviewStateMachine()
    for _ in range(10):
        sm.advance()
    assert sm.current_phase == InterviewPhase.QA


def test_is_final_phase():
    sm = InterviewStateMachine()
    assert not sm.is_final_phase
    sm.advance()  # TECHNICAL
    sm.advance()  # BEHAVIORAL
    sm.advance()  # QA
    assert sm.is_final_phase
```

- [ ] **Step 5: Run tests to verify they fail**

```bash
cd "D:/Claude Code Projects/MockInterview/agent"
pip install -e ".[dev]"
python -m pytest tests/test_state_machine.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'state_machine'`

- [ ] **Step 6: Implement state machine**

Create `agent/state_machine.py`:

```python
from enum import Enum


class InterviewPhase(str, Enum):
    INTRO = "INTRO"
    TECHNICAL = "TECHNICAL"
    BEHAVIORAL = "BEHAVIORAL"
    QA = "QA"


_PHASE_ORDER = [
    InterviewPhase.INTRO,
    InterviewPhase.TECHNICAL,
    InterviewPhase.BEHAVIORAL,
    InterviewPhase.QA,
]


class InterviewStateMachine:
    def __init__(self) -> None:
        self._index = 0

    @property
    def current_phase(self) -> InterviewPhase:
        return _PHASE_ORDER[self._index]

    @property
    def is_final_phase(self) -> bool:
        return self._index >= len(_PHASE_ORDER) - 1

    def advance(self) -> InterviewPhase:
        if self._index < len(_PHASE_ORDER) - 1:
            self._index += 1
        return self.current_phase
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd "D:/Claude Code Projects/MockInterview/agent"
python -m pytest tests/test_state_machine.py -v
```

Expected: All 5 tests PASS.

- [ ] **Step 8: Write prompt builder tests**

Create `agent/tests/test_prompts.py`:

```python
from prompts import build_system_prompt, build_phase_instruction


def test_system_prompt_contains_role():
    prompt = build_system_prompt(
        job_role="Frontend Engineer",
        tech_stack=["React", "TypeScript"],
        difficulty="MID",
    )
    assert "Frontend Engineer" in prompt
    assert "React" in prompt
    assert "TypeScript" in prompt


def test_system_prompt_contains_persona():
    prompt = build_system_prompt(
        job_role="Backend Engineer",
        tech_stack=["Go"],
        difficulty="SENIOR",
    )
    assert "interviewer" in prompt.lower()


def test_phase_instruction_intro():
    instruction = build_phase_instruction("INTRO")
    assert "introduce" in instruction.lower() or "自我介绍" in instruction


def test_phase_instruction_technical():
    instruction = build_phase_instruction("TECHNICAL")
    assert "technical" in instruction.lower() or "技术" in instruction
```

- [ ] **Step 9: Run prompt tests to verify they fail**

```bash
python -m pytest tests/test_prompts.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'prompts'`

- [ ] **Step 10: Implement prompt builders**

Create `agent/prompts.py`:

```python
def build_system_prompt(
    job_role: str,
    tech_stack: list[str],
    difficulty: str,
) -> str:
    stack_str = ", ".join(tech_stack)
    difficulty_map = {
        "JUNIOR": "junior-level (0-2 years experience)",
        "MID": "mid-level (2-5 years experience)",
        "SENIOR": "senior-level (5+ years experience)",
    }
    level = difficulty_map.get(difficulty, "mid-level")

    return f"""You are a senior technical interviewer at a top technology company. You are conducting a mock interview for a {level} {job_role} position.

## Your Persona
- Professional, warm, but rigorous
- You probe deeply on weak answers with hints and follow-ups
- You acknowledge strong answers and increase difficulty
- You speak naturally and conversationally in Chinese (Mandarin)
- Keep responses concise — this is a spoken conversation, not a written exam

## Interview Context
- Position: {job_role}
- Tech Stack: {stack_str}
- Level: {level}

## Rules
- Ask ONE question at a time
- Wait for the candidate's full answer before responding
- For weak answers: give a hint, rephrase, or simplify
- For partial answers: probe the specific gap
- For strong answers: increase difficulty or move to the next topic
- Track which topics have been covered to avoid repetition"""


def build_phase_instruction(phase: str) -> str:
    instructions = {
        "INTRO": """Current phase: INTRODUCTION
Introduce yourself briefly as the interviewer. Ask the candidate to give a self-introduction covering their background, experience, and what role they are targeting. Keep this warm and brief (~2 minutes). Then transition to the technical phase.""",
        "TECHNICAL": """Current phase: TECHNICAL QUESTIONS
Ask in-depth technical questions related to the candidate's target role and tech stack. Cover fundamentals, design patterns, and practical scenarios. Ask follow-up questions based on their answers. Spend ~20 minutes here with 4-6 main questions.""",
        "BEHAVIORAL": """Current phase: BEHAVIORAL QUESTIONS
Ask behavioral/situational questions using the STAR method. Topics: teamwork, conflict resolution, technical decision-making, handling pressure. Ask 2-3 questions, ~5 minutes total.""",
        "QA": """Current phase: Q&A (Reverse Interview)
Let the candidate ask YOU questions about the role, team, company, or technical challenges. Answer thoughtfully as an interviewer would. After 2-3 questions or ~3 minutes, wrap up the interview graciously.""",
    }
    return instructions.get(phase, instructions["TECHNICAL"])
```

- [ ] **Step 11: Run prompt tests to verify they pass**

```bash
python -m pytest tests/test_prompts.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 12: Write transcript store tests**

Create `agent/tests/test_transcript_store.py`:

```python
import pytest
from transcript_store import TranscriptStore


def test_add_entry():
    store = TranscriptStore(interview_id="test-123")
    store.add("USER", "Hello, I am a frontend engineer", "INTRO")
    assert len(store.entries) == 1
    assert store.entries[0]["role"] == "USER"
    assert store.entries[0]["phase"] == "INTRO"


def test_multiple_entries():
    store = TranscriptStore(interview_id="test-123")
    store.add("AI", "Welcome! Please introduce yourself.", "INTRO")
    store.add("USER", "I have 3 years of React experience.", "INTRO")
    store.add("AI", "Great. Let's talk about React hooks.", "TECHNICAL")
    assert len(store.entries) == 3


def test_get_conversation_history():
    store = TranscriptStore(interview_id="test-123")
    store.add("AI", "Hello", "INTRO")
    store.add("USER", "Hi there", "INTRO")
    history = store.get_conversation_history()
    assert len(history) == 2
    assert history[0]["role"] == "assistant"
    assert history[1]["role"] == "user"


def test_to_api_payload():
    store = TranscriptStore(interview_id="test-123")
    store.add("AI", "Question 1", "TECHNICAL", question_index=0)
    payload = store.to_api_payload()
    assert payload["entries"][0]["questionIndex"] == 0
```

- [ ] **Step 13: Run transcript tests to verify they fail**

```bash
python -m pytest tests/test_transcript_store.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 14: Implement transcript store**

Create `agent/transcript_store.py`:

```python
from datetime import datetime, timezone
from typing import Any


class TranscriptStore:
    def __init__(self, interview_id: str) -> None:
        self.interview_id = interview_id
        self.entries: list[dict[str, Any]] = []

    def add(
        self,
        role: str,
        content: str,
        phase: str,
        question_index: int | None = None,
    ) -> None:
        self.entries.append(
            {
                "role": role,
                "content": content,
                "phase": phase,
                "startTime": datetime.now(timezone.utc).isoformat(),
                "questionIndex": question_index,
            }
        )

    def get_conversation_history(self) -> list[dict[str, str]]:
        """Returns entries formatted for LLM conversation history."""
        return [
            {
                "role": "assistant" if e["role"] == "AI" else "user",
                "content": e["content"],
            }
            for e in self.entries
        ]

    def to_api_payload(self) -> dict[str, Any]:
        """Returns the payload to send to the Next.js transcript API."""
        return {"entries": self.entries}
```

- [ ] **Step 15: Run all agent tests**

```bash
cd "D:/Claude Code Projects/MockInterview/agent"
python -m pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 16: Create the interview agent**

Create `agent/interview_agent.py`:

```python
import logging
import httpx
from livekit.agents import JobContext
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, elevenlabs, silero

from config import Config
from prompts import build_system_prompt, build_phase_instruction
from state_machine import InterviewStateMachine
from transcript_store import TranscriptStore

logger = logging.getLogger("interview-agent")


async def run_interview_agent(ctx: JobContext) -> None:
    """Main entry point called by LiveKit when a room is created."""
    await ctx.connect()

    # Extract interview config from room metadata (set by Next.js when creating the room)
    room = ctx.room
    metadata = room.metadata or ""
    # Expected metadata format: "jobRole|techStack1,techStack2|difficulty|model|interviewId"
    parts = metadata.split("|")
    if len(parts) < 5:
        logger.error(f"Invalid room metadata: {metadata}")
        return

    job_role, tech_stack_str, difficulty, model, interview_id = parts[:5]
    tech_stack = tech_stack_str.split(",")

    state_machine = InterviewStateMachine()
    transcript_store = TranscriptStore(interview_id=interview_id)

    system_prompt = build_system_prompt(job_role, tech_stack, difficulty)
    phase_instruction = build_phase_instruction(state_machine.current_phase.value)

    initial_instructions = f"{system_prompt}\n\n{phase_instruction}"

    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            api_key=Config.DEEPGRAM_API_KEY,
            model="nova-3",
            language="zh",
        ),
        llm=openai.LLM(
            api_key=Config.OPENAI_API_KEY,
            model=model if model.startswith("gpt") else "gpt-4o-mini",
        ),
        tts=elevenlabs.TTS(
            api_key=Config.ELEVENLABS_API_KEY,
            model_id="eleven_flash_v2_5",
        ),
        chat_ctx=openai.ChatContext().append(
            role="system",
            text=initial_instructions,
        ),
    )

    # Track user speech
    @assistant.on("user_speech_committed")
    def on_user_speech(msg):
        transcript_store.add(
            "USER",
            msg.content,
            state_machine.current_phase.value,
        )

    # Track agent speech
    @assistant.on("agent_speech_committed")
    def on_agent_speech(msg):
        transcript_store.add(
            "AI",
            msg.content,
            state_machine.current_phase.value,
        )

    assistant.start(room)

    # Send initial greeting
    await assistant.say(
        "你好！我是今天的面试官。欢迎参加这次模拟面试。请先做一个简短的自我介绍吧。",
        allow_interruptions=True,
    )

    # Wait for the session to end (user disconnects or room closes)
    await ctx.wait_for_participant_disconnect()

    # Send transcript to Next.js API
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{Config.NEXT_API_URL}/api/interview/{interview_id}/transcript",
                json=transcript_store.to_api_payload(),
                headers={"Authorization": f"Bearer {Config.AGENT_API_SECRET}"},
                timeout=30,
            )
            logger.info(f"Transcript sent for interview {interview_id}")
    except Exception as e:
        logger.error(f"Failed to send transcript: {e}")
```

- [ ] **Step 17: Create agent entrypoint**

Create `agent/main.py`:

```python
import logging
from livekit.agents import WorkerOptions, cli

from config import Config
from interview_agent import run_interview_agent

logging.basicConfig(level=logging.INFO)


def main():
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=run_interview_agent,
            api_key=Config.LIVEKIT_API_KEY,
            api_secret=Config.LIVEKIT_API_SECRET,
            ws_url=Config.LIVEKIT_URL,
        )
    )


if __name__ == "__main__":
    main()
```

- [ ] **Step 18: Commit**

```bash
cd "D:/Claude Code Projects/MockInterview"
git add agent/
git commit -m "feat: add Python voice agent with LiveKit, Deepgram, OpenAI, ElevenLabs"
```

---

### Task 10: App Layout & Sidebar

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/layout/app-sidebar.tsx`, `src/components/layout/header.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/layout/app-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Mic, History, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview/new", label: "New Interview", icon: Mic },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r bg-muted/40 md:block">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-semibold">
          MockInterview
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create header component**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-sm text-muted-foreground">
            {session?.user?.email}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

- [ ] **Step 3: Create authenticated app layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/layout.tsx src/components/layout/
git commit -m "feat: add authenticated app layout with sidebar and header"
```

---

### Task 11: Dashboard Page

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/recent-interviews.tsx`, `src/components/dashboard/quick-start.tsx`

- [ ] **Step 1: Create quick start component**

Create `src/components/dashboard/quick-start.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";

export function QuickStart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Start a Mock Interview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Practice your technical interview skills with our AI interviewer.
        </p>
        <Button asChild>
          <Link href="/interview/new">
            <Mic className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create recent interviews component**

Create `src/components/dashboard/recent-interviews.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function RecentInterviews() {
  const { data: interviews, isLoading } = trpc.interview.list.useQuery();

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const recent = interviews?.slice(0, 5) ?? [];

  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No interviews yet. Start your first one!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Interviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recent.map((interview) => (
          <Link
            key={interview.id}
            href={
              interview.status === "COMPLETED"
                ? `/interview/${interview.id}/report`
                : `/interview/${interview.id}`
            }
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="font-medium text-sm">{interview.jobRole}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(interview.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {interview.report?.overallScore != null && (
                <Badge variant="secondary">{interview.report.overallScore}/100</Badge>
              )}
              <Badge
                variant={interview.status === "COMPLETED" ? "default" : "outline"}
              >
                {interview.status === "COMPLETED" ? "Completed" : interview.status}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Install date-fns**

```bash
npm install date-fns
```

- [ ] **Step 4: Create dashboard page**

Create `src/app/(app)/dashboard/page.tsx`:

```tsx
import { QuickStart } from "@/components/dashboard/quick-start";
import { RecentInterviews } from "@/components/dashboard/recent-interviews";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <QuickStart />
        <RecentInterviews />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/dashboard/ src/components/dashboard/ package.json package-lock.json
git commit -m "feat: add dashboard page with quick start and recent interviews"
```

---

### Task 12: Interview Setup Page

**Files:**
- Create: `src/components/interview/interview-setup-form.tsx`, `src/app/(app)/interview/new/page.tsx`

- [ ] **Step 1: Create interview setup form**

Create `src/components/interview/interview-setup-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc-client";
import {
  JOB_ROLES,
  TECH_STACKS,
  DIFFICULTY_OPTIONS,
  MODEL_OPTIONS,
} from "@/lib/interview-config";
import { cn } from "@/lib/utils";

export function InterviewSetupForm() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState("");
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"JUNIOR" | "MID" | "SENIOR">("MID");
  const [model, setModel] = useState("gpt-4o-mini");

  const createInterview = trpc.interview.create.useMutation({
    onSuccess: (data) => {
      router.push(`/interview/${data.interviewId}`);
    },
  });

  const availableTech = jobRole ? TECH_STACKS[jobRole] ?? [] : [];

  function toggleTech(tech: string) {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  }

  function handleStart() {
    if (!jobRole || selectedTech.length === 0) return;
    const roleLabel = JOB_ROLES.find((r) => r.value === jobRole)?.label ?? jobRole;
    createInterview.mutate({
      jobRole: roleLabel,
      techStack: selectedTech,
      difficulty,
      model,
    });
  }

  return (
    <div className="space-y-6">
      {/* Job Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Select Job Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {JOB_ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  setJobRole(role.value);
                  setSelectedTech([]);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                  jobRole === role.value
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted"
                )}
              >
                <span className="text-2xl">{role.icon}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      {jobRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Select Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTech.map((tech) => (
                <Badge
                  key={tech}
                  variant={selectedTech.includes(tech) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTech(tech)}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty */}
      {selectedTech.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Difficulty Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    difficulty === opt.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Selection */}
      {selectedTech.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. AI Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setModel(opt.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    model === opt.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Button */}
      {selectedTech.length > 0 && (
        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={createInterview.isPending}
        >
          {createInterview.isPending ? "Creating interview..." : "Start Interview"}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create interview setup page**

Create `src/app/(app)/interview/new/page.tsx`:

```tsx
import { InterviewSetupForm } from "@/components/interview/interview-setup-form";

export default function NewInterviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Mock Interview</h1>
      <p className="text-muted-foreground">
        Configure your interview and start practicing with our AI interviewer.
      </p>
      <InterviewSetupForm />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/interview/interview-setup-form.tsx src/app/\(app\)/interview/new/
git commit -m "feat: add interview setup page with role, stack, difficulty, model selection"
```

---

### Task 13: Interview Room Page (LiveKit)

**Files:**
- Create: `src/components/interview/interview-room.tsx`, `src/components/interview/interview-timer.tsx`, `src/components/interview/audio-visualizer.tsx`, `src/components/interview/transcript-panel.tsx`, `src/app/(app)/interview/[id]/page.tsx`

- [ ] **Step 1: Create interview timer**

Create `src/components/interview/interview-timer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function InterviewTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="font-mono text-lg tabular-nums">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}
```

- [ ] **Step 2: Create audio visualizer placeholder**

Create `src/components/interview/audio-visualizer.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

export function AudioVisualizer({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bars = 40;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = isActive
          ? Math.random() * canvas.height * 0.8 + canvas.height * 0.1
          : canvas.height * 0.05;

        ctx.fillStyle = isActive ? "hsl(221.2, 83.2%, 53.3%)" : "hsl(215.4, 16.3%, 46.9%)";
        ctx.fillRect(
          i * barWidth + 1,
          (canvas.height - height) / 2,
          barWidth - 2,
          height
        );
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full max-w-md rounded-lg"
    />
  );
}
```

- [ ] **Step 3: Create transcript panel**

Create `src/components/interview/transcript-panel.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TranscriptEntry {
  role: "user" | "ai";
  content: string;
}

export function TranscriptPanel({ entries }: { entries: TranscriptEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  return (
    <div ref={scrollRef} className="h-64 overflow-y-auto rounded-lg border p-4 space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Transcript will appear here during the interview...
        </p>
      )}
      {entries.map((entry, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg p-3 text-sm",
            entry.role === "ai"
              ? "bg-muted text-foreground"
              : "bg-primary/10 text-foreground"
          )}
        >
          <span className="font-medium text-xs text-muted-foreground">
            {entry.role === "ai" ? "Interviewer" : "You"}
          </span>
          <p className="mt-1">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create interview room component**

Create `src/components/interview/interview-room.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewTimer } from "./interview-timer";
import { TranscriptPanel } from "./transcript-panel";
import { trpc } from "@/lib/trpc-client";
import { PhoneOff } from "lucide-react";

interface InterviewRoomProps {
  interviewId: string;
  token: string;
  wsUrl: string;
}

function InterviewControls({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { state, audioTrack } = useVoiceAssistant();
  const [startedAt] = useState(new Date());
  const [transcriptEntries, setTranscriptEntries] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);

  const completeInterview = trpc.interview.complete.useMutation();

  const handleDisconnect = useCallback(async () => {
    const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    await completeInterview.mutateAsync({ interviewId, durationSeconds });
    router.push(`/interview/${interviewId}/report`);
  }, [interviewId, startedAt, completeInterview, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <InterviewTimer startedAt={startedAt} />
          <span className="text-sm text-muted-foreground capitalize">
            Status: {state}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
          <PhoneOff className="mr-2 h-4 w-4" />
          End Interview
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center p-8">
          {audioTrack && (
            <BarVisualizer
              state={state}
              barCount={30}
              trackRef={audioTrack}
              className="h-20 w-full max-w-md"
            />
          )}
          {!audioTrack && (
            <p className="text-sm text-muted-foreground">Connecting to interviewer...</p>
          )}
        </CardContent>
      </Card>

      <TranscriptPanel entries={transcriptEntries} />
      <RoomAudioRenderer />
    </div>
  );
}

export function InterviewRoom({ interviewId, token, wsUrl }: InterviewRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={true}
      video={false}
    >
      <InterviewControls interviewId={interviewId} />
    </LiveKitRoom>
  );
}
```

- [ ] **Step 5: Create interview room page**

Create `src/app/(app)/interview/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc-client";
import { InterviewRoom } from "@/components/interview/interview-room";

export default function InterviewRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = trpc.interview.getToken.useQuery({
    interviewId: id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Connecting to interview room...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive">Failed to connect: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <InterviewRoom
        interviewId={id}
        token={data.token}
        wsUrl={data.wsUrl}
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/interview/ src/app/\(app\)/interview/\[id\]/page.tsx
git commit -m "feat: add interview room page with LiveKit voice, timer, and transcript"
```

---

### Task 14: Report Page

**Files:**
- Create: `src/components/report/report-summary.tsx`, `src/components/report/question-scores.tsx`, `src/components/report/strengths-weaknesses.tsx`, `src/app/(app)/interview/[id]/report/page.tsx`

- [ ] **Step 1: Create report summary component**

Create `src/components/report/report-summary.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportSummaryProps {
  overallScore: number;
  summary: string;
  jobRole: string;
  difficulty: string;
  durationSeconds: number | null;
  createdAt: string;
}

export function ReportSummary({
  overallScore,
  summary,
  jobRole,
  difficulty,
  durationSeconds,
  createdAt,
}: ReportSummaryProps) {
  const scoreColor =
    overallScore >= 80
      ? "text-green-500"
      : overallScore >= 60
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Interview Report</span>
          <span className={`text-4xl font-bold ${scoreColor}`}>
            {overallScore}
            <span className="text-lg text-muted-foreground">/100</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Role: {jobRole}</span>
          <span>Difficulty: {difficulty}</span>
          {durationSeconds && (
            <span>Duration: {Math.round(durationSeconds / 60)} min</span>
          )}
        </div>
        <p className="text-sm">{summary}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create strengths/weaknesses component**

Create `src/components/report/strengths-weaknesses.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export function StrengthsWeaknesses({ strengths, weaknesses }: StrengthsWeaknessesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-green-500">
            <CheckCircle className="h-5 w-5" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm">
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-500">
            <XCircle className="h-5 w-5" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm">
                {w}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create question scores component**

Create `src/components/report/question-scores.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionScore {
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  phase: string;
}

export function QuestionScores({ scores }: { scores: QuestionScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Question Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scores.map((q, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {q.phase}
              </Badge>
              <span className="text-sm font-medium">
                {q.score}/{q.maxScore}
              </span>
            </div>
            <p className="text-sm font-medium">{q.question}</p>
            <p className="text-sm text-muted-foreground">{q.feedback}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create report page**

Create `src/app/(app)/interview/[id]/report/page.tsx`:

```tsx
"use client";

import { use, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { ReportSummary } from "@/components/report/report-summary";
import { StrengthsWeaknesses } from "@/components/report/strengths-weaknesses";
import { QuestionScores } from "@/components/report/question-scores";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Trigger report generation on page load
  const generateReport = trpc.report.generate.useMutation();
  const { data: report, isLoading, error, refetch } = trpc.report.getByInterviewId.useQuery(
    { interviewId: id },
    { retry: false, enabled: false }
  );

  useEffect(() => {
    generateReport.mutateAsync({ interviewId: id }).then(() => refetch());
  }, [id]);

  if (generateReport.isPending || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Generating your interview report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive">
          {error?.message ?? "Report not available yet. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ReportSummary
        overallScore={report.overallScore}
        summary={report.summary}
        jobRole={report.interview.jobRole}
        difficulty={report.interview.difficulty}
        durationSeconds={report.interview.durationSeconds}
        createdAt={report.interview.createdAt.toString()}
      />
      <StrengthsWeaknesses
        strengths={report.strengths as string[]}
        weaknesses={report.weaknesses as string[]}
      />
      <QuestionScores scores={report.questionScores as any[]} />

      {report.improvementSuggestions.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-medium">Improvement Suggestions</h3>
          <ul className="space-y-2">
            {report.improvementSuggestions.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {i + 1}. {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ src/app/\(app\)/interview/\[id\]/report/
git commit -m "feat: add interview report page with score, strengths, question breakdown"
```

---

### Task 15: Interview History Page

**Files:**
- Create: `src/components/history/interview-list.tsx`, `src/app/(app)/history/page.tsx`

- [ ] **Step 1: Create interview list component**

Create `src/components/history/interview-list.tsx`:

```tsx
"use client";

import { trpc } from "@/lib/trpc-client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function InterviewList() {
  const { data: interviews, isLoading } = trpc.interview.list.useQuery();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  if (!interviews || interviews.length === 0) {
    return <p className="text-muted-foreground">No interviews yet.</p>;
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => (
        <Link
          key={interview.id}
          href={
            interview.status === "COMPLETED"
              ? `/interview/${interview.id}/report`
              : `/interview/${interview.id}`
          }
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="space-y-1">
            <p className="font-medium">{interview.jobRole}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{interview.techStack.join(", ")}</span>
              <span>|</span>
              <span>{interview.difficulty}</span>
              <span>|</span>
              <span>
                {format(new Date(interview.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {interview.report?.overallScore != null && (
              <span className="text-lg font-bold">
                {interview.report.overallScore}
                <span className="text-xs text-muted-foreground">/100</span>
              </span>
            )}
            <Badge
              variant={interview.status === "COMPLETED" ? "default" : "secondary"}
            >
              {interview.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create history page**

Create `src/app/(app)/history/page.tsx`:

```tsx
import { InterviewList } from "@/components/history/interview-list";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Interview History</h1>
      <InterviewList />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/history/ src/app/\(app\)/history/
git commit -m "feat: add interview history page with filterable interview list"
```

---

### Task 16: Settings Page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create settings page**

Create `src/app/(app)/settings/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import { MODEL_OPTIONS } from "@/lib/interview-config";

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateSettings = trpc.user.updateSettings.useMutation();

  const [name, setName] = useState("");
  const [preferredModel, setPreferredModel] = useState("gpt-4o-mini");
  const [preferredLanguage, setPreferredLanguage] = useState<"zh" | "en">("zh");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferredModel(user.preferredModel);
      setPreferredLanguage(user.preferredLanguage as "zh" | "en");
    }
  }, [user]);

  function handleSave() {
    updateSettings.mutate({ name, preferredModel, preferredLanguage });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default AI Model</Label>
            <div className="grid grid-cols-3 gap-3">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreferredModel(opt.value)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    preferredModel === opt.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <div className="flex gap-3">
              {[
                { value: "zh" as const, label: "中文" },
                { value: "en" as const, label: "English" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setPreferredLanguage(lang.value)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    preferredLanguage === lang.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving..." : "Save Settings"}
      </Button>
      {updateSettings.isSuccess && (
        <p className="text-sm text-green-500">Settings saved!</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/settings/
git commit -m "feat: add settings page with profile and preferences"
```

---

### Task 17: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, BarChart3, Brain, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-xl font-bold">MockInterview</span>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">
          AI Voice Mock Interview
          <br />
          <span className="text-primary">for Technical Positions</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Practice technical interviews with an AI interviewer that adapts to your
          level. Get real-time follow-ups, comprehensive reports, and track your
          improvement over time.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/register">
            Start Practicing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <div className="text-center space-y-3">
            <Mic className="mx-auto h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold">Voice Conversation</h3>
            <p className="text-sm text-muted-foreground">
              Real-time voice interview that feels like talking to a real interviewer.
            </p>
          </div>
          <div className="text-center space-y-3">
            <Brain className="mx-auto h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold">Adaptive AI</h3>
            <p className="text-sm text-muted-foreground">
              The AI adjusts difficulty based on your answers and probes your weak spots.
            </p>
          </div>
          <div className="text-center space-y-3">
            <BarChart3 className="mx-auto h-10 w-10 text-primary" />
            <h3 className="text-lg font-semibold">Detailed Reports</h3>
            <p className="text-sm text-muted-foreground">
              Per-question scoring, knowledge point analysis, and improvement tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        MockInterview - AI Mock Interview for Technical Positions
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with hero, features, and CTA"
```

---

### Task 18: LiveKit Room Metadata + Agent Dispatch

**Files:**
- Modify: `src/server/api/routers/interview.ts` (update `create` mutation), `src/lib/livekit.ts`

The Python agent reads room metadata to know the interview configuration. We need to set this metadata when creating the room.

- [ ] **Step 1: Update LiveKit helpers to set room metadata**

Update `src/lib/livekit.ts` — replace the `createInterviewRoom` function:

```typescript
export async function createInterviewRoom(
  roomName: string,
  metadata: string
): Promise<void> {
  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 300,
    maxParticipants: 2,
    metadata, // "jobRole|techStack1,techStack2|difficulty|model|interviewId"
  });
}
```

- [ ] **Step 2: Update interview create mutation to pass metadata**

In `src/server/api/routers/interview.ts`, update the `create` mutation — replace the `createInterviewRoom` call:

```typescript
const roomName = `interview-${interview.id}`;
const metadata = [
  input.jobRole,
  input.techStack.join(","),
  input.difficulty,
  input.model,
  interview.id,
].join("|");

await createInterviewRoom(roomName, metadata);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/livekit.ts src/server/api/routers/interview.ts
git commit -m "feat: pass interview config as LiveKit room metadata for agent dispatch"
```

---

### Task 19: End-to-End Verification

- [ ] **Step 1: Verify Next.js builds**

```bash
cd "D:/Claude Code Projects/MockInterview"
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify Python agent tests pass**

```bash
cd "D:/Claude Code Projects/MockInterview/agent"
python -m pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 3: Verify database schema**

```bash
cd "D:/Claude Code Projects/MockInterview"
npx prisma validate
```

Expected: `Prisma schema is valid`.

- [ ] **Step 4: Manual smoke test checklist**

Start the dev server (`npm run dev`) and verify:

1. Landing page renders at `/`
2. Register page at `/register` creates a user
3. Login at `/login` authenticates and redirects to `/dashboard`
4. Dashboard shows quick start CTA and empty recent interviews
5. `/interview/new` shows role selection, tech stack, difficulty, model
6. `/history` shows empty list
7. `/settings` loads user preferences

(LiveKit voice pipeline requires LiveKit Cloud + Python agent running — test separately with real API keys.)

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build/lint issues from end-to-end verification"
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1 | Next.js project scaffold | 10 min |
| 2 | Prisma schema + database | 15 min |
| 3 | tRPC setup | 20 min |
| 4 | Authentication (NextAuth) | 25 min |
| 5 | Interview config & types | 10 min |
| 6 | LiveKit helpers + interview create API | 15 min |
| 7 | Transcript ingestion API | 10 min |
| 8 | Report generation | 20 min |
| 9 | Python voice agent | 40 min |
| 10 | App layout & sidebar | 15 min |
| 11 | Dashboard page | 15 min |
| 12 | Interview setup page | 20 min |
| 13 | Interview room page (LiveKit) | 30 min |
| 14 | Report page | 20 min |
| 15 | Interview history page | 10 min |
| 16 | Settings page | 10 min |
| 17 | Landing page | 10 min |
| 18 | Room metadata + agent dispatch | 10 min |
| 19 | End-to-end verification | 15 min |
