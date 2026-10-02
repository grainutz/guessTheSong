export function calculatePoints(
  streak: number
): number {
  const basePoints = 100;

  const streakBonus =
    Math.min(streak, 5) * 20;

  return basePoints + streakBonus;
}