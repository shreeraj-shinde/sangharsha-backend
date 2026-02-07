import { Router } from "express";
import authRouter from "./auth.routes";

const router = Router();

router.get("/api/health", (req, res) => {
  res.send("Hello World with TypeScript!");
});

router.use("/api", authRouter);

export default router;
