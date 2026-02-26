import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import logger from "../../logger";

/**
 * Detects the file type based on MIME type.
 */
export function detectFileType(
  mimeType: string,
): "pdf" | "docx" | "txt" | "unknown" {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return "docx";
  }
  if (mimeType === "text/plain") return "txt";
  return "unknown";
}

/**
 * Extracts text from a file buffer based on its detected type.
 */
export async function extractText(buffer: Buffer, fileType: string) {
  try {
    // Convert Buffer to Uint8Array as some libraries (like newer pdf-parse or mammoth) may prefer it
    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.length,
    );

    switch (fileType) {
      case "pdf":
        const pdfData = new PDFParse(uint8Array);
        return await pdfData.getText();
      case "docx":
        const docxData = await mammoth.extractRawText({
          buffer: uint8Array as Buffer<ArrayBufferLike>,
        });
        return docxData.value;
      case "txt":
        return buffer.toString("utf-8");
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    logger.error(
      `[Extractor Service] Text extraction failed: ${error instanceof Error ? error.message : error}`,
    );
    throw new Error("Failed to extract text from file");
  }
}

/**
 * Cleans extracted text by normalizing whitespace and removing noisy characters.
 */
export function cleanText(text: string): string {
  if (!text) return "";

  return (
    text
      // Replace multiple spaces with a single space
      .replace(/[ \t]+/g, " ")
      // Replace multiple newlines with a double newline (preserving paragraph intent)
      .replace(/\n\s*\n/g, "\n\n")
      // Remove non-printable/control characters (except newline and tab)
      .replace(/[^\x20-\x7E\n\t]/g, "")
      // Trim leading/trailing whitespace
      .trim()
  );
}
