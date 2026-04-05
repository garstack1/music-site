const PROFANITY_LIST = [
  "fuck", "fucking", "fucked", "fucker", "fucks",
  "shit", "shits", "shitting", "shitty",
  "cunt", "cunts",
  "dick", "dicks",
  "ass", "asshole", "assholes",
  "bitch", "bitches",
  "bastard", "bastards",
  "damn", "damned",
  "piss", "pissed", "pissing",
  "cock", "cocks",
  "wanker", "wankers",
  "bollocks",
  "twat", "twats",
  "slut", "sluts",
  "whore", "whores",
  "nigger", "nigga",
  "retard", "retarded",
  "fag", "faggot",
];

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

export function isNonsense(text: string): boolean {
  if (!text) return false;
  if (text.trim().length < 2) return true;
  // Random consonant strings
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(text)) return true;
  // Repeated characters
  if (/(.)\1{4,}/.test(text)) return true;
  // All numbers
  if (/^\d+$/.test(text.trim())) return true;
  return false;
}

export function isEnglish(text: string): boolean {
  if (!text || text.length < 10) return true; // too short to tell
  // Check if majority of words contain common English letter patterns
  const words = text.split(/\s+/);
  const englishPattern = /^[a-zA-Z0-9',.\-!?;:()&@#"]+$/;
  const englishWords = words.filter((w) => englishPattern.test(w));
  return englishWords.length / words.length > 0.7;
}

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
}

export function validateReviewText(text: string, maxWords: number = 500): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: true, reason: null }; // text is optional
  }

  const trimmed = text.trim();

  if (trimmed.length < 5) {
    return { valid: false, reason: "Review text is too short (minimum 5 characters)" };
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > maxWords) {
    return { valid: false, reason: `Review text exceeds ${maxWords} word limit (${wordCount} words)` };
  }

  if (containsProfanity(trimmed)) {
    return { valid: false, reason: "Review contains inappropriate language" };
  }

  if (isNonsense(trimmed)) {
    return { valid: false, reason: "Review appears to contain nonsense text" };
  }

  if (!isEnglish(trimmed)) {
    return { valid: false, reason: "Reviews must be in English" };
  }

  return { valid: true, reason: null };
}

export function validateScore(score: number): ValidationResult {
  if (typeof score !== "number" || isNaN(score)) {
    return { valid: false, reason: "Score must be a number" };
  }
  if (score < 0 || score > 10) {
    return { valid: false, reason: "Score must be between 0 and 10" };
  }
  if (!Number.isInteger(score)) {
    return { valid: false, reason: "Score must be a whole number" };
  }
  return { valid: true, reason: null };
}
