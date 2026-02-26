export type SectionType =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "other";

export interface Section {
  type: SectionType;
  header: string;
  content: string;
}

const SECTION_HEADERS: Record<SectionType, RegExp[]> = {
  contact: [
    /^contact\s*$/i,
    /^personal info\s*$/i,
    /^contact information\s*$/i,
  ],
  summary: [
    /^summary\s*$/i,
    /^(professional\s+)?summary\s*$/i,
    /^objective\s*$/i,
    /^about me\s*$/i,
    /^profile\s*$/i,
  ],
  experience: [
    /^experience\s*$/i,
    /^work history\s*$/i,
    /^employment\s*$/i,
    /^professional experience\s*$/i,
    /^work experience\s*$/i,
  ],
  education: [
    /^education\s*$/i,
    /^academic background\s*$/i,
    /^academic history\s*$/i,
  ],
  skills: [
    /^skills\s*$/i,
    /^technical skills\s*$/i,
    /^core competencies\s*$/i,
    /^expertise\s*$/i,
    /^technologies\s*$/i,
  ],
  projects: [
    /^projects\s*$/i,
    /^key projects\s*$/i,
    /^personal projects\s*$/i,
    /^academic projects\s*$/i,
  ],
  certifications: [
    /^certifications\s*$/i,
    /^licenses\s*$/i,
    /^awards\s*$/i,
    /^achievements\s*$/i,
  ],
  other: [],
};

/**
 * Segments the cleaned text into logical sections based on headers.
 */
export function segmentText(text: string): Section[] {
  const lines = text.split("\n");
  const rawSections: Section[] = [];
  let currentSection: Section = { type: "other", header: "", content: "" };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if the line is a potential header
    const detectedType = detectSectionHeader(trimmedLine);

    if (detectedType) {
      // If we found a new section, save the current one and start a new one
      if (currentSection.content || currentSection.header) {
        rawSections.push({
          ...currentSection,
          content: currentSection.content.trim(),
        });
      }
      currentSection = { type: detectedType, header: trimmedLine, content: "" };
    } else {
      // Otherwise, add the line to the current section
      currentSection.content += line + "\n";
    }
  }

  // Push the last section
  if (currentSection.content || currentSection.header) {
    rawSections.push({
      ...currentSection,
      content: currentSection.content.trim(),
    });
  }

  // Post-process: Merge sections of the same type if they are adjacent
  const sections = mergeAdjacentSections(rawSections);

  // If no sections were found (very short text or unusual formatting),
  // treat everything as "other"
  if (sections.length === 0 && text.trim()) {
    sections.push({ type: "other", header: "", content: text.trim() });
  }

  return sections;
}

/**
 * Merges adjacent sections of the same type.
 */
function mergeAdjacentSections(sections: Section[]): Section[] {
  if (sections.length <= 1) return sections;

  const merged: Section[] = [];
  let current = { ...sections[0] };

  for (let i = 1; i < sections.length; i++) {
    const next = sections[i];
    if (next.type === current.type && next.type !== "other") {
      // Merge content
      current.content +=
        "\n\n" + (next.header ? next.header + "\n" : "") + next.content;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Detects if a line is likely a section header.
 */
function detectSectionHeader(line: string): SectionType | null {
  // Clean the line for testing (remove trailing colons/dots)
  const cleanLine = line.replace(/[:.]+$/, "").trim();

  // Section headers are usually short
  if (cleanLine.length > 40) return null;

  // Check if it's all symbols or mostly numbers (unlikely to be a header)
  if (/^[0-9\W_]+$/.test(cleanLine)) return null;

  // Most headers are either ALL CAPS or Title Case
  const isAllCaps =
    cleanLine === cleanLine.toUpperCase() && /[A-Z]/.test(cleanLine);
  const isTitleCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(cleanLine);

  // If it's not All Caps or Title Case, it's less likely to be a standalone header
  // unless it's very short (like "Skills")
  if (!isAllCaps && !isTitleCase && cleanLine.length > 20) return null;

  for (const [type, patterns] of Object.entries(SECTION_HEADERS)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanLine)) {
        return type as SectionType;
      }
    }
  }

  return null;
}
