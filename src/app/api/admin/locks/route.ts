import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import { lockSchema } from '@/lib/validations/lock';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get('zone');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (zone) query.zone = zone;
    if (status) query.status = status;
    if (search) {
      // Strip special characters to avoid regex injection
      const sanitizedSearch = search.replace(/[^a-zA-Z0-9\s-]/g, '');
      query.lockNumber = { $regex: sanitizedSearch, $options: 'i' };
    }

    const locks = await Lock.find(query).populate('zone').sort({ lockNumber: 1 });
    return NextResponse.json(locks);
  } catch (error) {
    console.error('Error fetching locks:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลล็อกได้' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_locks')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = lockSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    await connectDB();
    
    // Check for duplicate lock number
    const existingLock = await Lock.findOne({ lockNumber: validationResult.data.lockNumber });
    if (existingLock) {
      return NextResponse.json({ error: 'รหัสล็อกนี้มีอยู่ในระบบแล้ว' }, { status: 409 });
    }

    const newLock = await Lock.create(validationResult.data);
    
    return NextResponse.json(newLock, { status: 201 });
  } catch (error) {
    console.error('Error creating lock:', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างข้อมูลล็อกได้' }, { status: 500 });
  }
}
