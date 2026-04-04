import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { db } from "@/server/db";
import { createInterviewRoom, generateUserToken } from "@/lib/livekit";

export const interviewRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.interview.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        report: {
          select: { overallScore: true },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const interview = await db.interview.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          transcripts: true,
          report: true,
        },
      });

      if (!interview) {
        throw new Error("Interview not found");
      }

      return interview;
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobRole: z.string(),
        techStack: z.array(z.string()),
        difficulty: z.enum(["JUNIOR", "MID", "SENIOR"]),
        model: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const interview = await db.interview.create({
        data: {
          userId: ctx.session.user.id,
          jobRole: input.jobRole,
          techStack: input.techStack,
          difficulty: input.difficulty,
          modelUsed: input.model,
        },
      });

      const roomName = `interview-${interview.id}`;
      const metadata = [
        input.jobRole,
        input.techStack.join(","),
        input.difficulty,
        input.model,
        interview.id,
      ].join("|");

      await createInterviewRoom(roomName, metadata);

      await db.interview.update({
        where: { id: interview.id },
        data: { livekitRoomId: roomName },
      });

      return { interviewId: interview.id, roomName };
    }),

  getToken: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const interview = await db.interview.findFirst({
        where: {
          id: input.interviewId,
          userId: ctx.session.user.id,
        },
      });

      if (!interview || !interview.livekitRoomId) {
        throw new Error("Interview not found");
      }

      const token = await generateUserToken(
        interview.livekitRoomId,
        ctx.session.user.id,
        ctx.session.user.name ?? "User"
      );

      return {
        token,
        roomName: interview.livekitRoomId,
        wsUrl: process.env.LIVEKIT_URL!,
      };
    }),

  complete: protectedProcedure
    .input(
      z.object({
        interviewId: z.string().uuid(),
        durationSeconds: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const interview = await db.interview.findFirst({
        where: {
          id: input.interviewId,
          userId: ctx.session.user.id,
          status: "IN_PROGRESS",
        },
      });

      if (!interview) {
        throw new Error("Interview not found or already completed");
      }

      return db.interview.update({
        where: { id: interview.id },
        data: {
          status: "COMPLETED",
          durationSeconds: input.durationSeconds,
          completedAt: new Date(),
        },
      });
    }),
});
