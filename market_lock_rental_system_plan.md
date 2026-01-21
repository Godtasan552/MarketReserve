# ระบบเช่าล็อคตลาด (Market Lock Rental System) - ฉบับปรับปรุง

เอกสารฉบับนี้เป็นแผนออกแบบระบบเช่าล็อคตลาดที่ครอบคลุมและพร้อมใช้งานจริง ครอบคลุมทั้งฝั่งผู้ใช้ (User) และผู้ดูแลระบบ (Admin) พร้อมมาตรการความปลอดภัย คุณลักษณะทางเทคนิค และการจัดการกรณีพิเศษ

---

## 1. วัตถุประสงค์ของระบบ
- อำนวยความสะดวกให้ผู้ค้าสามารถเลือกและเช่าล็อคตลาดได้ด้วยตนเอง
- ลดภาระงานเอกสารและการจัดการของผู้ดูแลตลาด
- เพิ่มความโปร่งใสในการจอง การชำระเงิน และสิทธิ์การเช่า
- รองรับการเช่าหลายรูปแบบ (รายวัน / รายสัปดาห์ / รายเดือน)
- รองรับการแจ้งเตือนอัตโนมัติสำหรับการต่อสัญญา

---

## 2. บทบาทผู้ใช้งานในระบบ

### 2.1 ผู้ใช้ (User / ผู้เช่า)
- บุคคลทั่วไปที่ต้องการเช่าล็อคตลาด
- สามารถดูพื้นที่ จอง เช่า ชำระเงิน และดูประวัติการเช่าได้
- สามารถ "สนใจ" ล็อคเพื่อรับการแจ้งเตือนเมื่อล็อคว่าง

### 2.2 ผู้ดูแลระบบ (Admin)
- ผู้จัดการตลาด
- ดูแลพื้นที่ ราคา การอนุมัติการเช่า การชำระเงิน และการแจ้งเตือน
- จัดการข้อพิพาทและคืนเงินกรณีพิเศษ

---

## 3. เทคโนโลยีที่ใช้ (Technology Stack)

### 3.1 Frontend
- **Framework**: Next.js 16 with TypeScript
- **Styling**: Bootstrap 5.3+ (with React Bootstrap และ Sass สำหรับ customization)
- **Icons**: Bootstrap Icons หรือ React Icons
- **State Management**: React Context / Zustand
- **Form Handling**: React Hook Form + Zod validation

### 3.2 Backend
- **API**: Next.js API Routes / Server Actions
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js v5 with JWT strategy
- **Real-time**: Socket.io หรือ Pusher (สำหรับแจ้งเตือนทันที)

### 3.3 Third-party Services
- **File Storage**: Cloudinary (เก็บสลิปการชำระเงิน)
- **OCR**: Tesseract.js หรือ Google Cloud Vision API
- **Email**: Resend หรือ SendGrid
- **SMS** (ตัวเลือก): Twilio
- **Push Notifications**: Web Push API

### 3.4 การ Deployment & DevOps
- **Hosting**: Vercel (Cloud)
- **Containerization**: **Docker** (Dockerfile + Docker Compose)
- **Database Architecture**: 
  - Production: MongoDB Atlas (Cloud)
  - Local/Dev: MongoDB in Docker
- **CDN**: Cloudinary CDN
- **CI/CD**: Vercel Git Integration / GitHub Actions (Cron Triggers)

---

## 3.5 Bootstrap Setup และ Configuration

### 3.5.1 การติดตั้ง (Installation)

**ติดตั้ง dependencies ที่จำเป็น:**
```bash
npm install bootstrap react-bootstrap sass
npm install --save-dev @types/react-bootstrap
```

**Packages:**
- `bootstrap`: Core Bootstrap CSS และ JavaScript
- `react-bootstrap`: Bootstrap components ที่สร้างใหม่สำหรับ React (ไม่ต้องใช้ jQuery)
- `sass`: สำหรับ customize Bootstrap variables
- `@types/react-bootstrap`: TypeScript type definitions

### 3.5.2 การ Setup Bootstrap ใน Next.js

**1. Import Bootstrap CSS ใน `app/layout.tsx` (App Router):**
```typescript
// app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
// Custom SCSS overrides (ถ้ามี)
import '@/styles/custom-bootstrap.scss';
import './globals.css';
```

**2. สร้างไฟล์ Custom SCSS** (`styles/custom-bootstrap.scss`):
```scss
// Theme: Premium Emerald (เขียวเข้มหรูหรา)
$primary: #10b981;        // Emerald Green
$primary-dark: #065f46;   // Forest Green
$secondary: #64748b;      // Slate
$success: #10b981;
$info: #3b82f6;
$warning: #f59e0b;
$danger: #ef4444;
$dark: #0f172a;
$light: #ffffff;

// Glassmorphism & UI Aesthetics
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}

.card-lift {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }
}

.status-badge {
  border-radius: 50rem;
  padding: 0.35em 0.8em;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
```

**3. เพิ่ม Google Fonts** ใน `app/layout.tsx`:
```typescript
import { Inter, Noto_Sans_Thai } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['thai'], 
  weight: ['300', '400', '500', '700'] 
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.className} ${notoSansThai.className}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 3.5.3 Bootstrap Icons Setup

**ติดตั้ง:**
```bash
npm install bootstrap-icons
```

**Import ใน layout:**
```typescript
import 'bootstrap-icons/font/bootstrap-icons.css';
```

**การใช้งาน:**
```tsx
<i className="bi bi-calendar-check me-2"></i>
<i className="bi bi-geo-alt-fill text-primary"></i>
```

### 3.5.4 React Bootstrap Components

**ตัวอย่างการใช้งาน:**

```tsx
// components/LockCard.tsx
import { Card, Button, Badge } from 'react-bootstrap';

export default function LockCard({ lock }) {
  return (
    <Card className="card-lock h-100">
      <Card.Img variant="top" src={lock.image} alt={lock.name} />
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">{lock.name}</Card.Title>
          <Badge bg={lock.status === 'available' ? 'success' : 'danger'}>
            {lock.status === 'available' ? 'ว่าง' : 'ถูกเช่า'}
          </Badge>
        </div>
        <Card.Text className="text-muted">
          <i className="bi bi-geo-alt me-1"></i>
          {lock.zone}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="fs-5 fw-bold text-primary">
            ฿{lock.pricing.daily}/วัน
          </span>
          <Button variant="primary" size="sm">
            <i className="bi bi-calendar-plus me-1"></i>
            จองเลย
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
```

### 3.5.5 Utility Classes ที่ใช้บ่อย

**Layout & Spacing:**
- `container`, `container-fluid` - Container layouts
- `row`, `col-*` - Grid system
- `d-flex`, `justify-content-*`, `align-items-*` - Flexbox
- `m-*`, `p-*`, `mt-*`, `mb-*`, `mx-*`, `my-*` - Margin & Padding
- `gap-*` - Gap spacing

**Typography:**
- `fs-*` - Font sizes (1-6)
- `fw-*` - Font weights (light, normal, bold)
- `text-*` - Text alignment, colors
- `lead` - Lead paragraph

**Colors:**
- `text-primary`, `text-success`, `text-danger`, etc.
- `bg-primary`, `bg-light`, `bg-dark`, etc.
- `bg-opacity-*` - Background opacity

**Components:**
- `btn`, `btn-primary`, `btn-lg`, `btn-sm`
- `badge`, `badge bg-success`
- `alert`, `alert-warning`
- `card`, `card-body`, `card-title`
- `modal`, `modal-dialog`
- `navbar`, `navbar-expand-lg`
- `form-control`, `form-label`, `form-select`

### 3.5.6 Responsive Design

Bootstrap ใช้ breakpoints ดังนี้:
- `xs` - Extra small (< 576px) - Mobile portrait
- `sm` - Small (≥ 576px) - Mobile landscape
- `md` - Medium (≥ 768px) - Tablet
- `lg` - Large (≥ 992px) - Desktop
- `xl` - Extra large (≥ 1200px) - Large desktop
- `xxl` - Extra extra large (≥ 1400px) - Extra large desktop

**ตัวอย่างการใช้งาน:**
```tsx
<div className="row">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
  <div className="col-12 col-md-6 col-lg-3">
    <LockCard />
  </div>
</div>
```

### 3.5.7 การ Customize Theme (Optional)

**สร้างไฟล์** `styles/custom-theme.scss`:
```scss
// 1. Include functions first
@import '~bootstrap/scss/functions';

// 2. Override default variables
$primary: #007bff;
$secondary: #6c757d;
$body-bg: #f8f9fa;
$body-color: #212529;
$enable-shadows: true;
$enable-gradients: false;
$enable-rounded: true;

// 3. Include Bootstrap
@import '~bootstrap/scss/bootstrap';

// 4. Add custom styles
.custom-navbar {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## 4. โครงสร้างระบบฝั่งผู้ใช้ (User Side)

### 4.1 หน้าแรก (Home / Market Overview)
- แสดงภาพรวมตลาด (Map View หรือ Grid View)
- แบ่งโซน (A, B, C, D)
- ใช้สีแสดงสถานะล็อค:
  - **เขียว**: ว่าง
  - **เหลือง**: มีผู้จอง / รอชำระเงิน
  - **แดง**: ถูกเช่าแล้ว
  - **ส้ม**: ใกล้หมดสัญญา (เหลือ < 3 ชม.)
- ปุ่ม "สนใจ" (Watch) เพื่อรับการแจ้งเตือน

### 4.2 หน้ารายละเอียดล็อค (Lock Detail)
- รูปภาพจริงของล็อค (อัปโหลดจาก Cloudinary)
- ข้อมูลโซน ราคา และขนาด
- ปฏิทินแสดงวันที่ว่าง / ไม่ว่าง (Calendar View)
- เลือกระยะเวลาเช่า: รายวัน / รายสัปดาห์ / รายเดือน
- **การเลือกวัน (Start Date)**: ระบบจะล็อควันที่เริ่มต้นเป็น **"วันที่ปัจจุบัน"** โดยอัตโนมัติ (Read-only) เพื่อความเรียบง่ายและป้องกันความสับสนในการจองล่วงหน้าที่ยังไม่เปิดให้บริการ
- แสดงราคารวมทันที

### 4.3 ระบบจองและการแจ้งเตือน (Booking & Notification)

#### 4.3.1 กระบวนการจอง
- เมื่อผู้ใช้กดจอง ระบบจะ:
  - ตรวจสอบความว่างของช่วงเวลา (Real-time validation)
  - ตรวจสอบการซ้อนทับด้วยการ lock ฐานข้อมูล
  - สร้างการจองพร้อม pending status
  - ให้เวลาชำระเงินภายใน **3 ชั่วโมง**

#### 4.3.2 ระบบ Interest List (สนใจล็อค)
- ผู้ใช้สามารถกด "สนใจ" ล็อคที่กำลังถูกเช่า
- เมื่อเหลือ **3 ชั่วโมง** ก่อนหมดสัญญา:
  1. ระบบแจ้งเตือน**ทุกคนใน Interest List พร้อมกัน** (ไม่มีสิทธิพิเศษผู้เช่าเดิม)
  2. หมดเวลา → ระบบเปิดจอง
  3. **First-Come-First-Served**: ใครจองก่อนได้ก่อน
  4. หากมีหลายคนจอง → เข้าระบบคิว FIFO

#### 4.3.3 ระบบคิว (Queue System) - ปรับปรุง
- หากมีหลายคนจองล็อคเดียวกัน → เข้าคิว **FIFO** (First In First Out)
- **คนแรกในคิว** ต้องชำระภายใน **3 ชั่วโมง**
- หากไม่ชำระ → ยกเลิกอัตโนมัติ + **คนที่ 2 เลื่อนขึ้นมาแทน** พร้อม countdown 3 ชม. ใหม่
- **การล้างคู่อัตโนมัติ (Auto-Clear Queue)**: เมื่อมีผู้ใช้ชำระเงินสำเร็จและได้รับอนุมัติ ระบบจะล้างคิวของล็อคนั้นโดยอัตโนมัติ และส่งแจ้งเตือน `queue_cancelled` ให้ทุกคนในคิวทราบว่าล็อคถูกเช่าไปแล้ว
- **ข้อจำกัด**: ผู้ใช้ไม่สามารถเข้าคิวได้หากมีการจอง (Booking) ที่ยังใช้งานได้หรืออยู่ระหว่างรอชำระเงินสำหรับล็อคนั้นอยู่แล้ว

#### 4.3.4 กฎป้องกันการเอาเปรียบระบบ (Anti-Gaming Rules)

**Rule 1: จองได้ทีละ 1 ล็อค**
- ผู้ใช้สามารถจองได้เพียง **1 ล็อค** ในแต่ละครั้ง
- ห้ามมีการจองหลายล็อคพร้อมกัน (รอชำระหลายล็อค)
- เมื่อชำระเงินสำเร็จแล้ว จึงสามารถจองล็อคอื่นได้
- **เหตุผล**: ป้องกันการกั๊กล็อค (Lock Hogging)

**Rule 2: Queue Drop Tracking**
- ระบบติดตามจำนวนครั้งที่ "หลุดคิว" (ไม่ชำระเงินภายใน 3 ชม.)
- นับย้อนหลัง **7 วัน**
- แสดงจำนวนครั้งที่หลุดในโปรไฟล์ผู้ใช้

**Rule 3: Penalty System**

| ครั้งที่หลุด (7 วัน) | การดำเนินการ |
|---------------------|-------------|
| **ครั้งที่ 1** | ⚠️ เตือนทาง Email + In-app notification |
| **ครั้งที่ 2** | ⚠️⚠️ เตือนรุนแรง + แสดง banner สีแดง |
| **ครั้งที่ 3** | 🚫 **แบนชั่วคราว 24-48 ชม.** |
| **ครั้งที่ 4+** (ถ้ามี) | 🚫 แบน 7 วัน + พิจารณา blacklist |

**ตัวอย่าง UI Warning**:
```
⚠️ คำเตือน: คุณหลุดคิว 2 ครั้งในรอบ 7 วัน
หากหลุดอีก 1 ครั้ง คุณจะถูกระงับสิทธิ์การจอง 24-48 ชั่วโมง
```

#### 4.3.5 Rate Limiting (ปรับปรุง)
- จำกัดการจองสูงสุด **1 การจองที่รอชำระ** ต่อผู้ใช้ (ลดจาก 3)
- ป้องกัน spam booking
- ป้องกันการกั๊กล็อคหลายอัน

### 4.4 ระบบชำระเงิน (Payment)

#### 4.4.1 การอัปโหลดสลิป
- รองรับไฟล์: JPG, PNG, PDF (สูงสุด 5MB)
- อัปโหลดไปยัง Cloudinary
- File hash verification เพื่อตรวจสอบความซ้ำซ้อน

#### 4.4.2 OCR Processing (Human-in-the-loop)
- ระบบ OCR อ่านข้อมูลจากสลิปอัตโนมัติเพื่อ **ช่วยกรอกข้อมูลเบื้องต้น** (Pre-fill):
  - จำนวนเงิน
  - วันที่ / เวลาโอน
  - หมายเลขอ้างอิง
- **Optional**: ระบบทำงานต่อได้แม้ OCR อ่านไม่ออก
- **Human Review**: ผู้ใช้ต้องตรวจสอบและยืนยันความถูกต้องก่อนส่ง (Human-in-the-loop)
- แสดง Confidence Score ให้ทราบ

#### 4.4.3 Validation
- ตรวจสอบจำนวนเงินตรงกับยอดที่ต้องชำระ (±5 บาท tolerance)
- ตรวจสอบเวลาโอนอยู่ภายใน 24 ชม.
- ป้องกันการอัปโหลดสลิปซ้ำ (Hash checking)

### 4.5 สถานะการเช่า (Rental Status)
- **รอชำระเงิน** (Pending Payment) - เหลือเวลา countdown
- **รอตรวจสอบ** (Pending Verification) - Admin กำลังตรวจสอบสลิป
- **เช่าสำเร็จ** (Active) - อนุมัติแล้ว พร้อมใช้งาน
- **จองไม่สำเร็จ** (Cancelled) - หมดเวลาชำระ หรือ Admin ปฏิเสธ
- **หมดสัญญา** (Expired)

### 4.6 การแจ้งเตือน (Notification)

#### 4.6.1 ประเภทการแจ้งเตือน (Event-based Architecture)

ระบบใช้ **NotificationService** เป็นศูนย์กลางในการจัดการ (Dispatcher) โดยบันทึก In-App Notification ลงฐานข้อมูลเสมอ และส่ง Email ตามความสำคัญของเหตุการณ์

**Notification Policy:**

| เหตุการณ์ (Event) | In-App (Web) | Email (ปิดการใช้งาน) | หมายเหตุ |
|-------------------|--------------|-------|----------|
| **จองสำเร็จ** (Booking Created) | ✅ | ❌ | แจ้งยอดชำระและ Deadline ในแอป |
| **อัปโหลดสลิป** (Payment Uploaded) | ❌ | ❌ | ลด Spam (ผู้ใช้รู้ตัวอยู่แล้ว) |
| **อนุมัติ/ปฏิเสธ** (Approved/Rejected)| ✅ | ❌ | แจ้งผลการตรวจสอบทันทีในแอป |
| **แจ้งเตือนคิวถูกยกเลิก** (Queue Cancelled) | ✅ | ❌ | แจ้งเมื่อล็อคถูกเช่าไปแล้ว |
| **แจ้งเตือนก่อนหมดอายุ** (Expiring) | ✅ | ❌ | แจ้งเตือนเพื่อให้ต่อสัญญา |
| **ระบบ/ทั่วไป** (System) | ✅ | ❌ | แจ้งข่าวสารทั่วไป |

- **Real-time**: ใช้การ Polling หน้าเว็บระยะสั้น (Demo-ready) หรือ WebSocket (Future)
- **Email Provider**: Resend หรือ SendGrid

### 4.7 การยกเลิกและคืนเงิน (Cancellation & Refund)

#### 4.7.1 การยกเลิก
- **ก่อนชำระเงิน**: สามารถยกเลิกได้ฟรี (ไม่มีค่าปรับ)
- **หลังชำระเงิน**: ต้องติดต่อ Admin เพื่อขอคืนเงิน

#### 4.7.2 นโยบายคืนเงิน
- **ไม่มีการคืนเงินอัตโนมัติ**
- ต้องติดต่อเจ้าหน้าที่ตลาดโดยตรง
- Admin พิจารณาแต่ละกรณีตามดุลยพินิจ
- แนวทาง (ไม่บังคับ):
  - ภายใน 24 ชม. หลังจอง → พิจารณาคืน 100%
  - >7 วัน ก่อนเริ่มเช่า → พิจารณาคืน 80%
  - < 7 วัน → พิจารณาเป็นกรณีพิเศษ

### 4.8 รายการเช่าของฉัน (My Rentals / Bookings) - ปรับปรุง
- แสดงรายการแบบ 3 แท็บหลัก (ปรับปรุงจากเดิม):
  1. **การเช่า** (Rentals): รายการที่อยู่ระหว่างรอชำระเงิน, รอตรวจสอบ และที่กำลังใช้งานอยู่ (Active)
  2. **จองคิว** (Queues): รายการลำดับคิวที่ผู้ใช้เข้าไปจองไว้
  3. **ประวัติ** (History): รายการที่หมดสัญญา (Expired) หรือถูกยกเลิก (Cancelled)
- **การใช้คำใน UI**: เปลี่ยนจาก "การจอง" (Booking) มาเป็น "การเช่า" (Rental) เพื่อให้สื่อความหมายถึงการใช้งานพื้นที่ได้ชัดเจนขึ้น
- Filter ตาม: สถานะ (Smart Filter ตามแท็บ), โซน, หมายเลขล็อค
- Export เป็น PDF หรือ Excel
- ดาวน์โหลดสลิปและใบเสร็จเก่า

---

## 5. โครงสร้างระบบฝั่งผู้ดูแล (Admin Side)

### 5.1 Dashboard
- **สรุปภาพรวม**:
  - จำนวนล็อคว่าง / ถูกเช่า / รอชำระเงิน
  - กราฟรายได้ (Revenue Line Chart) สี Emerald พร้อม Tooltip แบบกำหนดเอง
  - กราฟสัดส่วนการจองตามโซน (Zone Booking Bar Chart) พร้อมรองรับชื่อโซนยาว (Auto-width adjustment)
  - อัตราการเช่าเฉลี่ย (Occupancy Rate)
- **Responsive Layout**:
  - Desktop (LG+): Sidebar แนวตั้ง (Sticky Vertical Sidebar) พร้อม Branding และปุ่ม Logout
  - Mobile (<LG): Navbar ด้านบนแบบยุบได้ (Collapsible Top Navbar) พร้อม Toggle Hamburger เมนู
- **UI Enhancements**:
  - ตารางการจองใช้ Badge แบบ Pill-style พร้อมไอคอน `bi-shop` สำหรับหมายเลขล็อค
  - แสดงสถานะโซนพร้อมไอคอน `bi-geo-alt`
  - แก้ไขปัญหา "ไม่ระบุโซน" โดยการใช้ Nested Population ใน API

- **แจ้งเตือนสำคัญ**:
  - สลิปรอตรวจสอบ (จำนวน badge)
  - ล็อคที่กำลังจะหมดสัญญา
  - การจองที่หมดเวลาชำระ

### 5.2 การจัดการตลาด (Market Management)

#### 5.2.1 Zone Management
- เพิ่ม / แก้ไข / ปิดโซน
- กำหนดพื้นที่และลักษณะโซน
- อัปโหลดรูปภาพโซน (Cloudinary)

#### 5.2.2 Lock Management
- เพิ่ม / แก้ไข / ลบล็อค
- กำหนดขนาด, โซน, สถานะ
- อัปโหลดรูปภาพล็อค (หลายรูป)
- ปิดล็อคชั่วคราว (Maintenance mode)

### 5.3 การจัดการแพ็กเกจเช่า (Rental Plan)
- กำหนดราคาแต่ละโซน
- ตั้งค่าราคาตามระยะเวลา (รายวัน/สัปดาห์/เดือน)
- ส่วนลด (ถ้ามี):
  - เช่านาน discount
  - Seasonal promotion
- กำหนด Minimum/Maximum rental period

### 5.4 การจัดการการจอง (Booking Management)
- ดูรายการจองทั้งหมด (ทุกสถานะ)
- Filter และ Search
- ยกเลิกหรือแก้ไขการจองในกรณีพิเศษ
- ดู Interest List ของแต่ละล็อค
- Manual booking (จองแทนผู้ใช้)

### 5.5 การตรวจสอบการชำระเงิน (Payment Verification)

#### 5.5.1 Queue ตรวจสอบ
- แสดงรายการสลิปที่รอตรวจสอบ (เรียงตาม FIFO)
- แสดงข้อมูล OCR พร้อม confidence score
- แสดงรูปสลิปแบบเต็ม (Zoom ได้)
- แสดงข้อมูลการจองที่เกี่ยวข้อง

#### 5.5.2 การตัดสินใจ
- **อนุมัติ**:
  - สร้าง receipt อัตโนมัติ
  - ส่ง email ยืนยัน
  - เปลี่ยนสถานะล็อคเป็น "Active"
  - บันทึกประวัติการชำระเงิน
  
- **ปฏิเสธ**:
  - ระบุเหตุผล (จำนวนเงินไม่ถูกต้อง, สลิปปลอม, etc.)
  - ส่งการแจ้งเตือนให้ผู้ใช้
  - ให้โอกาสอัปโหลดสลิปใหม่ (ภายใน 1 ชม.)
  - หากหมดเวลา → ยกเลิกการจอง

#### 5.5.3 Fraud Detection
- ตรวจสอบสลิปซ้ำ (Hash-based)
- Flag suspicious patterns (ผู้ใช้เดียวกันอัปโหลดหลายครั้ง)
- Blacklist ผู้ใช้ที่มีพฤติกรรมผิดปกติ

### 5.6 การจัดการเวลาเช่า (Time Management)

#### 5.6.1 Auto Contract Expiry
- GitHub Actions Trigger ทำงานทุก 15 นาที
- ตรวจสอบสัญญาที่กำลังจะหมด
- ส่งการแจ้งเตือนตามกำหนดเวลา (7d, 3d, 1d)

#### 5.6.2 Notification Workflow (3 ชั่วโมงก่อนหมด)
- เมื่อเหลือ 3 ชม. → แจ้งเตือน**ทุกคนใน Interest List พร้อมกัน**
- **ไม่มีสิทธิพิเศษสำหรับผู้เช่าเดิม**
- หมดเวลา → ระบบเปิดจอง
- ทุกคนสามารถจองพร้อมกัน (First-Come-First-Served)

#### 5.6.3 Queue Management
- ดูรายการคิวของแต่ละล็อค
- ดูสถานะการชำระเงินของแต่ละคน
- Manual override (เลื่อนคิว, ยกเลิกคิว)

### 5.7 การจัดการผู้ใช้ (User Management)
- ดูรายชื่อผู้ใช้ทั้งหมด
- ดูประวัติการเช่าของแต่ละคน
- ดูสถิติ (จำนวนครั้งที่เช่า, ยอดรวม)
- **ดูจำนวนครั้งที่หลุดคิว (Queue Drop History)**
- ระงับบัญชีกรณีผิดกติกา
- จัดการ Blacklist
- **จัดการ Temporary Ban** (ดู ban status, ปลดแบนก่อนเวลา)

### 5.8 ระบบคืนเงิน (Refund Management)
- ดูคำขอคืนเงินทั้งหมด
- **ไม่มีการคืนเงินอัตโนมัติ** - ทุกกรณีเป็น manual process
- Admin พิจารณาแต่ละกรณี:
  - ดูเหตุผลการขอคืน
  - ตรวจสอบวันที่จอง vs วันที่เริ่มเช่า
  - ใช้ดุลยพินิจตัดสินใจ
- แนวทางแนะนำ (ไม่บังคับ):
  - ภายใน 24 ชม. → พิจารณาคืน 100%
  - >7 วัน → พิจารณาคืน 80%
  - <7 วัน → เป็นกรณีพิเศษ
- บันทึก refund history พร้อมเหตุผล
- สามารถคืนบางส่วนได้ (partial refund)

### 5.9 รายงานและสถิติ (Reports & Analytics)
- **รายงานรายได้**:
  - รายวัน / รายสัปดาห์ / รายเดือน / รายปี
  - แยกตามโซน
  - Export PDF / Excel

- **รายงานการใช้งาน**:
  - Occupancy Rate แต่ละโซน
  - ล็อคที่ได้รับความนิยมสูงสุด/ต่ำสุด
  - Average rental duration

- **สถิติผู้ใช้**:
  - ผู้เช่าประจำ (Repeat customers)
  - New vs Returning users
  - จำนวนการยกเลิก

---

## 6. ความปลอดภัย (Security)

### 6.1 Authentication & Authorization

#### 6.1.1 ระบบยืนยันตัวตน
- **Email/Password** แบบดั้งเดิม
- **Email OTP** (ตัวเลือก)
- **Social Login**: Google, Facebook (OAuth 2.0)
- **Session Management**: JWT tokens (HttpOnly cookies)
- **Token Rotation**: Refresh token strategy
- **Session Timeout**: 7 วัน (Remember me) / 24 ชม. (ปกติ)

#### 6.1.2 Role-Based Access Control (RBAC)
- **User**: ดู, จอง, ชำระเงิน
- **Admin**: Full access ยกเว้น Superadmin features
- **Superadmin**: จัดการ Admin accounts, ระบบ settings

#### 6.1.3 Password Security
- Minimum 8 characters
- ต้องมี uppercase, lowercase, numbers
- bcrypt hashing (salt rounds: 12)
- Password reset via email with token expiry (15 นาที)

### 6.2 Payment Security

#### 6.2.1 File Upload Validation
- **Whitelist**: `.jpg`, `.jpeg`, `.png`, `.pdf` only
- **Max size**: 5MB
- **Virus scan** (ClamAV หรือ cloud-based)
- **Image verification**: ตรวจสอบว่าเป็นรูปจริง ไม่ใช่ malware

#### 6.2.2 Cloudinary Security
- Signed uploads (ป้องกันการอัปโหลดโดยตรง)
- Transformation lock (ป้องกันการแก้ไข URL)
- Access control (Private mode สำหรับสลิป)
- Auto-delete หลัง 2 ปี (compliance)

#### 6.2.3 Anti-Fraud Measures
- Hash-based duplicate detection
- Rate limiting (สูงสุด 5 uploads / user / day)
- IP tracking
- Flagellantที่สงสัย

### 6.3 API Security

#### 6.3.1 Transport Security
- **HTTPS only** (TLS 1.3)
- **HSTS** (HTTP Strict Transport Security)
- **Certificate Pinning** (Mobile apps)

#### 6.3.2 Request Security
- **CORS**: Whitelist specific origins only
- **CSRF Protection**: SameSite cookies + Anti-CSRF tokens
- **Request Validation**: Zod schema validation on all endpoints
- **SQL/NoSQL Injection**: Mongoose parameterized queries

#### 6.3.3 Rate Limiting
- **Global**: 100 requests / 15 min / IP
- **Auth endpoints**: 5 failed attempts / 15 min → lockout
- **Payment upload**: 5 uploads / hour / user
- **Booking**: 3 pending bookings max / user

### 6.4 Data Protection

#### 6.4.1 Encryption
- **At rest**: MongoDB encryption at rest (Atlas built-in)
- **In transit**: TLS 1.3
- **Sensitive fields**: Encrypt PII (phone numbers) with AES-256

#### 6.4.2 Privacy (PDPA Compliance)
- Consent checkbox สำหรับ Terms & Privacy Policy
- Right to access data (User profile export)
- Right to delete (Account deletion with data anonymization)
- Data retention: 2 years after last activity

#### 6.4.3 Logging & Monitoring
- **Audit logs**: Admin actions, payment approvals
- **Security logs**: Failed logins, suspicious activities
- **Error tracking**: Sentry หรือ LogRocket
- **Uptime monitoring**: UptimeRobot หรือ Pingdom

### 6.5 Infrastructure Security

#### 6.5.1 Environment Variables
- **.env.local** (Git-ignored)
- **Vercel secrets** สำหรับ production
- **Rotation**: API keys หมุนเวียนทุก 90 วัน

#### 6.5.2 Database Security
- **MongoDB Atlas**: IP Whitelist
- **Database user**: Principle of least privilege
- **Backup encryption**: Enabled
- **Network isolation**: VPC (ถ้าเป็น Enterprise)

---

## 7. Database Schema (MongoDB Collections)

### 7.1 users
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  phone: String (encrypted),
  role: String (enum: ['user', 'admin', 'superadmin']),
  isActive: Boolean,
  isBlacklisted: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  preferences: {
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    }
  }
}
```

### 7.2 zones
```javascript
{
  _id: ObjectId,
  name: String (e.g., "Zone A"),
  description: String,
  images: [String], // Cloudinary URLs
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 7.3 locks
```javascript
{
  _id: ObjectId,
  lockNumber: String (unique),
  zone: ObjectId (ref: 'zones'),
  size: {
    width: Number,
    length: Number,
    unit: String (enum: ['m', 'sqm'])
  },
  pricing: {
    daily: Number,
    weekly: Number,
    monthly: Number
  },
  description: String,
  images: [String], // Cloudinary URLs
  status: String (enum: ['available', 'booked', 'rented', 'maintenance']), 
  // Note: Future plan is to remove 'booked' status and calculate availability from Booking collection
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 7.4 bookings
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'users'),
  lock: ObjectId (ref: 'locks'),
  startDate: Date (indexed),
  endDate: Date (indexed),
  rentalType: String (enum: ['daily', 'weekly', 'monthly']),
  totalAmount: Number,
  status: String (enum: ['pending_payment', 'pending_verification', 'active', 'expired', 'cancelled']),
  paymentDeadline: Date,
  payment: ObjectId (ref: 'payments'),
  isRenewal: Boolean,
  previousBooking: ObjectId (ref: 'bookings'),
  createdAt: Date,
  updatedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}
```

### 7.5 payments
```javascript
{
  _id: ObjectId,
  booking: ObjectId (ref: 'bookings'),
  user: ObjectId (ref: 'users'),
  amount: Number,
  slipImage: String, // Cloudinary URL
  slipHash: String (indexed), // For duplicate detection
  ocrResult: {
    amount: Number,
    date: Date,
    time: String,
    referenceNumber: String,
    confidence: Number
  },
  ocrEdited: Boolean,
  status: String (enum: ['pending', 'approved', 'rejected']),
  verifiedBy: ObjectId (ref: 'users'), // Admin who verified
  verifiedAt: Date,
  rejectionReason: String,
  receiptUrl: String, // Generated receipt
  createdAt: Date,
  updatedAt: Date
}
```

### 7.6 interest_list
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'users', indexed),
  lock: ObjectId (ref: 'locks', indexed),
  notified: Boolean,
  createdAt: Date
}
// Compound index: (lock, user) - unique
```

### 7.7 notifications (New Schema)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'users', indexed),
  type: String (enum: [
    'booking_created', 
    'booking_approved', 
    'booking_rejected', 
    'booking_cancelled', 
    'booking_expiring', 
    'system'
  ]),
  title: String,
  message: String,
  link: String, // Optional deep link
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
// Index: { user: 1, isRead: 1, createdAt: -1 }
```

### 7.8 refunds
```javascript
{
  _id: ObjectId,
  booking: ObjectId (ref: 'bookings'),
  user: ObjectId (ref: 'users'),
  amount: Number,
  reason: String,
  status: String (enum: ['pending', 'approved', 'rejected', 'processed']),
  processedBy: ObjectId (ref: 'users'),
  processedAt: Date,
  createdAt: Date
}
```

### 7.7 user_penalties (เพิ่มใหม่)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'users', indexed),
  type: String (enum: ['queue_drop', 'payment_fraud', 'other']),
  occurredAt: Date,
  bookingRef: ObjectId (ref: 'bookings'),
  status: String (enum: ['active', 'expired']),
  expiresAt: Date, // สำหรับนับ 7 วัน
  createdAt: Date
}
```

### 7.8 user_bans (เพิ่มใหม่)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'users', indexed),
  reason: String, // "3 queue drops in 7 days"
  dropCount: Number, // จำนวนครั้งที่หลุดก่อนโดนแบน
  bannedAt: Date,
  banDuration: Number, // ชั่วโมง (24, 48, 168)
  unbannedAt: Date,
  isActive: Boolean,
  createdAt: Date
}
```

### 7.9 Indexes (เพิ่มเติม)
```javascript
// bookings
db.bookings.createIndex({ lock: 1, startDate: 1, endDate: 1 })
db.bookings.createIndex({ user: 1, status: 1 })
db.bookings.createIndex({ status: 1, paymentDeadline: 1 })

// payments
db.payments.createIndex({ slipHash: 1 })
db.payments.createIndex({ status: 1, createdAt: -1 })

// interest_list
db.interest_list.createIndex({ lock: 1, user: 1 }, { unique: true })

// notifications
db.notifications.createIndex({ user: 1, read: 1, createdAt: -1 })
```

---

## 8. Business Rules และ Edge Cases

### 8.1 การจองและชำระเงิน

#### Rule 1: Single Booking Limit (จองได้ทีละ 1 ล็อค)
- **ห้ามจองหลายล็อคพร้อมกัน**
- Validation:
  ```javascript
  const existingPendingBooking = await Booking.findOne({
    user: userId,
    status: { $in: ['pending_payment', 'pending_verification'] }
  });
  if (existingPendingBooking) {
    throw new Error('คุณมีการจองที่รอชำระอยู่แล้ว กรุณาชำระให้เสร็จก่อนจองล็อคใหม่');
  }
  ```
- **เหตุผล**: ป้องกันการกั๊กล็อค

#### Rule 2: Overlap Prevention
- **ห้ามจอง** ล็อคที่มีการจองซ้อนทับกัน
- **Validation**:
  ```javascript
  const hasOverlap = await Booking.findOne({
    lock: lockId,
    status: { $in: ['pending_payment', 'pending_verification', 'active'] },
    $or: [
      { startDate: { $lte: newEndDate }, endDate: { $gte: newStartDate } }
    ]
  });
  if (hasOverlap) throw new Error('Lock is not available for selected period');
  ```

#### Rule 2: Payment Timeout
- **3 ชั่วโมง** หลังจอง ต้องอัปโหลดสลิป
- **Cron job** ทำงานทุก 15 นาที → ยกเลิกจองที่หมดเวลา
- **Grace Period**: 5 นาทีเผื่อ network delay

#### Rule 3: Race Condition Handling
- ใช้ **MongoDB Transaction** สำหรับการจอง
- **Pessimistic Locking**:
  ```javascript
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lock = await Lock.findOneAndUpdate(
      { _id: lockId, status: 'available' },
      { status: 'booked' },
      { session, new: true }
    );
    if (!lock) throw new Error('Lock already booked');
    
    await Booking.create([bookingData], { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
  ```

### 8.2 การต่อสัญญา (Renewal)

#### Rule 4: Interest List Notification (3 ชั่วโมงก่อนหมด)
- **3 ชั่วโมง** ก่อนหมดสัญญา:
  1. ส่งแจ้งเตือน**ทุกคน** ใน Interest List **พร้อมกัน** (Email + Push)
  2. **ไม่มีสิทธิพิเศษสำหรับผู้เช่าเดิม**
  3. หมดเวลา → ระบบเปิดจอง
  4. First-Come-First-Served: ใครจองก่อนได้ก่อน

#### Rule 5: Queue System with Auto-Promotion & Clear
- หากมีหลายคนจองล็อคเดียวกัน → เข้าคิว FIFO
- **คนแรก** ต้องชำระใน 3 ชม.
- หากไม่ชำระ → ยกเลิก + **คนที่ 2 เลื่อนขึ้นอัตโนมัติ**
- **เมื่อมีการชำระเงินสำเร็จ**: ระบบจะลบรายการคิวทั้งหมดของล็อคนั้นทิ้ง และส่งแจ้งเตือน `queue_cancelled`
- กระบวนการนี้ทำต่อเนื่องจนกว่าจะมีคนชำระสำเร็จ หรือคิวหมด

### 8.3 การคืนเงิน (Refund)

#### Rule 6: Queue Drop Penalty System

**A. ติดตามการหลุดคิว**
```javascript
async function trackQueueDrop(userId, bookingId) {
  // บันทึกการหลุดคิว
  await UserPenalty.create({
    user: userId,
    type: 'queue_drop',
    occurredAt: new Date(),
    bookingRef: bookingId,
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน
  });
  
  // นับจำนวนครั้งใน 7 วันล่าสุด
  const dropCount = await UserPenalty.countDocuments({
    user: userId,
    type: 'queue_drop',
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  // ประเมินและลงโทษ
  await evaluatePenalty(userId, dropCount);
}
```

**B. Penalty Logic**
```javascript
async function evaluatePenalty(userId, dropCount) {
  if (dropCount === 1) {
    // ครั้งที่ 1: เตือนอ่อน
    await sendWarning(userId, 'light', dropCount);
  } else if (dropCount === 2) {
    // ครั้งที่ 2: เตือนรุนแรง
    await sendWarning(userId, 'severe', dropCount);
  } else if (dropCount >= 3) {
    // ครั้งที่ 3+: แบน
    const banDuration = dropCount === 3 ? 24 : (dropCount === 4 ? 48 : 168); // 24h, 48h, 7d
    await banUser(userId, banDuration, dropCount);
  }
}

async function banUser(userId, hours, dropCount) {
  await UserBan.create({
    user: userId,
    reason: `${dropCount} queue drops in 7 days`,
    dropCount,
    bannedAt: new Date(),
    banDuration: hours,
    unbannedAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    isActive: true
  });
  
  // ส่งการแจ้งเตือน
  await sendBanNotification(userId, hours);
}
```

**C. ตรวจสอบก่อนจอง**
```javascript
async function canUserBook(userId) {
  // ตรวจสอบว่าโดน ban อยู่หรือไม่
  const activeBan = await UserBan.findOne({
    user: userId,
    isActive: true,
    unbannedAt: { $gt: new Date() }
  });
  
  if (activeBan) {
    const hoursLeft = Math.ceil((activeBan.unbannedAt - new Date()) / (1000 * 60 * 60));
    throw new Error(`คุณถูกระงับสิทธิ์การจอง เหลืออีก ${hoursLeft} ชั่วโมง`);
  }
  
  return true;
}
```

**D. Auto Unban Cron Job**
```javascript
// ทำงานทุก 1 ชม.
async function autoUnban() {
  const now = new Date();
  
  await UserBan.updateMany(
    { isActive: true, unbannedAt: { $lte: now } },
    { $set: { isActive: false } }
  );
}
```

#### Rule 7: Manual Refund Policy
- **ไม่มีการคืนเงินอัตโนมัติ**
- ผู้ใช้ยื่นคำขอคืนเงินผ่านระบบ
- Admin พิจารณาแต่ละกรณีตามดุลยพินิจ
- แนวทางแนะนำ:
  ```javascript
  function getRefundGuideline(booking) {
    const now = new Date();
    const hoursSinceBooking = (now - booking.createdAt) / (1000 * 60 * 60);
    const daysUntilStart = (booking.startDate - now) / (1000 * 60 * 60 * 24);
    
    if (hoursSinceBooking <= 24) {
      return { suggested: 100, note: 'ภายใน 24 ชม.' };
    } else if (daysUntilStart > 7) {
      return { suggested: 80, note: '>7 วันก่อนเริ่ม' };
    } else {
      return { suggested: 0, note: 'พิจารณาเป็นกรณีพิเศษ' };
    }
  }
  ```
- Admin สามารถ override % ได้ตามความเหมาะสม

#### Rule 7: Cancellation (ก่อนชำระ)
- ก่อนชำระเงิน → ยกเลิกฟรี (ไม่มีค่าปรับ)
- หลังชำระ → ต้องผ่าน Admin approval

### 8.4 Error Handling

#### Edge Case 1: OCR Read Error
- แสดง Confidence Score < 80% → เตือนผู้ใช้
- ให้ผู้ใช้แก้ไขข้อมูลด้วยตนเอง
- Admin ตรวจสอบอีกครั้ง

#### Edge Case 2: Network Failure During Upload
- Retry mechanism (3 attempts)
- Resumable upload (Cloudinary SDK)
- หากล้มเหลว → แสดง error message ชัดเจน
- ไม่หัก payment deadline

#### Edge Case 3: Duplicate Payment Slip
- ตรวจสอบ slipHash ก่อนบันทึก
- หากซ้ำ → แจ้งเตือน "สลิปนี้ถูกใช้งานแล้ว"
- ให้อัปโหลดสลิปใหม่

#### Edge Case 4: Admin Reject Payment
- ระบุเหตุผลชัดเจน
- ให้โอกาสอัปโหลดใหม่ภายใน **1 ชั่วโมง**
- หากหมดเวลา → ยกเลิกการจอง
- ไม่มีการคืนเงิน (เพราะยังไม่ได้จ่ายจริง)

#### Edge Case 5: Concurrent Booking
- ใช้ Database Transaction
- Lock record ระหว่างการจอง
- แสดง error message: "ล็อคนี้เพิ่งถูกจองไป กรุณาเลือกล็อคอื่น"

---

## 9. การทดสอบ (Testing Strategy)

### 9.1 Unit Tests
- **Business Logic**: Mongoose models, utility functions
- **Coverage target**: 80%+
- **Tools**: Jest, @testing-library/react

### 9.2 Integration Tests
- **Booking Flow**: จองล็อค → อัปโหลดสลิป → Admin อนุมัติ → Confirmed
- **Payment Flow**: OCR → Validation → Approval
- **Renewal Flow**: 3-hour notification → User renew → Success
- **Tools**: Supertest (API testing)

### 9.3 E2E Tests
- **Critical Paths**:
  - User Registration → Login → Browse → Book → Pay → Confirmed
  - Admin Login → Verify Payment → Approve
- **Tools**: Playwright หรือ Cypress

### 9.4 Load Testing
- **Scenarios**:
  - 50 ผู้ใช้จอง lock พร้อมกัน
  - 100 concurrent payment uploads
- **Tools**: k6 หรือ Artillery
- **Target**: Response time < 2s for 95th percentile

---

## 10. Deployment & DevOps

### 10.1 CI/CD Pipeline
- **GitHub Actions** หรือ **Vercel CI**
- **Stages**:
  1. Lint & Type Check
  2. Unit Tests
  3. Build
  4. Integration Tests (staging DB)
  5. Deploy to Vercel (Preview)
  6. E2E Tests
  7. Deploy to Production (manual approve)

### 10.2 Environment
- **Development**: Local MongoDB + `.env.local`
- **Staging**: MongoDB Atlas (free tier) + Vercel Preview
- **Production**: MongoDB Atlas (M10+) + Vercel Production

### 10.3 Monitoring
- **Uptime**: UptimeRobot (ping every 5 min)
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **Logs**: Vercel Logs + MongoDB Atlas Logs

### 10.4 Backup & Recovery
- **Database Backup**:
  - MongoDB Atlas: Auto backup every day
  - Retention: 7 days (Free), 30 days (Paid)
- **File Backup (Cloudinary)**:
  - Auto-backup: Cloudinary Backup feature
  - Manual backup: Export to S3 (monthly)
- **Recovery Plan**:
  - RTO (Recovery Time Objective): < 4 hours
  - RPO (Recovery Point Objective): < 24 hours

---

## 11. สรุป

ระบบเช่าล็อคตลาดนี้ถูกออกแบบให้รองรับการใช้งานจริงในระดับ Production พร้อมด้วย:

✅ **ความปลอดภัยระดับสูง**: Authentication, Authorization, Payment Security, API Security  
✅ **UI/UX Modern**: Bootstrap 5.3+ พร้อม React Bootstrap และ custom theming  
✅ **Business Logic สมบูรณ์**: Renewal notification flow, First-Come-First-Served booking, Queue management  
✅ **Edge Case Handling**: Race conditions, OCR errors, Network failures  
✅ **Scalability**: MongoDB Atlas, Cloudinary CDN, Vercel Edge Functions  
✅ **Monitoring & Recovery**: Backup, Logging, Error tracking  

ระบบนี้ช่วยให้ทั้งผู้เช่าและผู้ดูแลตลาดทำงานได้สะดวก รวดเร็ว ลดความผิดพลาด และพร้อมขยายในอนาคต

---

**หมายเหตุ**: เอกสารนี้สามารถนำไปใช้เป็นเอกสารออกแบบระบบ (System Design) หรือประกอบรายงานโปรเจ็กต์จบได้ 

---

## 12. Bootstrap Migration Benefits

การเปลี่ยนจาก TailwindCSS มาใช้ Bootstrap มีข้อดีดังนี้:

✅ **Component System**: React Bootstrap มี pre-built components พร้อมใช้ (Modal, Navbar, Forms, etc.)  
✅ **Easier for Beginners**: Class names ที่เข้าใจง่ายกว่า (`btn-primary` vs `bg-blue-500`)  
✅ **Consistent Design**: มี design system ที่สมบูรณ์แบบจาก Bootstrap  
✅ **Customization**: สามารถ customize variables ผ่าน SCSS ได้อย่างละเอียด  
✅ **Thai Language Support**: ใช้งานได้ดีกับ Noto Sans Thai font  
✅ **Responsive Grid**: Grid system ที่เข้าใจง่ายและใช้งานสะดวก  

**Package ที่ต้องติดตั้ง:**
```bash
# สำหรับผู้ที่ Clone โปรเจกต์ไปใหม่ (ติดตั้งทั้งหมด)
npm install

# หรือติดตั้งเฉพาะส่วนที่จำเป็น
npm install bootstrap react-bootstrap sass bootstrap-icons
npm install --save-dev @types/react-bootstrap
```

หากมีคำถามเพิ่มเติมสามารถติดต่อทีมพัฒนาได้ทันที
