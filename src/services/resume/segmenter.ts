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
  contact: [/^contact/i, /^personal info/i],
  summary: [
    /^summary/i,
    /^professional summary/i,
    /^objective/i,
    /^about me/i,
    /^profile/i,
  ],
  experience: [
    /^experience/i,
    /^work history/i,
    /^employment/i,
    /^professional experience/i,
    /^work experience/i,
  ],
  education: [/^education/i, /^academic background/i, /^academic history/i],
  skills: [
    /^skills/i,
    /^technical skills/i,
    /^core competencies/i,
    /^expertise/i,
    /^technologies/i,
  ],
  projects: [
    /^projects/i,
    /^key projects/i,
    /^personal projects/i,
    /^academic projects/i,
  ],
  certifications: [
    /^certifications/i,
    /^licenses/i,
    /^awards/i,
    /^achievements/i,
  ],
  other: [],
};

/**
 * Segments the cleaned text into logical sections based on headers.
 */
export function segmentText(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let currentSection: Section = { type: "other", header: "", content: "" };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if the line is a potential header
    const detectedType = detectSectionHeader(trimmedLine);

    if (detectedType) {
      // If we found a new section, save the current one and start a new one
      if (currentSection.content || currentSection.header) {
        sections.push({
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
    sections.push({
      ...currentSection,
      content: currentSection.content.trim(),
    });
  }

  // If no sections were found (very short text or unusual formatting),
  // treat everything as "summary" or leave as "other"
  if (sections.length === 0 && text.trim()) {
    sections.push({ type: "other", header: "", content: text.trim() });
  }

  return sections;
}

/**
 * Detects if a line is likely a section header.
 */
function detectSectionHeader(line: string): SectionType | null {
  // Section headers are usually short (less than 50 chars)
  if (line.length > 50) return null;

  for (const [type, patterns] of Object.entries(SECTION_HEADERS)) {
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        return type as SectionType;
      }
    }
  }

  return null;
}
