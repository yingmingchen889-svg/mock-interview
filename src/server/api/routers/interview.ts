import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { db } from "@/server/db";

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
});
