-- ============================================
-- Supabase Messages Table Setup
-- ============================================
-- استخدم هذا الملف لإنشاء جدول الرسائل في Supabase
-- افتح Supabase Dashboard > SQL Editor > New Query
-- انسخ والصق هذا الكود وشغّله

-- 1. إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء Indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- 3. إنشاء Index مركب للبحث السريع
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON messages(sender_id, receiver_id, created_at DESC);

-- 4. تفعيل Real-time للجدول
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 5. إنشاء Row Level Security (RLS) Policies (اختياري - للأمان)
-- يمكنك تفعيل RLS لحماية البيانات

-- تفعيل RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة الرسائل المرسلة إليهم أو منهم
CREATE POLICY "Users can read their own messages"
ON messages
FOR SELECT
USING (
  auth.uid()::text::integer = sender_id 
  OR auth.uid()::text::integer = receiver_id
);

-- Policy: المستخدمون يمكنهم إرسال رسائل
CREATE POLICY "Users can send messages"
ON messages
FOR INSERT
WITH CHECK (auth.uid()::text::integer = sender_id);

-- Policy: المستخدمون يمكنهم تحديث حالة القراءة للرسائل المرسلة إليهم
CREATE POLICY "Users can update read status"
ON messages
FOR UPDATE
USING (auth.uid()::text::integer = receiver_id)
WITH CHECK (auth.uid()::text::integer = receiver_id);

-- 6. إنشاء Function لحذف الرسائل القديمة (اختياري)
-- يحذف الرسائل الأقدم من 90 يوم
CREATE OR REPLACE FUNCTION delete_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 7. جدولة حذف الرسائل القديمة (اختياري)
-- يمكنك استخدام pg_cron أو Supabase Edge Functions

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. تأكد من تفعيل Real-time في Supabase Dashboard:
--    Database > Replication > Enable Real-time for 'messages' table
--
-- 2. إذا كنت تستخدم RLS، تأكد من تسجيل الدخول في Supabase
--    أو استخدم Service Role Key (ليس آمن للـ Frontend)
--
-- 3. للتطوير، يمكنك تعطيل RLS مؤقتاً:
--    ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
--
-- 4. تأكد من أن sender_id و receiver_id يطابقان user.id في تطبيقك
--
-- ============================================
-- اختبار الجدول:
-- ============================================

-- إدراج رسالة تجريبية
INSERT INTO messages (sender_id, receiver_id, message, read)
VALUES (1, 2, 'مرحباً! هذه رسالة تجريبية', false);

-- قراءة جميع الرسائل
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- قراءة الرسائل بين مستخدمين
SELECT * FROM messages 
WHERE (sender_id = 1 AND receiver_id = 2) 
   OR (sender_id = 2 AND receiver_id = 1)
ORDER BY created_at ASC;

-- عدد الرسائل غير المقروءة
SELECT COUNT(*) as unread_count 
FROM messages 
WHERE receiver_id = 1 AND read = false;

-- تحديد الرسائل كمقروءة
UPDATE messages 
SET read = true 
WHERE receiver_id = 1 AND sender_id = 2 AND read = false;

-- ============================================
-- تم! الآن يمكنك استخدام نظام الدردشة 🎉
-- ============================================
