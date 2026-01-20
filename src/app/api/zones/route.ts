import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Zone from '@/models/Zone';

export async function GET() {
  try {
    await connectDB();
    const zones = await Zone.find({ isActive: true }).select('_id name description').sort({ name: 1 });
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลโซนได้' }, { status: 500 });
  }
}
