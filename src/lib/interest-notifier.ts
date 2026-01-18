
import connectDB from '@/lib/db/mongoose';
import InterestList from '@/models/InterestList';
import Notification from '@/models/Notification';
import Lock from '@/models/Lock';

export async function notifyInterestedUsers(lockId: string) {
  try {
    await connectDB();
    
    // Find all users interested in this lock
    // We notify everyone regardless of 'notified' status because if it becomes available AGAIN, they might want to know again.
    // Or maybe we should respect notified=true?
    // If I book it, then cancel, it becomes free.
    // If I just watched it, and it becomes free, I get notified.
    // If I don't book it, and it stays free, I shouldn't get spammed.
    // But this function is called ON transition to available. So it happens once per transition.
    
    const interests = await InterestList.find({ lock: lockId });
    if (!interests.length) return;

    const lock = await Lock.findById(lockId);
    if (!lock) return;

    // Create notifications for each user
    const notifications = interests.map(interest => ({
      user: interest.user,
      type: 'system',
      title: 'ล็อกที่คุณสนใจว่างแล้ว!',
      message: `ล็อก ${lock.lockNumber} ที่คุณติดตามสถานะไว้ ว่างพร้อมให้จองแล้วในขณะนี้`,
      link: `/locks/${lock._id}`,
      isRead: false,
    }));

    await Notification.insertMany(notifications);
    
    // Update notified status (though strictly we might not rely on it if we notify on every transition)
    await InterestList.updateMany({ lock: lockId }, { notified: true });

    console.log(`Sent notifications to ${interests.length} users for lock ${lock.lockNumber}`);

  } catch (error) {
    console.error('Error sending interest notifications:', error);
  }
}
