// Reference algorithm — deterministic pattern selection with seeded tie-breaking.
// Base44 implements equivalent logic in src/lib/frontendFactory/compatibility.ts

export function choosePattern(candidates, context, seed) {
  const eligible = candidates
    .map(p => ({ ...p, score: scorePattern(p, context) }))
    .filter(p => hardConstraintsPass(p, context) && p.score >= 75)
    .sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));

  if (!eligible.length) throw new Error('NO_ELIGIBLE_PATTERN');
  const topScore = eligible[0].score;
  const tied = eligible.filter(p => p.score === topScore);
  return tied[seededIndex(seed, tied.length)];
}

// Persist: registryVersion, seed, chosen IDs, lock state, generated BuildSpec hash.