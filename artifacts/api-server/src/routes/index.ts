import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import creatorsRouter from "./creators";
import tracksRouter from "./tracks";
import exploreRouter from "./explore";
import dashboardRouter from "./dashboard";
import interactionsRouter from "./interactions";
import fanEmailsRouter from "./fan-emails";
import reportsRouter from "./reports";
import waitlistRouter from "./waitlist";
import uploadRouter from "./upload";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/creators", creatorsRouter);
router.use("/tracks", tracksRouter);
router.use("/explore", exploreRouter);
router.use("/dashboard", dashboardRouter);
router.use(interactionsRouter);
router.use("/fan-emails", fanEmailsRouter);
router.use("/reports", reportsRouter);
router.use("/waitlist", waitlistRouter);
router.use("/upload", uploadRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationsRouter);
router.use("/analytics", analyticsRouter);

export default router;
