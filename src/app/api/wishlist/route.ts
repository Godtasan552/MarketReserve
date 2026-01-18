
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InterestList from '@/models/InterestList';
import { auth } from '@/lib/auth/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expanded = searchParams.get('expanded') === 'true';

    await connectDB();
    
    if (expanded) {
      const interests = await InterestList.find({ user: session.user.id })
        .populate({
          path: 'lock',
          populate: { path: 'zone' }
        });
        
      // Filter out any interests where the lock might have been deleted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locks = interests.map((i: any) => i.lock).filter((l: any) => l);
      return NextResponse.json(locks);
    } else {
      const interests = await InterestList.find({ user: session.user.id }).select('lock');
      const lockIds = interests.map(i => i.lock);
      return NextResponse.json(lockIds);
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lockId } = await req.json();
    if (!lockId) {
      return NextResponse.json({ error: 'Lock ID is required' }, { status: 400 });
    }

    await connectDB();

    const existing = await InterestList.findOne({ user: session.user.id, lock: lockId });

    if (existing) {
      await InterestList.findByIdAndDelete(existing._id);
      return NextResponse.json({ bookmarked: false });
    } else {
      await InterestList.create({
        user: session.user.id,
        lock: lockId,
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
