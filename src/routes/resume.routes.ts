import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { uploadResume } from "../controllers/resume.controllers";
import logger from "../logger";

const resumeRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

resumeRouter.post(
  "/resume/upload",
  authenticate,
  upload.single("resume"),
  (req, res) => {
    logger.info("POST /resume/upload");
    uploadResume(req, res);
  },
);

export default resumeRouter;
