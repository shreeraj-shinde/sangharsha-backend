import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { storeFile } from "../services/resume/storage";
import {
  detectFileType,
  extractText,
  cleanText,
} from "../services/resume/extractor";
import { segmentText } from "../services/resume/segmenter";
import { normalizeSections } from "../services/resume/normalizer";
import prisma from "../prisma";
import logger from "../logger";
import { Prisma } from "@prisma/client";

export const uploadResume = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.id;
    const file = req.file;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    logger.info(
      `[Resume Controller] Uploading resume for user: ${userId}, file: ${file.originalname}`,
    );

    // 1. Detect file type
    const fileType = detectFileType(file.mimetype);
    if (fileType === "unknown") {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported file type" });
    }

    // 2. Store file
    const storageResult = await storeFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      userId,
    );

    // 3. Extract and Clean Text
    const rawResult = await extractText(file.buffer, fileType);
    const rawText = typeof rawResult === "string" ? rawResult : rawResult.text;
    const cleanedText = cleanText(rawText);

    // 4. Segment Text
    const sections = segmentText(cleanedText);

    // 5. Normalize Sections
    const normalizedResume = normalizeSections(sections);

    logger.info(`[Resume Controller] Normalized resume for user: ${userId}`);

    // 6. Create/Update Resume Record in DB
    // const resume = await prisma.resume.upsert({
    //   where: { userId },
    //   update: {
    //     fileName: file.originalname,
    //     fileSize: file.size,
    //     fileMimeType: file.mimetype,
    //     fileUrl: storageResult.fileUrl,
    //     storageKey: storageResult.storageKey,
    //     storageBucket: storageResult.storageBucket,
    //     rawText: cleanedText,
    //     processingStatus: "COMPLETED",
    //     processedAt: new Date(),
    //     parsedData: normalizedResume as any,
    //   },
    //   create: {
    //     userId,
    //     fileName: file.originalname,
    //     fileSize: file.size,
    //     fileMimeType: file.mimetype,
    //     fileUrl: storageResult.fileUrl,
    //     storageKey: storageResult.storageKey,
    //     storageBucket: storageResult.storageBucket,
    //     rawText: cleanedText,
    //     processingStatus: "COMPLETED",
    //     processedAt: new Date(),
    //     parsedData: normalizedResume as any,
    //   },
    // });

    console.log("normalizedResume", JSON.stringify(normalizedResume, null, 2));

    return res.status(200).json({
      success: true,
      message: "Resume uploaded and processed successfully",
      // resume: {
      //   id: resume.id,
      //   fileName: resume.fileName,
      //   processingStatus: resume.processingStatus,
      //   normalized: normalizedResume,
      // },
    });
  } catch (error) {
    logger.error(
      `[Resume Controller] Resume upload failed: ${error instanceof Error ? error.message : error}`,
    );
    return res.status(500).json({
      success: false,
      message: "Failed to upload and process resume",
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
