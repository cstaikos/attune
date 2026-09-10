export const modalities = ["MDMA", "Psilocybin", "Ketamine", "Cannabis", "Breathwork", "Meditation"] as const;
export const qualityGroups = {
  "Sound": ["ambient", "acoustic", "electronic", "classical", "percussive", "nature sounds"],
  "Voice": ["no vocals", "wordless vocals", "sung lyrics", "spoken word"],
  "Mood / texture": ["spacious", "gentle", "warm", "reflective", "uplifting", "melancholic", "tense", "driving"]
} as const;
export const listeningGroups = {
  "Sound / delivery": {
    "abrupt transitions": "A sudden change in style, pace, or texture, within a track or between tracks. A smooth change in energy alone does not need this note.",
    "sudden loud sounds": "An unexpected loud entrance, impact, or jump in volume. Identify where it occurs when possible.",
    "sustained high intensity": "An extended passage of forceful, dense, or insistent sound. Use for sustained intensity, rather than a brief peak.",
    "harsh or dissonant sounds": "Prominent distortion, abrasive textures, or clashing tones. This describes the sound, not its musical quality.",
    "distressing human sounds": "Audible screaming, sobbing, or other human expressions of distress. Ordinary singing does not qualify."
  },
  "Content": {
    "explicit language": "Profanity or slurs in sung or spoken words. Add context if a platform’s explicit label is unclear.",
    "religious or devotional content": "Identifiable prayer, worship, devotional lyrics, or religious teaching. Name the tradition if known as const; do not infer it from an instrument or language.",
    "death or grief themes": "Sung or spoken references to death, dying, bereavement, or mourning. A melancholy mood alone does not qualify.",
    "violence or abuse themes": "Sung or spoken descriptions of violence, threats, or abuse. Give a brief, non-graphic explanation when helpful.",
    "sexual content": "Sung or spoken sexual references or sexual audio. Romantic themes alone do not qualify."
  }
} as const;

export type Modality = (typeof modalities)[number];
export type MusicTag = (typeof qualityGroups)[keyof typeof qualityGroups][number];
type KeysOfUnion<T> = T extends unknown ? keyof T : never;
export type ListeningNoteLabel = KeysOfUnion<(typeof listeningGroups)[keyof typeof listeningGroups]>;
