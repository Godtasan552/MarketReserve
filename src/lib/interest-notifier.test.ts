
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifyInterestedUsers } from './interest-notifier';

// Mock Mongoose Models
// We need to mock the models imported in the file
const mockFind = vi.fn();
const mockUpdateMany = vi.fn();
const mockInsertMany = vi.fn();
const mockFindById = vi.fn();

vi.mock('@/models/InterestList', () => ({
  default: {
    find: () => ({
        // find returns a query which we can await or chain
        // for simplicity we'll just make it return the data mock
        // but in the actual code it's await InterestList.find(...)
        // so this works if we return a promise or value
        // The actual code: const interests = await InterestList.find({ lock: lockId });
        // So we just return the array directly if mocked as an async function in implementation or just value
    }),
    updateMany: () => {}
  }
}));

vi.mock('@/models/Lock', () => ({
  default: {
    findById: () => {}
  }
}));

vi.mock('@/models/Notification', () => ({
  default: {
    insertMany: () => {}
  }
}));

// We need to properly spy on the imports
import InterestList from '@/models/InterestList';
import Lock from '@/models/Lock';
import Notification from '@/models/Notification';
import connectDB from '@/lib/db/mongoose';

vi.mock('@/lib/db/mongoose', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

describe('notifyInterestedUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    InterestList.find = mockFind;
    InterestList.updateMany = mockUpdateMany;
    Lock.findById = mockFindById;
    Notification.insertMany = mockInsertMany;
  });

  it('should notify users when lock is found and interests exist', async () => {
    // Arrange
    const lockId = 'lock-123';
    const mockLock = { _id: lockId, lockNumber: 'A-01' };
    const mockInterests = [
        { user: 'user-1' },
        { user: 'user-2' }
    ];

    mockFind.mockResolvedValue(mockInterests);
    mockFindById.mockResolvedValue(mockLock);
    
    // Act
    await notifyInterestedUsers(lockId);

    // Assert
    expect(connectDB).toHaveBeenCalled();
    expect(InterestList.find).toHaveBeenCalledWith({ lock: lockId });
    expect(Lock.findById).toHaveBeenCalledWith(lockId);
    
    expect(Notification.insertMany).toHaveBeenCalledTimes(1);
    const notifications = mockInsertMany.mock.calls[0][0];
    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({
        user: 'user-1',
        title: 'ล็อกที่คุณสนใจว่างแล้ว!',
        link: `/locks/${lockId}`
    });
    
    expect(InterestList.updateMany).toHaveBeenCalledWith(
        { lock: lockId },
        { notified: true }
    );
  });

  it('should do nothing if no interests found', async () => {
    mockFind.mockResolvedValue([]);
    
    await notifyInterestedUsers('lock-123');

    expect(Lock.findById).not.toHaveBeenCalled();
    expect(Notification.insertMany).not.toHaveBeenCalled();
  });
});
