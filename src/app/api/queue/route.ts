
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Queue from '@/models/Queue';
import { auth } from '@/lib/auth/auth';

// GET: Get queue info for a specific lock (count, and if user is in it + position)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lockId = searchParams.get('lockId');
    const myQueues = searchParams.get('my');

    await connectDB();
    const session = await auth();

    if (myQueues === 'true') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const queues = await Queue.find({ user: session.user.id })
        .populate({
          path: 'lock',
          populate: { path: 'zone' }
        })
        .sort({ createdAt: -1 });
      
      // Calculate position for each queue
      const queuesWithPosition = await Promise.all(queues.map(async (q) => {
        const position = await Queue.countDocuments({ 
          lock: q.lock._id, 
          createdAt: { $lt: q.createdAt } 
        });
        return {
          ...q.toObject(),
          userPosition: position + 1
        };
      }));

      return NextResponse.json(queuesWithPosition);
    }

    if (!lockId) {
      return NextResponse.json({ error: 'Lock ID required' }, { status: 400 });
    }

    // Get total count
    const count = await Queue.countDocuments({ lock: lockId });

    let userPosition = null;
    let inQueue = false;

    if (session?.user?.id) {
      // Check if user is in queue
      const userQueueEntry = await Queue.findOne({ lock: lockId, user: session.user.id });
      
      if (userQueueEntry) {
        inQueue = true;
        // Count how many are ahead (older createdAt)
        const position = await Queue.countDocuments({ 
          lock: lockId, 
          createdAt: { $lt: userQueueEntry.createdAt } 
        });
        userPosition = position + 1;
      }
    }

    return NextResponse.json({ count, inQueue, userPosition });
  } catch (error) {
    console.error('Error fetching queue info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Join/Leave Queue
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lockId, action } = await req.json(); // action: 'join' | 'leave'
    if (!lockId) return NextResponse.json({ error: 'Lock ID required' }, { status: 400 });

    await connectDB();

    if (action === 'join') {
        try {
            // Check if already exists to avoid unique error if race condition
            const exists = await Queue.findOne({ lock: lockId, user: session.user.id });
            if (!exists) {
                await Queue.create({ lock: lockId, user: session.user.id });
            }
            return NextResponse.json({ success: true, message: 'Joined queue' });
        } catch (err: unknown) {
             // 11000 is duplicate key error
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((err as any).code === 11000) {
                 return NextResponse.json({ success: true, message: 'Already in queue' });
            }
            throw err;
        }

    } else if (action === 'leave') {
        await Queue.findOneAndDelete({ lock: lockId, user: session.user.id });
        return NextResponse.json({ success: true, message: 'Left queue' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error toggling queue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
