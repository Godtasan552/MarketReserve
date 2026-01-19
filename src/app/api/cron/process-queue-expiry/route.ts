
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import Queue from '@/models/Queue';
import { processLockAvailability } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    // Find locks where reservation has expired
    const expiredLocks = await Lock.find({
        status: 'reserved',
        reservationExpiresAt: { $lt: now } 
    }).populate('reservedTo');

    if (expiredLocks.length === 0) {
       return NextResponse.json({ success: true, processed: 0 });
    }

    let processedCount = 0;

    for (const lock of expiredLocks) {
        // 1. Remove the user who missed their chance from Queue
        if (lock.reservedTo) {
            console.log(`Lock ${lock.lockNumber}: User ${lock.reservedTo._id} missed reservation. Removing from queue.`);
            await Queue.findOneAndDelete({ lock: lock._id, user: lock.reservedTo._id });
        }

        // 2. Call processor to find next person OR set available
        await processLockAvailability(lock._id.toString());
        
        processedCount++;
    }

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error) {
    console.error('Error processing queue expiry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
