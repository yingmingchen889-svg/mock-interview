import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";
import { db } from "@/server/db";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
    });
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        preferredModel: z.string().optional(),
        preferredLanguage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),
});
