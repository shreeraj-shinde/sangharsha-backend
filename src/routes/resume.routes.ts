import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { uploadResume } from "../controllers/resume.controllers";
import logger from "../logger";

const resumeRouter = Router();

resumeRouter.post("/resume/upload", authenticate, (req, res) => {
  logger.info("POST /resume/upload");
  uploadResume(req, res);
});

export default resumeRouter;
