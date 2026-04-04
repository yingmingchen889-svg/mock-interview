import { router } from "@/server/trpc";
import { interviewRouter } from "./routers/interview";
import { reportRouter } from "./routers/report";
import { userRouter } from "./routers/user";

export const appRouter = router({
  interview: interviewRouter,
  report: reportRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
