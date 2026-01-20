
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import Queue from '@/models/Queue';
import { NotificationService } from '@/lib/notification/service';

export async function processLockAvailability(lockId: string) {
  try {
    await connectDB();
    
    // 1. Check if there is a Queue for this lock
    const nextQueueItem = await Queue.findOne({ lock: lockId }).sort({ createdAt: 1 });

    if (nextQueueItem) {
      // --- Case A: Someone is in queue ---
      // Reserve for next user for 30 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes window

      const lock = await Lock.findByIdAndUpdate(
        lockId,
        {
          status: 'reserved',
          reservedTo: nextQueueItem.user,
          reservationExpiresAt: expiresAt
        },
        { new: true }
      ).populate('reservedTo'); // If you need user details

      if (lock) {
         // Notify the user who got the reservation
         // Note: We need email for EmailProvider, id for InApp
         // Assuming NotificationService handles fetching user email if needed or we pass ID
         await NotificationService.send(nextQueueItem.user.toString(), 'system', {
            title: 'ถึงคิวของคุณแล้ว!',
            message: `ล็อก ${lock.lockNumber} ว่างแล้วและถูกจองสิทธิ์ให้คุณเป็นเวลา 2 ชั่วโมง กรุณาทำรายการภายในเวลาที่กำหนด`,
            link: `/locks/${lock._id}`
         });

         console.log(`Lock ${lock.lockNumber} reserved for Queue User ${nextQueueItem.user}`);

         // Audit Log
         const AuditLog = (await import('@/models/AuditLog')).default;
         await AuditLog.create({
            action: 'QUEUE_RESERVED',
            targetId: lockId,
            details: { 
               reservedTo: nextQueueItem.user,
               expiresAt: expiresAt
            }
         });
      }

    } else {
      // --- Case B: No one in queue ---
      // Set to available
      const lock = await Lock.findByIdAndUpdate(
        lockId,
        {
          status: 'available',
          $unset: { reservedTo: 1, reservationExpiresAt: 1 }
        },
        { new: true }
      );

      if (lock) {
          // Notify Bookmark/Interest list users
          console.log(`Lock ${lock.lockNumber} is now available (No queue). Notifying interested users.`);
          
          // Original notification logic ported here
          // This should ideally use NotificationService.broadcast or loop
          // For now, let's keep it simple or import specific logic if needed.
          // Re-using NotifyInterestedUsers logic but ensuring it doesn't conflict
          // Ideally: call notifyInterestedUsers(lockId) from here if it is exported
          
          // Let's import the one we wrote earlier to keep DRY
          const { notifyInterestedUsers } = await import('@/lib/interest-notifier');
          await notifyInterestedUsers(lockId);
      }
    }

  } catch (error) {
    console.error(`Error processing lock availability for ${lockId}:`, error);
  }
}
