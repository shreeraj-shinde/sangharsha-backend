import { Router } from "express";
import authRouter from "./auth.routes";
import verifyRouter from "./verify.routes";

const router = Router();

router.get("/api/health", (req, res) => {
  res.send("Hello World with TypeScript!");
});

router.use("/api", authRouter);
router.use("/api", verifyRouter);

export default router;
