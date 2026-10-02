import { describe, it, expect, afterEach } from 'vitest';
import { getAllRooms, getRoomsForRole, getRoomPolicy, canRoleBookRoom, upsertRoom, deleteRoom } from './roomPolicyStore.js';

describe('seeded room policies', () => {
  it('restricts STUDENT to the student-accessible rooms only', () => {
    expect(canRoleBookRoom('STUDENT', 'Meeting Room')).toBe(true);
    expect(canRoleBookRoom('STUDENT', 'Aquarium')).toBe(false);
    expect(canRoleBookRoom('STUDENT', 'The Stage')).toBe(false);
    expect(canRoleBookRoom('STUDENT', 'Event')).toBe(false);
  });

  it('reserves the "Event" (global event) room for HEAD_ADMIN only', () => {
    expect(canRoleBookRoom('HEAD_ADMIN', 'Event')).toBe(true);
    expect(canRoleBookRoom('CEO', 'Event')).toBe(false);
    expect(canRoleBookRoom('GUIDE', 'Event')).toBe(false);
  });

  it('returns false for a room that does not exist', () => {
    expect(canRoleBookRoom('HEAD_ADMIN', 'Nonexistent Room')).toBe(false);
  });

  it('getRoomsForRole only returns rooms that allow that role', () => {
    const studentRooms = getRoomsForRole('STUDENT');
    expect(studentRooms.every((r) => r.allowedRoles.includes('STUDENT'))).toBe(true);
    expect(studentRooms.length).toBeLessThan(getAllRooms().length);
  });
});

describe('room policy mutation', () => {
  const TEST_ROOM = '__test_room__';

  afterEach(() => {
    deleteRoom(TEST_ROOM);
  });

  it('upsertRoom creates a new room that becomes bookable', () => {
    expect(getRoomPolicy(TEST_ROOM)).toBeUndefined();
    upsertRoom({ name: TEST_ROOM, displayName: TEST_ROOM, capacity: 4, allowedRoles: ['STUDENT'] });
    expect(canRoleBookRoom('STUDENT', TEST_ROOM)).toBe(true);
    expect(canRoleBookRoom('CEO', TEST_ROOM)).toBe(false);
  });

  it('upsertRoom replaces an existing room policy in place rather than duplicating it', () => {
    upsertRoom({ name: TEST_ROOM, displayName: TEST_ROOM, capacity: 4, allowedRoles: ['STUDENT'] });
    const countBefore = getAllRooms().length;
    upsertRoom({ name: TEST_ROOM, displayName: TEST_ROOM, capacity: 10, allowedRoles: ['STUDENT', 'CEO'] });
    expect(getAllRooms().length).toBe(countBefore);
    expect(getRoomPolicy(TEST_ROOM)?.capacity).toBe(10);
    expect(canRoleBookRoom('CEO', TEST_ROOM)).toBe(true);
  });

  it('deleteRoom removes the room and reports whether it existed', () => {
    upsertRoom({ name: TEST_ROOM, displayName: TEST_ROOM, capacity: 4, allowedRoles: ['STUDENT'] });
    expect(deleteRoom(TEST_ROOM)).toBe(true);
    expect(getRoomPolicy(TEST_ROOM)).toBeUndefined();
    expect(deleteRoom(TEST_ROOM)).toBe(false);
  });
});
