import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { db } from "@/server/db";
import { generateReport } from "@/lib/report-generator";
import type { Difficulty, InterviewPhase } from "@/types/interview";

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

  generate: protectedProcedure
    .input(z.object({ interviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const interview = await db.interview.findFirst({
        where: {
          id: input.interviewId,
          userId: ctx.session.user.id,
        },
        include: {
          transcripts: {
            orderBy: { startTime: "asc" },
          },
          report: true,
        },
      });

      if (!interview) {
        throw new Error("Interview not found");
      }

      // Return existing report if already generated
      if (interview.report) {
        return interview.report;
      }

      if (interview.transcripts.length === 0) {
        throw new Error("No transcripts found for this interview");
      }

      const transcriptEntries = interview.transcripts.map((t) => ({
        role: t.role as string,
        content: t.content,
        phase: t.phase as InterviewPhase,
        questionIndex: t.questionIndex,
      }));

      const reportData = await generateReport(
        interview.jobRole,
        interview.techStack,
        interview.difficulty as Difficulty,
        transcriptEntries,
        interview.modelUsed
      );

      const report = await db.report.create({
        data: {
          interviewId: interview.id,
          overallScore: Math.round(reportData.overallScore),
          summary: reportData.summary,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          questionScores: JSON.parse(JSON.stringify(reportData.questionScores)),
          knowledgePoints: JSON.parse(JSON.stringify(reportData.knowledgePoints)),
          improvementSuggestions: reportData.improvementSuggestions,
        },
      });

      return report;
    }),
});
