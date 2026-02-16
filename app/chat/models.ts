export const MODELS = [
  { id: "claude-opus-4-5", label: "Opus 4.5" },
  { id: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
] as const;

export const DEFAULT_MODEL = MODELS[0].id;
