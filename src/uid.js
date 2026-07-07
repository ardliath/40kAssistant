/** Generate a unique id for rosters, units, models, dice, etc. */
export const uid = () =>
  crypto.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
