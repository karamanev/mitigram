export type ParsedEmailBatch = {
  valid: string[];
  invalid: string[];
};

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;
const SIMPLE_EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  if (!localPart || !domain || localPart.length > MAX_LOCAL_LENGTH) {
    return false;
  }

  return SIMPLE_EMAIL_RE.test(email);
}

export function extractEmailCandidate(value: string): string {
  const trimmed = value.trim();
  const angleMatch = trimmed.match(/<([^<>]+)>/);
  if (angleMatch) {
    return normalizeEmail(angleMatch[1]);
  }

  return normalizeEmail(trimmed.replace(/^mailto:/i, ''));
}

export function parseEmailBatch(value: string): ParsedEmailBatch {
  const valid = new Set<string>();
  const invalid = new Set<string>();
  const tokens = value
    .split(/[\r\n,;]+/)
    .map(token => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const candidate = extractEmailCandidate(token);
    if (isValidEmail(candidate)) {
      valid.add(candidate);
    } else {
      invalid.add(token);
    }
  }

  return {
    valid: [...valid],
    invalid: [...invalid],
  };
}
