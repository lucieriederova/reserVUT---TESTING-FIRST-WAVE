// Default room policies — HEAD_ADMIN can modify these at runtime
const roomPolicies = [
    { roomName: 'Session Room', allowedRoles: ['STUDENT', 'GUIDE', 'CEO', 'HEAD_ADMIN'], capacity: 20 },
    { roomName: 'Meeting Room', allowedRoles: ['GUIDE', 'CEO', 'HEAD_ADMIN'], capacity: 10 },
    { roomName: 'The Stage', allowedRoles: ['GUIDE', 'CEO', 'HEAD_ADMIN'], capacity: 50 },
    { roomName: 'Lab A', allowedRoles: ['STUDENT', 'GUIDE', 'CEO', 'HEAD_ADMIN'], capacity: 15 },
    { roomName: 'Lab B', allowedRoles: ['STUDENT', 'GUIDE', 'CEO', 'HEAD_ADMIN'], capacity: 15 },
    { roomName: 'Conference Room', allowedRoles: ['CEO', 'HEAD_ADMIN'], capacity: 30 },
];
export function getAllRooms() {
    return [...roomPolicies];
}
export function getRoomPolicy(roomName) {
    return roomPolicies.find((r) => r.roomName === roomName);
}
export function canRoleBookRoom(role, roomName) {
    const policy = getRoomPolicy(roomName);
    if (!policy)
        return false;
    return policy.allowedRoles.includes(role);
}
export function addRoom(policy) {
    const existing = roomPolicies.findIndex((r) => r.roomName === policy.roomName);
    if (existing >= 0) {
        roomPolicies[existing] = policy;
    }
    else {
        roomPolicies.push(policy);
    }
}
export function updateRoomPolicy(roomName, updates) {
    const room = roomPolicies.find((r) => r.roomName === roomName);
    if (!room)
        return null;
    Object.assign(room, updates);
    return room;
}
