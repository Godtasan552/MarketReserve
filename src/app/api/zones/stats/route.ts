import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Zone from '@/models/Zone';
import Lock from '@/models/Lock';

export async function GET() {
  try {
    await connectDB();

    // Get all active zones
    const zones = await Zone.find({ isActive: true }).lean();

    // For each zone, count total locks and available locks
    const zoneStats = await Promise.all(
      zones.map(async (zone) => {
        const totalLocks = await Lock.countDocuments({ 
          zone: zone._id,
          isActive: true 
        });

        const availableLocks = await Lock.countDocuments({
          zone: zone._id,
          isActive: true,
          status: 'available'
        });

        return {
          _id: zone._id.toString(),
          name: zone.name,
          description: zone.description || '',
          totalLocks,
          availableLocks
        };
      })
    );

    return NextResponse.json(zoneStats);
  } catch (error) {
    console.error('Error fetching zone stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone statistics' },
      { status: 500 }
    );
  }
}
