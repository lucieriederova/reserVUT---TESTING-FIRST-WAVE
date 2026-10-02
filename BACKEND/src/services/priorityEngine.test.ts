import { describe, it, expect } from 'vitest';
import { ROLE_PRIORITY, TYPE_PRIORITY_BONUS, getEffectivePriority, canPreempt } from './priorityEngine.js';

describe('ROLE_PRIORITY', () => {
  it('ranks roles strictly STUDENT < CEO < GUIDE < HEAD_ADMIN', () => {
    expect(ROLE_PRIORITY.STUDENT).toBeLessThan(ROLE_PRIORITY.CEO);
    expect(ROLE_PRIORITY.CEO).toBeLessThan(ROLE_PRIORITY.GUIDE);
    expect(ROLE_PRIORITY.GUIDE).toBeLessThan(ROLE_PRIORITY.HEAD_ADMIN);
  });
});

describe('getEffectivePriority', () => {
  it('adds the type bonus on top of the role priority', () => {
    expect(getEffectivePriority('STUDENT', 'MEETING')).toBe(ROLE_PRIORITY.STUDENT + TYPE_PRIORITY_BONUS.MEETING);
    expect(getEffectivePriority('STUDENT', 'SESSION')).toBe(ROLE_PRIORITY.STUDENT + TYPE_PRIORITY_BONUS.SESSION);
  });

  it('gives EVENT/GLOBAL_EVENT a large enough bonus to always outrank a plain HEAD_ADMIN booking', () => {
    const studentEvent = getEffectivePriority('STUDENT', 'EVENT');
    const headAdminMeeting = getEffectivePriority('HEAD_ADMIN', 'MEETING');
    expect(studentEvent).toBeGreaterThan(headAdminMeeting);
  });
});

describe('canPreempt', () => {
  it('only allows preemption when attacker priority is strictly higher', () => {
    expect(canPreempt(2, 1)).toBe(true);
    expect(canPreempt(1, 1)).toBe(false);
    expect(canPreempt(1, 2)).toBe(false);
  });
});
