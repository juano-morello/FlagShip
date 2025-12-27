/**
 * Usage Utilities
 * Shared usage calculation logic for FlagShip
 */

/**
 * Period boundaries for usage tracking
 */
export interface PeriodBoundaries {
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Calculate monthly period boundaries for a given timestamp
 * 
 * @param timestamp - The timestamp to calculate boundaries for
 * @returns Object with periodStart (first day of month at 00:00:00.000) 
 *          and periodEnd (last day of month at 23:59:59.999)
 */
export function calculatePeriodBoundaries(timestamp: Date): PeriodBoundaries {
  // Calculate period start: first day of the month at midnight
  const periodStart = new Date(
    Date.UTC(timestamp.getUTCFullYear(), timestamp.getUTCMonth(), 1, 0, 0, 0, 0)
  );

  // Calculate period end: last day of the month at 23:59:59.999
  const periodEnd = new Date(
    Date.UTC(
      timestamp.getUTCFullYear(),
      timestamp.getUTCMonth() + 1,
      0, // Day 0 of next month = last day of current month
      23,
      59,
      59,
      999
    )
  );

  return { periodStart, periodEnd };
}

