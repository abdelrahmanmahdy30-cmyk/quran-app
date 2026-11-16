const compoundNamePrefixes = new Set([
  "عبد",
  "عبدال",
  "أبو",
  "ابو",
  "أم",
  "ام",
  "ابن",
  "بن",
  "سيف",
  "نور",
]);

export function getGreetingName(displayName: string): string {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  const words = normalized.split(" ");
  if (words.length > 1 && compoundNamePrefixes.has(words[0])) {
    return `${words[0]} ${words[1]}`;
  }

  return words[0];
}
