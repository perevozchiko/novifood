import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeStreak } from '@/lib/meals';

/*
  computeStreak is a pure function — no Supabase calls needed.
  We control "today" by mocking the Date constructor.
*/

function mockToday(dateStr: string) {
  const fixed = new Date(dateStr + 'T12:00:00Z');
  vi.useFakeTimers();
  vi.setSystemTime(fixed);
}

describe('computeStreak', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computeStreak_ShouldReturn0_WhenNoDates', () => {
    mockToday('2026-06-25');
    expect(computeStreak([])).toBe(0);
  });

  it('computeStreak_ShouldReturn1_WhenOnlyTodayLogged', () => {
    mockToday('2026-06-25');
    expect(computeStreak(['2026-06-25'])).toBe(1);
  });

  it('computeStreak_ShouldReturn0_WhenOnlyYesterdayLogged', () => {
    mockToday('2026-06-25');
    expect(computeStreak(['2026-06-24'])).toBe(0);
  });

  it('computeStreak_ShouldReturn3_WhenThreeConsecutiveDaysEndingToday', () => {
    mockToday('2026-06-25');
    expect(computeStreak(['2026-06-23', '2026-06-24', '2026-06-25'])).toBe(3);
  });

  it('computeStreak_ShouldReturn2_WhenGapBreaksStreak', () => {
    mockToday('2026-06-25');
    // Logged: 22, 24, 25 — gap on 23 means streak is only 24+25 = 2
    expect(computeStreak(['2026-06-22', '2026-06-24', '2026-06-25'])).toBe(2);
  });

  it('computeStreak_ShouldCountFromToday_IgnoringOlderGap', () => {
    mockToday('2026-06-25');
    // Logged today and yesterday only; older entries don't matter
    expect(computeStreak(['2026-06-10', '2026-06-24', '2026-06-25'])).toBe(2);
  });

  it('computeStreak_ShouldHandleDuplicateDates', () => {
    mockToday('2026-06-25');
    // Duplicates should not inflate the streak
    expect(computeStreak(['2026-06-24', '2026-06-24', '2026-06-25', '2026-06-25'])).toBe(2);
  });

  it('computeStreak_ShouldReturn7_WhenFullWeekLogged', () => {
    mockToday('2026-06-25');
    const week = ['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'];
    expect(computeStreak(week)).toBe(7);
  });
});
