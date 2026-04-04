import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const transcriptEntrySchema = z.object({
  role: z.enum(["USER", "AI"]),
  content: z.string(),
  phase: z.enum(["INTRO", "TECHNICAL", "BEHAVIORAL", "QA"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  questionIndex: z.number().int().optional(),
});

const requestBodySchema = z.object({
  entries: z.array(transcriptEntrySchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: interviewId } = await params;

  // Auth via shared secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.AGENT_API_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate interview exists
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Create transcript records
  const data = parsed.data.entries.map((entry) => ({
    interviewId,
    role: entry.role as "USER" | "AI",
    content: entry.content,
    phase: entry.phase as "INTRO" | "TECHNICAL" | "BEHAVIORAL" | "QA",
    startTime: new Date(entry.startTime),
    endTime: entry.endTime ? new Date(entry.endTime) : null,
    questionIndex: entry.questionIndex ?? null,
  }));

  const result = await db.transcript.createMany({ data });

  return NextResponse.json(
    { created: result.count },
    { status: 201 }
  );
}
