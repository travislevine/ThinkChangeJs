/** After editing `total_devices`, derive a consistent `devices_remaining` (pick-ups preserved where possible). */
export function computeDevicesRemainingAfterTotalChange(
  oldTotal: number,
  oldRemaining: number,
  newTotal: number
): number {
  const safeOldTotal = Math.max(0, oldTotal)
  const safeOldRem = Math.max(0, Math.min(oldRemaining, safeOldTotal))
  const safeNewTotal = Math.max(0, newTotal)
  const delta = safeNewTotal - safeOldTotal
  const adjusted = delta >= 0 ? safeOldRem + delta : Math.min(safeOldRem, safeNewTotal)
  return Math.max(0, Math.min(adjusted, safeNewTotal))
}
