
# Phase 5: Testing Checklist

Before deploying the complete system, we must ensure all core functionalities work as expected.

## 1. User Authentication & Profile
- [ ] **Registration**: User can sign up with valid info. Duplicate emails should fail.
- [ ] **Login**: User can login with correct credentials. Incorrect password handled gracefully.
- [ ] **Session**: Session persists on refresh. User name displayed in navbar.
- [ ] **Logout**: Logout clears session and redirects to home.

## 2. Lock Browsing & Search
- [ ] **Filters**: Filter by Zone works correctly.
- [ ] **Price Range**: Min/Max price filters return correct results.
- [ ] **Search**: Empty result state displayed correctly ("ไม่พบข้อมูล").
- [ ] **Status Badge**: Locks display correct status badges (Available/Booked/Rented).
- [ ] **Date Locking**: Start date in booking form is auto-set and read-only.

## 3. Engagement Features (New)
- [ ] **Bookmark Toggle**: Clicking bookmark icon toggles state immediately.
- [ ] **Bookmarks List**: `/bookmarks` page shows *only* bookmarked items.
- [ ] **Filter Bookmarks**: Search, Zone, and Status filters in `/bookmarks` work.
- [ ] **Filter Favorites View**: "ที่บันทึกไว้" filter in `/locks` page works.
- [ ] **Queue Join**: Can join queue for a "Booked" lock.
- [ ] **Queue Status**: Shows correct position (e.g., "Queue: 1").
- [ ] **Queue Leave**: Can leave queue successfully from lock detail.
- [ ] **My Queues Page**: `/my-queues` shows all active queues with correct order.
- [ ] **My Queues Cancellation**: Can leave any queue from the management page.

## 4. Booking Flow & Queue Reservation (Updated)
- [ ] **Standard Booking**: Can book an 'Available' lock normally.
- [ ] **Queue Reservation**: When a lock becomes free, it changes to 'Reserved' for Queue #1.
- [ ] **Exclusive Right**: Only the 'Reserved' user can see the "Book Now" button; others see "Reserved (Queue)".
- [ ] **Booking Block**: Non-reserved users are blocked from booking via API (403 Forbidden).
- [ ] **Time Limit**: Reservation expires after 2 hours (UI shows countdown).
- [ ] **User Cancellation**: User can cancel a "Pending Payment" or "Pending Verification" booking.
- [ ] **Cancellation Cleanup**: Cancelled booking releases the lock and creates AuditLog.

## 5. Payment & Verification
- [ ] **QR Code**: QR code generated/displayed for payment.
- [ ] **Slip Upload**: Admin/User can upload slip image.
- [ ] **OCR Check**: Basic OCR extracts amount/date (test with sample slip).
- [ ] **Admin Verify**: Admin can Approve booking -> Lock becomes "Rented", Booking "Active".
- [ ] **Admin Reject**: Admin can Reject booking -> Lock becomes "Available" (or pending if user retries).

## 6. Admin Panel
- [ ] **Dashboard**: Stats (Total Users, revenue, etc.) load without error.
- [ ] **Manage Locks**: Can Add/Edit/Disable a lock.
- [ ] **Manage Zones**: Can Create/Update zones.
- [ ] **Verify Payments**: List shows pending payments. Approve/Reject actions work.
- [ ] **Row Navigation**: Clicking anywhere on the payment table row opens the verification modal.
- [ ] **Responsive Navigation**: Sidebar shows on Desktop; Navbar shows on Mobile.
- [ ] **Dashboard Charts**: Zone names are not cut off; labels are readable.
- [ ] **Zone Name Fix**: No "ไม่ระบุโซน" displayed in bookings table (Check API population).
- [ ] **Emerald Theme**: Visual consistency across all admin pages.
- [ ] **Seed Data**: `npm run seed-market-data` generates 4 zones with 20+ locks and various pricing.

## 7. System & Cron
- [ ] **Auto-Cancel**: Run localized test of `cancel-expired-bookings`. Expired pending bookings should cancel.
- [ ] **Queue Processing**: Cancelling a booking triggers `processLockAvailability` (assigns to next in queue).
- [ ] **Queue Expiry**: Run `process-queue-expiry`. Expired reservations should remove user from queue and assign to next person.
- [ ] **Audit Logs**: Verify `AuditLog` records entries for `BOOKING_CREATED` and `QUEUE_RESERVED`.
- [ ] **Docker App**: `docker-compose up` starts the app successfully.
- [ ] **Docker DB**: Can connect to local MongoDB via Compass at `localhost:27017`.
- [ ] **Docker Environment**: App connects to DB using internal Docker network name.
