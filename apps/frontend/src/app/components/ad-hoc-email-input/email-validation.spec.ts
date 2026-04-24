import {
  extractEmailCandidate,
  isValidEmail,
  normalizeEmail,
  parseEmailBatch,
} from './email-validation';

describe('email-validation', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
  });

  it('accepts a regular email address', () => {
    expect(isValidEmail('person@example.com')).toBe(true);
  });

  it('rejects malformed email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('person@example')).toBe(false);
    expect(isValidEmail('person@@example.com')).toBe(false);
  });

  it('extracts emails from angle-bracket syntax', () => {
    expect(extractEmailCandidate('Alice Example <alice@example.com>')).toBe('alice@example.com');
  });

  it('parses comma, semicolon, and line-break separated batches', () => {
    expect(
      parseEmailBatch('alpha@example.com, beta@example.com; gamma@example.com\ndelta@example.com'),
    ).toEqual({
      valid: ['alpha@example.com', 'beta@example.com', 'gamma@example.com', 'delta@example.com'],
      invalid: [],
    });
  });

  it('keeps invalid tokens separate from valid emails', () => {
    expect(parseEmailBatch('alpha@example.com, invalid, Beta <beta@example.com>')).toEqual({
      valid: ['alpha@example.com', 'beta@example.com'],
      invalid: ['invalid'],
    });
  });

  it('deduplicates repeated emails inside a pasted batch', () => {
    expect(parseEmailBatch('dup@example.com, DUP@example.com')).toEqual({
      valid: ['dup@example.com'],
      invalid: [],
    });
  });
});
