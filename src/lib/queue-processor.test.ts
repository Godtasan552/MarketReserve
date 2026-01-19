
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processLockAvailability } from './queue-processor';
import Lock from '@/models/Lock';
import Queue from '@/models/Queue';
// import { NotificationService } from '@/lib/notification/service'; // We will mock this

// Mock dependencies
vi.mock('@/lib/db/mongoose', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Lock', () => ({
  default: {
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/models/Queue', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/models/AuditLog', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/notification/service', () => ({
  NotificationService: {
    send: vi.fn(),
  },
}));

// Mock interest notifier to avoid actual import logic during test
vi.mock('@/lib/interest-notifier', () => ({
    notifyInterestedUsers: vi.fn()
}));

describe('Queue Processor: processLockAvailability', () => {
    const mockLockId = 'lock-123';
    const mockUserId = 'user-999';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should set lock to "reserved" if there is a queue', async () => {
        // Setup Mocks
        const mockQueueItem = { user: mockUserId };
        // Chainable mock for sort
        const mockSort = vi.fn().mockResolvedValue(mockQueueItem);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Queue.findOne as any).mockReturnValue({ sort: mockSort });

        // Mock Lock update return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.findByIdAndUpdate as any).mockReturnValue({
            populate: vi.fn().mockResolvedValue({
                _id: mockLockId,
                lockNumber: 'A1',
                status: 'reserved',
                reservedTo: mockUserId
            })
        });

        // Test
        await processLockAvailability(mockLockId);

        // Verify Queue find
        expect(Queue.findOne).toHaveBeenCalledWith({ lock: mockLockId });

        // Verify Lock Update
        const expireDateCheck = expect.any(Date);
        expect(Lock.findByIdAndUpdate).toHaveBeenCalledWith(
            mockLockId,
            expect.objectContaining({
                status: 'reserved',
                reservedTo: mockUserId,
                reservationExpiresAt: expireDateCheck
            }),
            { new: true }
        );

        // Verify Notification
       const { NotificationService } = await import('@/lib/notification/service');
       expect(NotificationService.send).toHaveBeenCalledWith(
            mockUserId, 
            'system', 
            expect.objectContaining({
                title: 'ถึงคิวของคุณแล้ว!'
            })
        );
    });

    it('should set lock to "available" if queue is empty', async () => {
         // Setup Mocks: No queue
         const mockSort = vi.fn().mockResolvedValue(null);
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (Queue.findOne as any).mockReturnValue({ sort: mockSort });

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (Lock.findByIdAndUpdate as any).mockResolvedValue({
             _id: mockLockId,
             lockNumber: 'A1',
             status: 'available'
         });

         // Test
         await processLockAvailability(mockLockId);

         // Verify Lock Update
         expect(Lock.findByIdAndUpdate).toHaveBeenCalledWith(
             mockLockId,
             expect.objectContaining({
                 status: 'available',
                 $unset: { reservedTo: 1, reservationExpiresAt: 1 }
             }),
             { new: true }
         );
         
         // Verify Notifier
         const { notifyInterestedUsers } = await import('@/lib/interest-notifier');
         expect(notifyInterestedUsers).toHaveBeenCalledWith(mockLockId);
    });
});
