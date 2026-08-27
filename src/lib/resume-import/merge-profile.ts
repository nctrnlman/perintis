interface ExistingPersonalInfo {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
}

interface ExtractedPersonalInfo {
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
}

export function buildPersonalInfoPatch(
  existing: ExistingPersonalInfo,
  extracted: ExtractedPersonalInfo
): Partial<ExistingPersonalInfo> {
  const patch: Partial<ExistingPersonalInfo> = {};

  if (!existing.fullName && extracted.fullName) patch.fullName = extracted.fullName;
  if (!existing.phone && extracted.phone) patch.phone = extracted.phone;
  if (!existing.location && extracted.location) patch.location = extracted.location;
  if (!existing.linkedinUrl && extracted.linkedinUrl) patch.linkedinUrl = extracted.linkedinUrl;
  if (!existing.portfolioUrl && extracted.portfolioUrl) patch.portfolioUrl = extracted.portfolioUrl;
  if (!existing.summary && extracted.summary) patch.summary = extracted.summary;

  return patch;
}
