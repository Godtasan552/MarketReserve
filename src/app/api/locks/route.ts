import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';
interface LockQuery {
  isActive?: boolean;
  zone?: string;
  status?: string;
  'pricing.daily'?: { $gte?: number; $lte?: number };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get('zone');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status');

    // Query for active locks only for public viewing
    const query: LockQuery = { isActive: true };
    
    if (zone) query.zone = zone;
    if (status) query.status = status;
    
    if (minPrice || maxPrice) {
      const dailyPrice: { $gte?: number; $lte?: number } = {};
      if (minPrice) dailyPrice.$gte = Math.max(0, Number(minPrice));
      if (maxPrice) dailyPrice.$lte = Math.max(0, Number(maxPrice));
      query['pricing.daily'] = dailyPrice;
    }

    const locks = await Lock.find(query)
      .populate('zone', 'name description')
      .sort({ lockNumber: 1 });

    return NextResponse.json(locks);
  } catch (error) {
    console.error('Error fetching public locks:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลล็อกได้' }, { status: 500 });
  }
}
