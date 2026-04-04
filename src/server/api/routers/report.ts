import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { db } from "@/server/db";

export const reportRouter = router({
  getByInterviewId: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const report = await db.report.findUnique({
        where: { interviewId: input.interviewId },
        include: {
          interview: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!report || report.interview.userId !== ctx.session.user.id) {
        throw new Error("Report not found");
      }

      return report;
    }),
});
