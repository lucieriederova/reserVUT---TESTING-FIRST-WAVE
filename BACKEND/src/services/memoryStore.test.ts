import { describe, it, expect } from 'vitest';
import { validateReservation, createReservation, cancelReservation, type Role } from './memoryStore.js';

/** Builds an ISO timestamp `daysFromNow` days ahead, at `hour:00` local time. */
function at(daysFromNow: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Adds `hours` (fractional allowed) to an ISO timestamp. */
function plusHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

/** An ISO timestamp `hours` from the current moment (not day-aligned, unlike `at`). */
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

let userCounter = 0;
/** A fresh user id per call, so reservations from different tests never collide on weekly/simultaneous limits. */
function freshUserId(): string {
  userCounter += 1;
  return `test-user-${userCounter}`;
}

describe('validateReservation', () => {
  it('rejects a start time in the past', () => {
    const err = validateReservation({
      roomName: 'Meeting Room',
      startTime: at(-1),
      endTime: plusHours(at(-1), 1),
      type: 'MEETING',
      userId: freshUserId(),
      role: 'STUDENT',
      isVerified: true,
    });
    expect(err?.code).toBe('PAST_TIME');
  });

  it('only allows GLOBAL_EVENT bookings for HEAD_ADMIN', () => {
    const start = at(3);
    const forStudent = validateReservation({
      roomName: 'Event', startTime: start, endTime: plusHours(start, 1),
      type: 'GLOBAL_EVENT', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(forStudent?.code).toBe('FORBIDDEN');

    const forAdmin = validateReservation({
      roomName: 'Event', startTime: start, endTime: plusHours(start, 1),
      type: 'GLOBAL_EVENT', userId: freshUserId(), role: 'HEAD_ADMIN', isVerified: true,
    });
    expect(forAdmin).toBeNull();
  });

  it('rejects booking a room the role is not allowed to use', () => {
    const start = at(2);
    const err = validateReservation({
      roomName: 'Aquarium', // STUDENT has no access to Aquarium
      startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(err?.code).toBe('ROOM_ACCESS_DENIED');
  });

  it('requires CEO/GUIDE accounts to be verified before booking', () => {
    const start = at(2);
    const err = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'CEO', isVerified: false,
    });
    expect(err?.code).toBe('NOT_VERIFIED');
  });

  it('enforces the minimum 15-minute duration', () => {
    const start = at(2);
    const err = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 0.1),
      type: 'MEETING', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(err?.code).toBe('TOO_SHORT');
  });

  it('caps STUDENT bookings at 2h30, and other roles at 3h', () => {
    const start = at(2);
    const studentTooLong = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 3),
      type: 'MEETING', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(studentTooLong?.code).toBe('TOO_LONG');

    const ceoOk = validateReservation({
      roomName: 'Meeting Room', startTime: at(3), endTime: plusHours(at(3), 3),
      type: 'MEETING', userId: freshUserId(), role: 'CEO', isVerified: true,
    });
    expect(ceoOk).toBeNull();

    const ceoTooLong = validateReservation({
      roomName: 'Meeting Room', startTime: at(3), endTime: plusHours(at(3), 3.5),
      type: 'MEETING', userId: freshUserId(), role: 'CEO', isVerified: true,
    });
    expect(ceoTooLong?.code).toBe('TOO_LONG');
  });

  it('limits STUDENT and CEO to booking at most 5 days ahead', () => {
    const start = at(6);
    const studentErr = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(studentErr?.code).toBe('TOO_FAR_AHEAD');

    const ceoErr = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'CEO', isVerified: true,
    });
    expect(ceoErr?.code).toBe('TOO_FAR_AHEAD');
  });

  it('requires CEO bookings to be made at least 24h in advance', () => {
    const start = hoursFromNow(2);
    const err = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'CEO', isVerified: true,
    });
    expect(err?.code).toBe('TOO_CLOSE');
  });

  it('requires GUIDE SESSION bookings at least 2 days in advance (other types are exempt)', () => {
    const start = at(1);
    const sessionErr = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'SESSION', userId: freshUserId(), role: 'GUIDE', isVerified: true,
    });
    expect(sessionErr?.code).toBe('LEAD_TIME');

    const meetingOk = validateReservation({
      roomName: 'Meeting Room', startTime: start, endTime: plusHours(start, 1),
      type: 'MEETING', userId: freshUserId(), role: 'GUIDE', isVerified: true,
    });
    expect(meetingOk).toBeNull();
  });

  it('caps STUDENT at 2 active reservations per week', () => {
    const userId = freshUserId();
    // Two non-overlapping bookings in the same week, well within all other limits.
    createReservation({
      roomName: 'Meeting Room', startTime: at(1, 9), endTime: at(1, 10),
      type: 'MEETING', priorityLevel: 1, userId,
    });
    createReservation({
      roomName: 'Panda Room', startTime: at(1, 11), endTime: at(1, 12),
      type: 'MEETING', priorityLevel: 1, userId,
    });

    const thirdBooking = validateReservation({
      roomName: 'Session Room', startTime: at(1, 13), endTime: at(1, 14),
      type: 'MEETING', userId, role: 'STUDENT', isVerified: true,
    });
    expect(thirdBooking?.code).toBe('WEEKLY_LIMIT');
  });

  it('blocks a STUDENT from holding two simultaneous reservations in different rooms', () => {
    // Day offset 5 (within STUDENT's 5-day booking-ahead window) and this
    // exact room+time pair aren't used by any other test in this file — a
    // collision would hit a false CONFLICT/TOO_FAR_AHEAD instead of
    // exercising the simultaneous-booking check.
    const userId = freshUserId();
    createReservation({
      roomName: 'Meeting Room', startTime: at(5, 15), endTime: at(5, 16),
      type: 'MEETING', priorityLevel: 1, userId,
    });

    const overlapping = validateReservation({
      roomName: 'Panda Room', startTime: at(5, 15), endTime: at(5, 16),
      type: 'MEETING', userId, role: 'STUDENT', isVerified: true,
    });
    expect(overlapping?.code).toBe('SIMULTANEOUS_LIMIT');
  });

  it('allows a fully valid STUDENT booking', () => {
    const err = validateReservation({
      roomName: 'Meeting Room', startTime: at(2, 9), endTime: at(2, 10),
      type: 'MEETING', userId: freshUserId(), role: 'STUDENT', isVerified: true,
    });
    expect(err).toBeNull();
  });
});

describe('createReservation — priority preemption', () => {
  it('does not block the room for a GLOBAL_EVENT booking', () => {
    const { reservation, preempted } = createReservation({
      roomName: 'Event', startTime: at(4, 9), endTime: at(4, 10),
      type: 'GLOBAL_EVENT', priorityLevel: 4, userId: freshUserId(),
    });
    expect(reservation.status).toBe('ACTIVE');
    expect(preempted).toEqual([]);
  });

  it('preempts a lower-priority overlapping reservation instead of blocking the new one', () => {
    const room = 'Preempt Room A';
    const studentRes = createReservation({
      roomName: room, startTime: at(5, 9), endTime: at(5, 11),
      type: 'MEETING', priorityLevel: 1, userId: freshUserId(),
    });

    const { reservation, preempted } = createReservation({
      roomName: room, startTime: at(5, 10), endTime: at(5, 12),
      type: 'MEETING', priorityLevel: 3, userId: freshUserId(), // GUIDE-level priority
    });

    expect(reservation.status).toBe('ACTIVE');
    expect(preempted.map((r) => r.id)).toContain(studentRes.reservation.id);
  });

  it('rejects a booking that overlaps an equal-or-higher priority reservation', () => {
    const room = 'Preempt Room B';
    createReservation({
      roomName: room, startTime: at(6, 9), endTime: at(6, 11),
      type: 'MEETING', priorityLevel: 3, userId: freshUserId(),
    });

    expect(() =>
      createReservation({
        roomName: room, startTime: at(6, 10), endTime: at(6, 12),
        type: 'MEETING', priorityLevel: 2, userId: freshUserId(),
      })
    ).toThrowError(expect.objectContaining({ code: 'CONFLICT' }));
  });

  it('leaves non-overlapping reservations in the same room untouched', () => {
    const room = 'Preempt Room C';
    const earlier = createReservation({
      roomName: room, startTime: at(7, 9), endTime: at(7, 10),
      type: 'MEETING', priorityLevel: 1, userId: freshUserId(),
    });
    createReservation({
      roomName: room, startTime: at(7, 11), endTime: at(7, 12),
      type: 'MEETING', priorityLevel: 4, userId: freshUserId(),
    });
    expect(earlier.reservation.status).toBe('ACTIVE');
  });
});

describe('cancelReservation', () => {
  function makeReservation(role: Role) {
    const priorityByRole: Record<Role, number> = { STUDENT: 1, CEO: 2, GUIDE: 3, HEAD_ADMIN: 4 };
    const ownerId = freshUserId();
    const { reservation } = createReservation({
      roomName: `Cancel Room ${ownerId}`, startTime: at(8, 9), endTime: at(8, 10),
      type: 'MEETING', priorityLevel: priorityByRole[role], userId: ownerId,
    });
    return { ownerId, reservation };
  }

  it('allows the owner to cancel their own reservation', () => {
    const { ownerId, reservation } = makeReservation('STUDENT');
    const cancelled = cancelReservation(reservation.id, ownerId, 'STUDENT');
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('allows a strictly higher-priority role to override-cancel', () => {
    const { reservation } = makeReservation('STUDENT');
    const cancelled = cancelReservation(reservation.id, freshUserId(), 'HEAD_ADMIN');
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('forbids a non-owner of equal or lower priority from cancelling', () => {
    const { reservation } = makeReservation('GUIDE');
    expect(() => cancelReservation(reservation.id, freshUserId(), 'CEO')).toThrowError(
      expect.objectContaining({ code: 'FORBIDDEN' })
    );
  });

  it('throws NOT_FOUND for an unknown reservation id', () => {
    expect(() => cancelReservation('does-not-exist', freshUserId(), 'HEAD_ADMIN')).toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' })
    );
  });
});
