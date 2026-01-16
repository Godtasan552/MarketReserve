# คู่มือการพัฒนาระบบเช่าล็อคตลาด (Developer Implementation Guide)

## ภาพรวม

คู่มือนี้ออกแบบมาสำหรับนักพัฒนาที่จะพัฒนาระบบเช่าล็อคตลาดตามแผนที่วางไว้ แบ่งเป็น 4 phases พร้อม timeline และ checklist โดยละเอียด

**รอบการพัฒนา**: 8 สัปดาห์  
**ทีม**: 2-3 developers

---

## Phase 1: Foundation Setup (สัปดาห์ 1-2)

### Week 1: Project Setup & Database

#### Day 1-2: Initialize Project
```bash
# สร้าง Next.js 16 project (ไม่ใช้ Tailwind)
npx create-next-app@latest market-lock-system --typescript --app --no-tailwind

# ติดตั้ง dependencies สำหรับ UI (Bootstrap)
npm install bootstrap react-bootstrap sass bootstrap-icons
npm install --save-dev @types/react-bootstrap

# ติดตั้ง dependencies หลักอื่นๆ
npm install mongoose next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers
npm install -D @types/bcryptjs
```

**Checklist**:
- [ ] Setup Git repository
- [ ] Configure `.gitignore` (เพิ่ม `.env.local`)
- [ ] Setup ESLint + Prettier
- [ ] Create folder structure:
  ```
  /app
    /api
    /(auth)
      /login
      /register
    /(user)
      /locks
      /bookings
      /history
    /(admin)
      /dashboard
      /locks
      /payments
  /components
    /ui
    /forms
    /layout
  /lib
    /db
    /auth
    /utils
  /models
  /styles
    custom-bootstrap.scss
    globals.css
  /types
  ```

#### Day 3-4: MongoDB Atlas Setup
**Steps**:
1. สร้าง MongoDB Atlas account (free M0)
2. Create cluster → เลือก region ใกล้เคียง (Singapore)
3. Create database user
4. Whitelist IP (0.0.0.0/0 สำหรับ development)
5. Get connection string

**Mongoose Setup** (`/lib/db/mongoose.ts`):
```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

**Environment Variables** (`.env.local`):
```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=your-resend-key
```

**Checklist**:
- [ ] MongoDB Atlas cluster created
- [ ] Connection successful
- [ ] Environment variables configured
- [ ] `.env.example` created

#### Day 5-7: Create Mongoose Models

**User Model** (`/models/User.ts`):
```typescript
import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  isBlacklisted: boolean;
  emailVerified: boolean;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  // ... rest of fields
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser, UserModel>('User', userSchema);
```

**สร้างทั้งหมด 8 models**:
- [ ] User
- [ ] Zone
- [ ] Lock
- [ ] Booking
- [ ] Payment
- [ ] InterestList
- [ ] Notification
- [ ] Refund

### Week 2: Authentication

#### Day 1-3: NextAuth.js Setup

**Auth Config** (`/lib/auth/auth.config.ts`):
```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials');
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

**API Route** (`/app/api/auth/[...nextauth]/route.ts`):
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Checklist**:
- [ ] NextAuth.js configured
- [ ] Login page created
- [ ] Register page created
- [ ] Google OAuth setup (ตัวเลือก)
- [ ] Protected routes middleware
- [ ] Role-based access control (RBAC)

#### Day 4-5: UI Components

**Login Form** (ตัวอย่างใช้ React Hook Form + Zod):
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';

const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: true,
      callbackUrl: '/locks',
    });
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">เข้าสู่ระบบ</h2>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>อีเมล</Form.Label>
              <Form.Control 
                type="email" 
                {...register('email')} 
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>รหัสผ่าน</Form.Label>
              <Form.Control 
                type="password" 
                {...register('password')} 
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              เข้าสู่ระบบ
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
```

**Checklist**:
- [ ] Login/Register forms with validation
- [ ] Error handling UI
- [ ] Loading states
- [ ] Responsive design (mobile-first)

---

## Phase 2: Core Features (สัปดาห์ 3-5)

### Week 3: Lock Management & Viewing

#### Day 1-2: Admin Lock CRUD

**API Routes**:
- `POST /api/admin/locks` - Create lock
- `GET /api/admin/locks` - List all locks
- `PATCH /api/admin/locks/[id]` - Update lock
- `DELETE /api/admin/locks/[id]` - Delete lock

**Example** (`/app/api/admin/locks/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const data = await req.json();
  
  // Validate with Zod
  const lock = await Lock.create(data);
  return NextResponse.json(lock, { status: 201 });
}

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get('zone');
  const status = searchParams.get('status');

  const query: any = {};
  if (zone) query.zone = zone;
  if (status) query.status = status;

  const locks = await Lock.find(query).populate('zone');
  return NextResponse.json(locks);
}
```

**Checklist**:
- [ ] Lock CRUD APIs
- [ ] Zone CRUD APIs
- [ ] Image upload to Cloudinary
- [ ] Admin UI for lock management
- [ ] Form validation

#### Day 3-5: User Lock Browsing

**Features**:
- Grid view และ Map view (ใช้ `react-leaflet` หรือ `mapbox-gl`)
- Bootstrap Grid (`Row`, `Col`) สำหรับ Card layout
- Filter (zone, size, price) - ใช้ `Form.Select` และ `Form.Check`
- Search bar - ใช้ `InputGroup`
- Lock detail page พร้อม image gallery

**Availability Calendar**:
```typescript
// /components/AvailabilityCalendar.tsx
import { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';

export default function AvailabilityCalendar({ lockId }) {
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    fetch(`/api/locks/${lockId}/availability`)
      .then(res => res.json())
      .then(data => setBookedDates(data.bookedDates));
  }, [lockId]);

  const tileDisabled = ({ date }) => {
    return bookedDates.some(bookedDate =>
      date >= new Date(bookedDate.startDate) &&
      date <= new Date(bookedDate.endDate)
    );
  };

  return <Calendar tileDisabled={tileDisabled} />;
}
```

**Checklist**:
- [ ] Lock listing page
- [ ] Lock detail page
- [ ] Availability calendar
- [ ] Filter & search functionality
- [ ] Responsive image gallery

### Week 4-5: Booking System

#### Booking Flow Implementation

**1. Create Booking API** (`/app/api/bookings/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const { lockId, startDate, endDate, rentalType } = await req.json();

    // 1. Check overlapping bookings
    const overlap = await Booking.findOne({
      lock: lockId,
      status: { $in: ['pending_payment', 'pending_verification', 'active'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) }}
      ]
    }).session(session);

    if (overlap) {
      throw new Error('Lock is not available for selected period');
    }

    // 2. Lock the lock (pessimistic locking)
    const lock = await Lock.findOneAndUpdate(
      { _id: lockId, status: 'available' },
      { status: 'booked' },
      { session, new: true }
    );

    if (!lock) {
      throw new Error('Lock is no longer available');
    }

    // 3. Create booking
    const paymentDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
    const booking = await Booking.create([{
      user: session.user.id,
      lock: lockId,
      startDate,
      endDate,
      rentalType,
      totalAmount: calculateTotal(lock, startDate, endDate, rentalType),
      status: 'pending_payment',
      paymentDeadline,
    }], { session });

    await session.commitTransaction();
    return NextResponse.json(booking[0], { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
```

**2. Payment Upload with Cloudinary**:
```typescript
// /app/api/payments/upload/route.ts
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('slip') as File;

  // Validate file
  if (!file || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  // Generate hash for duplicate detection
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Check duplicate
  const existing = await Payment.findOne({ slipHash: hash });
  if (existing) {
    return NextResponse.json({ error: 'Slip already used' }, { status: 400 });
  }

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(
    `data:${file.type};base64,${buffer.toString('base64')}`,
    {
      folder: 'payment-slips',
      resource_type: 'auto',
    }
  );

  // OCR processing (Tesseract.js or Google Vision)
  const ocrResult = await processOCR(result.secure_url);

  // Save payment
  const payment = await Payment.create({
    booking: bookingId,
    user: session.user.id,
    slipImage: result.secure_url,
    slipHash: hash,
    ocrResult,
    status: 'pending',
  });

  return NextResponse.json(payment);
}
```

**3. Payment Timeout Cron Job**:
```typescript
// /app/api/cron/cancel-expired-bookings/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const now = new Date();

  // Find expired bookings
  const expiredBookings = await Booking.find({
    status: 'pending_payment',
    paymentDeadline: { $lt: now },
  });

  // Cancel and release locks
  for (const booking of expiredBookings) {
    booking.status = 'cancelled';
    booking.cancelledAt = now;
    booking.cancellationReason = 'Payment timeout';
    await booking.save();

    // Release lock
    await Lock.findByIdAndUpdate(booking.lock, { status: 'available' });
  }

  return NextResponse.json({ cancelled: expiredBookings.length });
}
```

**Setup Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/cancel-expired-bookings",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/send-renewal-notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Checklist**:
- [ ] Booking creation with transaction
- [ ] Overlap detection
- [ ] Payment upload to Cloudinary
- [ ] OCR processing (Tesseract.js)
- [ ] Payment verification UI (Admin)
- [ ] Cron jobs for timeout
- [ ] Rate limiting (3 pending bookings max)

---

## Phase 3: Advanced Features (สัปดาห์ 6-7)

### Week 6: Notification System

#### 1. Email Notifications (Resend)
```typescript
// /lib/email/send-email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation(booking) {
  await resend.emails.send({
    from: 'Market Lock <noreply@marketlock.com>',
    to: booking.user.email,
    subject: 'การจองสำเร็จ - ล็อค #' + booking.lock.lockNumber,
    html: `<p>คุณได้จองล็อค ${booking.lock.lockNumber} เรียบร้อยแล้ว</p>
           <p>กรุณาชำระเงินภายใน: ${booking.paymentDeadline}</p>`,
  });
}
```

#### 2. Web Push Notifications
```typescript
// /lib/notifications/push.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@marketlock.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(subscription, payload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

#### 3. Renewal Notification Cron
```typescript
// /app/api/cron/send-renewal-notifications/route.ts
export async function GET(req: NextRequest) {
  await connectDB();
  const threeHoursLater = new Date(Date.now() + 3 * 60 * 60 * 1000);

  // Find bookings expiring in ~3 hours
  const expiringBookings = await Booking.find({
    status: 'active',
    endDate: {
      $gte: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      $lte: threeHoursLater,
    },
    renewalNotificationSent: { $ne: true },
  }).populate('user lock');

  for (const booking of expiringBookings) {
    // Send notification to current renter
    await sendRenewalNotification(booking);
    booking.renewalNotificationSent = true;
    await booking.save();
  }

  return NextResponse.json({ notified: expiringBookings.length });
}
```

**Checklist**:
- [ ] Email notifications (Resend)
- [ ] Push notifications setup
- [ ] Renewal notification cron
- [ ] Interest list notification
- [ ] In-app notification UI
- [ ] Notification preferences

### Week 7: Analytics Dashboard

#### Admin Dashboard คอมโพเนนต์

**Revenue Chart** (ใช้ `recharts`):
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function RevenueChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
    </LineChart>
  );
}
```

**Checklist**:
- [ ] Revenue dashboard
- [ ] Occupancy rate analytics
- [ ] Popular zones heatmap
- [ ] User statistics
- [ ] Export reports (PDF/Excel)

---

## Phase 4: Testing & Deployment (สัปดาห์ 8)

### Week 8, Day 1-3: Testing

#### Unit Tests
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**Test Example**:
```typescript
// __tests__/lib/utils/calculateTotal.test.ts
import { calculateTotal } from '@/lib/utils/booking';

describe('calculateTotal', () => {
  it('should calculate daily rental correctly', () => {
    const lock = { pricing: { daily: 100, weekly: 600, monthly: 2000 } };
    const total = calculateTotal(lock, '2024-01-01', '2024-01-03', 'daily');
    expect(total).toBe(200); // 2 days
  });
});
```

#### Integration Tests
```typescript
// __tests__/api/bookings.test.ts
import { POST } from '@/app/api/bookings/route';

describe('/api/bookings', () => {
  it('should prevent overlapping bookings', async () => {
    // Test booking overlap scenario
  });
});
```

**Checklist**:
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Load testing (k6)

### Week 8, Day 4-5: Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Environment Variables** (Vercel Dashboard):
- Add all `.env.local` variables
- Enable Vercel Cron Jobs
- Configure custom domain

**Checklist**:
- [ ] Deploy to Vercel
- [ ] Configure MongoDB Atlas production cluster
- [ ] Setup Cloudinary production
- [ ] Configure custom domain + SSL
- [ ] Setup monitoring (Sentry, Vercel Analytics)
- [ ] Backup verification

---

## Testing Checklist

### Manual Testing Scenarios
1. **User Flow**:
   - [ ] Register → Verify Email → Login
   - [ ] Browse locks → Filter by zone
   - [ ] View lock detail → Check calendar
   - [ ] Book lock → Upload slip → OCR reads correctly
   - [ ] Admin approves → Receive confirmation email

2. **Edge Cases**:
   - [ ] Two users book same lock simultaneously → One fails
   - [ ] Upload duplicate slip → Error message
   - [ ] Payment timeout → Booking cancelled
   - [ ] OCR confidence <80% → Manual editing works
   - [ ] Renewal flow: 3-hour notice → Renew successfully

3. **Admin Flow**:
   - [ ] Create/Edit/Delete locks
   - [ ] Verify payments (Approve/Reject)
   - [ ] View analytics dashboard
   - [ ] Process refund requests

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] No console.errors in production build
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Cloudinary folders organized

### Post-deployment
- [ ] SSL certificate active
- [ ] Cron jobs running (check logs)
- [ ] Email sending works
- [ ] OCR processing works
- [ ] Monitoring active (Sentry)
- [ ] Backup running daily

### Performance Targets
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] API response time < 500ms (95th percentile)
- [ ] Lighthouse score > 90

---

## Maintenance & Monitoring

### Daily
- [ ] Check error logs (Sentry)
- [ ] Verify cron jobs ran successfully
- [ ] Monitor payment verification queue

### Weekly
- [ ] Review analytics (user growth, revenue)
- [ ] Check database backup
- [ ] Update dependencies (security patches)

### Monthly
- [ ] Performance audit
- [ ] User feedback review
- [ ] Feature prioritization

---

## ทรัพยากรเพิ่มเติม

- **Bootstrap Docs**: https://getbootstrap.com/docs/5.3/
- **React Bootstrap**: https://react-bootstrap.netlify.app/
- **Bootstrap Icons**: https://icons.getbootstrap.com/
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **NextAuth.js**: https://next-auth.js.org/
- **Cloudinary**: https://cloudinary.com/documentation
- **Tesseract.js**: https://tesseract.projectnaptha.com/

---

**หมายเหตุ**: คู่มือนี้เป็นแนวทางทั่วไป สามารถปรับแต่งตามความเหมาะสมของทีมและโปรเจกต์
