import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';
import { canAccessAdminPanel } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!canAccessAdminPanel(session?.user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // 1. Revenue Data (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const payments = await Payment.find({
      status: 'approved',
      verifiedAt: { $gte: sevenDaysAgo }
    }).select('amount verifiedAt');

    const revenueMap = new Map();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueMap.set(dateStr, 0);
    }

    payments.forEach(p => {
      const dateStr = p.verifiedAt!.toISOString().split('T')[0];
      if (revenueMap.has(dateStr)) {
        revenueMap.set(dateStr, revenueMap.get(dateStr) + p.amount);
      }
    });

    const revenueData = Array.from(revenueMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Zone Data (Bookings/Active per zone)
    const zones = await Zone.find({ isActive: true });
    const locks = await Lock.find({ isActive: true });
    
    const zoneStats = zones.map(zone => {
      const zoneLocks = locks.filter(l => l.zone.toString() === zone._id.toString());
      const occupied = zoneLocks.filter(l => ['booked', 'rented', 'reserved'].includes(l.status)).length;
      return {
        name: zone.name,
        occupied: occupied,
        total: zoneLocks.length,
        percentage: zoneLocks.length > 0 ? Math.round((occupied / zoneLocks.length) * 100) : 0
      };
    });

    return NextResponse.json({
      revenueData,
      zoneStats
    });
  } catch (error) {
    console.error('Error fetching admin charts data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
