function parseEnvList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Server-only: matches ANALYSIS_ADMIN_USER_IDS / ANALYSIS_ADMIN_EMAILS */
export function isAnalysisAdminByEnv(userId: string, email?: string | null): boolean {
  if (parseEnvList(process.env.ANALYSIS_ADMIN_USER_IDS).includes(userId)) {
    return true;
  }
  const adminEmails = parseEnvList(process.env.ANALYSIS_ADMIN_EMAILS).map((e) => e.toLowerCase());
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && adminEmails.includes(normalized));
}
