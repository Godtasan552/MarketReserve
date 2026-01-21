# คู่มือการเตรียมระบบด้วย Docker (MarketHub Docker Guide)

เอกสารนี้สรุปขั้นตอนการแพ็คระบบ MarketHub ลง Docker และวิธีส่งต่อให้เพื่อนร่วมทีมรันระบบพร้อมข้อมูลจริงครับ

---

## 1. ไฟล์โครงสร้างที่สำคัญ (Infrastructure)
ในโปรเจกต์ได้เตรียมไฟล์หลักไว้ 4 ไฟล์ ดังนี้:
1.  **`Dockerfile`**: ใช้ Multi-stage build เพื่อประสิทธิภาพสูงสุด (แบ่งเป็น stage ติดตั้ง Dependencies, Stage Build และ Stage Runner สำหรับ Production)
2.  **`docker-compose.yml`**: ใช้สำหรับรันทั้ง **ตัว Web App** และ **Database (MongoDB)** พร้อมกันในคำสั่งเดียว
3.  **`.dockerignore`**: ใช้ยกเว้นไฟล์ที่ไม่จำเป็น (เช่น `node_modules`, `.next`, `.env`) เพื่อความรวดเร็วในการ Build
4.  **`next.config.ts`**: แก้ไขเพิ่ม `output: 'standalone'` เพื่อให้ Next.js สร้างไฟล์ที่จำเป็นต่อการรัน Docker โดยเฉพาะ

---

## 2. ขั้นตอนการเตรียมข้อมูลจริง (สำหรับผู้ส่ง)
หากต้องการส่งให้เพื่อนรันโดยใช้ **ข้อมูลจริง** จาก Cloud Atlas:
1.  เปิด **MongoDB Compass** และเชื่อมต่อเข้ากับ Atlas (Cloud) ของคุณ
2.  เลือก Database และ Collections ที่ต้องการ (เช่น `zones`, `locks`, `users`)
3.  กด **Export Data** ออกมาเป็นไฟล์ JSON หรือ BSON
4.  ส่งไฟล์ข้อมูลเหล่านี้ให้เพื่อนพร้อมกับโฟลเดอร์โปรเจกต์

---

## 3. ขั้นตอนการรันระบบ (สำหรับผู้รับ/เพื่อน)

### สเต็ปที่ 1: ตั้งค่า Environment (.env)
เพื่อนต้องสร้างไฟล์ `.env` (ก๊อปจาก `.env.example`) และตั้งค่าพื้นฐาน:
```env
# ต่อกับ MongoDB ที่รันอยู่ใน Docker Network ตัวเดียวกัน
MONGODB_URI=mongodb://mongodb:27017/markethub

# ค่าพื้นฐานอื่นๆ
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
CRON_SECRET=your_cron_secret_key
```

### สเต็ปที่ 2: เริ่มระบบด้วย Docker Compose
รันคำสั่งนี้ใน Terminal:
```bash
docker-compose up --build -d
```
*ระบบจะสร้างตู้คอนเทนเนอร์ App และ Database (เปล่าๆ) ขึ้นมาให้ทันที*

### สเต็ปที่ 3: นำเข้าข้อมูลจริงเข้าสู่เครื่องตัวเอง
1.  เปิด **MongoDB Compass** ในเครื่องตัวเอง
2.  เชื่อมต่อ (Connect) ไปที่: `mongodb://localhost:27017`
3.  สร้าง Database ชื่อ `markethub` และสร้าง Collection ตามไฟล์ที่ได้รับมา
4.  กด **Import Data** นำไฟล์ JSON ที่ได้รับจากเพื่อนใส่เข้าไป

---

## 4. คำสั่งที่ใช้บ่อย (Useful Commands)
*   **เริ่มระบบ:** `docker-compose up -d`
*   **หยุดระบบ:** `docker-compose down`
*   **ดู Log ของ App:** `docker-compose logs -f markethub`
*   **Re-build เมื่อแก้ไขโค้ด:** `docker-compose up --build -d`

---
> [!TIP]
> **ทำไมต้องใช้ Local MongoDB ใน Docker?**
> เพื่อให้เพื่อนสามารถทดลอง แก้ไข หรือลบข้อมูลเล่นได้เต็มที่ โดยไม่ส่งผลกระทบต่อข้อมูลจริงบน Cloud ของคุณครับ!
