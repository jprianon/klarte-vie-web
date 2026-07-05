/** Palette de dégradés (couleurs iOS) attribuée de façon stable par catégorie. */
const GRADIENTS: [string, string][] = [
  ["#5aa9ff", "#0a84ff"],
  ["#6fe08a", "#30d158"],
  ["#ffd27a", "#ff9f0a"],
  ["#ff8fb0", "#ff2d55"],
  ["#c99bff", "#bf5af2"],
  ["#5aa9ff", "#5e5ce6"],
];

export function gradientFor(name: string | null): [string, string] {
  const key = name ?? "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  // Index toujours dans [0, length) → l'assertion est sûre (noUncheckedIndexedAccess).
  return GRADIENTS[hash % GRADIENTS.length]!;
}
