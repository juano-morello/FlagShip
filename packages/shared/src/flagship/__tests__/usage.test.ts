/**
 * Usage Utilities Tests
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect } from 'vitest';
import { calculatePeriodBoundaries } from '../usage';

describe('Usage Utilities', () => {
  describe('calculatePeriodBoundaries', () => {
    it('should calculate monthly period boundaries for a date', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('should handle first day of month', () => {
      const timestamp = new Date('2024-03-01T00:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-03-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-03-31T23:59:59.999Z'));
    });

    it('should handle last day of month', () => {
      const timestamp = new Date('2024-02-29T23:59:59Z'); // Leap year
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-02-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-02-29T23:59:59.999Z'));
    });

    it('should handle February in non-leap year', () => {
      const timestamp = new Date('2023-02-15T12:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2023-02-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2023-02-28T23:59:59.999Z'));
    });

    it('should handle December (year boundary)', () => {
      const timestamp = new Date('2024-12-25T18:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-12-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-12-31T23:59:59.999Z'));
    });

    it('should handle January (year boundary)', () => {
      const timestamp = new Date('2024-01-01T00:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('should handle months with 30 days', () => {
      const timestamp = new Date('2024-04-15T12:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-04-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-04-30T23:59:59.999Z'));
    });

    it('should handle months with 31 days', () => {
      const timestamp = new Date('2024-07-15T12:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toEqual(new Date('2024-07-01T00:00:00.000Z'));
      expect(periodEnd).toEqual(new Date('2024-07-31T23:59:59.999Z'));
    });

    it('should preserve timezone-independent calculation', () => {
      // Same logical date in different timezones should produce same period
      const utcDate = new Date('2024-06-15T00:00:00Z');
      const { periodStart: start1, periodEnd: end1 } = calculatePeriodBoundaries(utcDate);

      const laterInDay = new Date('2024-06-15T23:59:59Z');
      const { periodStart: start2, periodEnd: end2 } = calculatePeriodBoundaries(laterInDay);

      expect(start1).toEqual(start2);
      expect(end1).toEqual(end2);
    });

    it('should return Date objects', () => {
      const timestamp = new Date('2024-05-15T12:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodStart).toBeInstanceOf(Date);
      expect(periodEnd).toBeInstanceOf(Date);
    });

    it('should ensure periodEnd is after periodStart', () => {
      const timestamp = new Date('2024-08-15T12:00:00Z');
      const { periodStart, periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodEnd.getTime()).toBeGreaterThan(periodStart.getTime());
    });

    it('should set periodStart to midnight', () => {
      const timestamp = new Date('2024-09-15T14:30:45.123Z');
      const { periodStart } = calculatePeriodBoundaries(timestamp);

      expect(periodStart.getUTCHours()).toBe(0);
      expect(periodStart.getUTCMinutes()).toBe(0);
      expect(periodStart.getUTCSeconds()).toBe(0);
      expect(periodStart.getUTCMilliseconds()).toBe(0);
    });

    it('should set periodEnd to end of day', () => {
      const timestamp = new Date('2024-10-15T08:15:30.456Z');
      const { periodEnd } = calculatePeriodBoundaries(timestamp);

      expect(periodEnd.getUTCHours()).toBe(23);
      expect(periodEnd.getUTCMinutes()).toBe(59);
      expect(periodEnd.getUTCSeconds()).toBe(59);
      expect(periodEnd.getUTCMilliseconds()).toBe(999);
    });
  });
});

