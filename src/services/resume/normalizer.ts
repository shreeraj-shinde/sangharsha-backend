import { Section, SectionType } from "./segmenter";

export interface ExperienceEntry {
  title?: string;
  company?: string;
  location?: string;
  period?: string;
  description?: string;
  rawContent: string;
}

export interface EducationEntry {
  degree?: string;
  institution?: string;
  location?: string;
  period?: string;
  description?: string;
  rawContent: string;
}

export interface ProjectEntry {
  name?: string;
  links: string[];
  description?: string;
  rawContent: string;
}

export interface NormalizedResume {
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: string[];
  };
  summary?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  certifications: string[];
  rawSections: Section[];
}

/**
 * Normalizes the raw sections into a structured resume object.
 */
export function normalizeSections(sections: Section[]): NormalizedResume {
  const normalized: NormalizedResume = {
    contact: { links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    rawSections: sections,
  };

  for (const section of sections) {
    const content = section.content.trim();
    if (!content) continue;

    switch (section.type) {
      case "contact":
        extractContactInfo(content, normalized);
        break;
      case "summary":
        normalized.summary = content;
        break;
      case "skills":
        normalized.skills = [...normalized.skills, ...extractSkills(content)];
        break;
      case "experience":
        normalized.experience.push({ rawContent: content });
        break;
      case "education":
        normalized.education.push({ rawContent: content });
        break;
      case "projects":
        normalized.projects.push({
          rawContent: content,
          links: content.match(/https?:\/\/[^\s]+/g) || [],
        });
        break;
      case "certifications":
        normalized.certifications.push(content);
        break;
      case "other":
        // Often the first "other" section is actually contact info
        if (!normalized.contact.email || !normalized.contact.phone) {
          extractContactInfo(content, normalized);
        }
        break;
    }
  }

  // Final cleanup of skills (unique and trimmed)
  normalized.skills = [
    ...new Set(normalized.skills.map((s) => s.trim())),
  ].filter(Boolean);

  return normalized;
}

/**
 * Basic regex-based contact info extraction.
 */
function extractContactInfo(content: string, normalized: NormalizedResume) {
  // Email
  const emailMatch = content.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  if (emailMatch && !normalized.contact.email) {
    normalized.contact.email = emailMatch[0];
  }

  // Phone (simple regex for various formats)
  const phoneMatch = content.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/,
  );
  if (phoneMatch && !normalized.contact.phone) {
    normalized.contact.phone = phoneMatch[0].trim();
  }

  // Links (http/https)
  const links = content.match(/https?:\/\/[^\s]+/g);
  if (links) {
    normalized.contact.links = [
      ...new Set([...normalized.contact.links, ...links]),
    ];
  }

  // Name (Tries to take the first line if it looks like a name and no title is found)
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 0 && !normalized.contact.name) {
    // If first line doesn't have @ or http, it might be the name
    if (!lines[0].includes("@") && !lines[0].toLowerCase().includes("http")) {
      normalized.contact.name = lines[0];
    }
  }
}

/**
 * Extracts skills from a string, splitting by common delimiters.
 */
function extractSkills(content: string): string[] {
  // Try to split by common dividers: commas, pipes, bullets, newlines
  // But also handle "Frontend : HTML, CSS" format

  const cleaned = content.replace(/[•\d.]/g, ""); // remove bullets or numbers
  const parts = cleaned.split(/[,\n|;]|\s{2,}/);

  return parts
    .map((p) => {
      // Remove "Category :" prefixes
      return p.replace(/^[^:]+:/, "").trim();
    })
    .filter((p) => p.length > 1 && p.length < 50);
}
