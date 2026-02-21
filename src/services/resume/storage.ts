import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import logger from "../../logger";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface StorageResult {
  fileUrl: string;
  storageKey?: string;
  storageBucket?: string;
  localPath?: string;
}

/**
 * Stores a file either locally or on Cloudinary based on STORAGE_MODE.
 */
export async function storeFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
): Promise<StorageResult> {
  const storageMode = process.env.STORAGE_MODE || "local";

  if (storageMode === "cloudinary") {
    return uploadToCloudinary(buffer, fileName, userId);
  } else {
    return storeLocally(buffer, fileName, userId);
  }
}

/**
 * Uploads a buffer to Cloudinary using streams.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  userId: string,
): Promise<StorageResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `resumes/${userId}`,
        public_id: `${Date.now()}-${path.parse(fileName).name}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error(
            `[Storage Service] Cloudinary upload failed: ${error.message}`,
          );
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload failed: No result"));
        }

        resolve({
          fileUrl: result.secure_url,
          storageKey: result.public_id,
          storageBucket: "cloudinary", // Using "cloudinary" as a placeholder for bucket
        });
      },
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Stores a file on the local filesystem.
 */
async function storeLocally(
  buffer: Buffer,
  fileName: string,
  userId: string,
): Promise<StorageResult> {
  const uploadsDir = path.join(process.cwd(), "uploads", userId);
  const safeFileName = `${Date.now()}-${fileName.replace(/[^a-z0-9.]/gi, "_")}`;
  const filePath = path.join(uploadsDir, safeFileName);

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // For local storage, we return the relative path as the fileUrl
    // In a real app, this might be a static served URL
    return {
      fileUrl: filePath,
      localPath: filePath,
    };
  } catch (error) {
    logger.error(
      `[Storage Service] Local storage failed: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }
}
