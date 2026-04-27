import { Router } from "express";
import healthRouter from "./health.js";
import walletRouter from "./wallet.js";

const router = Router();

router.use(healthRouter);
router.use(walletRouter);

export default router;
