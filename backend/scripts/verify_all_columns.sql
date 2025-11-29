-- Verification script for all columns added during mergevideocall merge
-- Run this to verify all database schema updates are applied

SELECT '========================================' as '';
SELECT 'DATABASE SCHEMA VERIFICATION' as '';
SELECT '========================================' as '';

-- 1. Universities.domain
SELECT '' as '';
SELECT '1. Universities.domain:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - domain column exists', 
  '❌ FAIL - domain column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Universities' 
  AND COLUMN_NAME = 'domain';

-- 2. Internships.number_of_students
SELECT '' as '';
SELECT '2. Internships.number_of_students:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - number_of_students column exists', 
  '❌ FAIL - number_of_students column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Internships' 
  AND COLUMN_NAME = 'number_of_students';

-- 3. Internship_Matches.hours_per_week
SELECT '' as '';
SELECT '3. Internship_Matches.hours_per_week:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - hours_per_week column exists', 
  '❌ FAIL - hours_per_week column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Internship_Matches' 
  AND COLUMN_NAME = 'hours_per_week';

-- 4. Internship_Matches.completed_hours
SELECT '' as '';
SELECT '4. Internship_Matches.completed_hours:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - completed_hours column exists', 
  '❌ FAIL - completed_hours column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Internship_Matches' 
  AND COLUMN_NAME = 'completed_hours';

-- 5. Plan_Weeks.due_date
SELECT '' as '';
SELECT '5. Plan_Weeks.due_date:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - due_date column exists', 
  '❌ FAIL - due_date column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Plan_Weeks' 
  AND COLUMN_NAME = 'due_date';

-- 6. Internship_Plans.due_date
SELECT '' as '';
SELECT '6. Internship_Plans.due_date:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - due_date column exists', 
  '❌ FAIL - due_date column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Internship_Plans' 
  AND COLUMN_NAME = 'due_date';

-- 7. University_Company_Partnerships.training_hours
SELECT '' as '';
SELECT '7. University_Company_Partnerships.training_hours:' as '';
SELECT IF(
  COUNT(*) > 0, 
  '✅ PASS - training_hours column exists', 
  '❌ FAIL - training_hours column missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'University_Company_Partnerships' 
  AND COLUMN_NAME = 'training_hours';

-- 8. notifications.type ENUM values
SELECT '' as '';
SELECT '8. notifications.type ENUM:' as '';
SELECT COLUMN_TYPE as 'Current ENUM values'
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications' 
  AND COLUMN_NAME = 'type';

-- Check for required ENUM values
SELECT '' as '';
SELECT '   Checking required notification types:' as '';
SELECT IF(
  COLUMN_TYPE LIKE '%registration_approved%',
  '   ✅ registration_approved exists',
  '   ❌ registration_approved missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications' 
  AND COLUMN_NAME = 'type';

SELECT IF(
  COLUMN_TYPE LIKE '%registration_request%',
  '   ✅ registration_request exists',
  '   ❌ registration_request missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications' 
  AND COLUMN_NAME = 'type';

SELECT IF(
  COLUMN_TYPE LIKE '%task_deadline%',
  '   ✅ task_deadline exists',
  '   ❌ task_deadline missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications' 
  AND COLUMN_NAME = 'type';

SELECT IF(
  COLUMN_TYPE LIKE '%video_call%',
  '   ✅ video_call exists',
  '   ❌ video_call missing'
) as Status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications' 
  AND COLUMN_NAME = 'type';

-- Summary
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'VERIFICATION COMPLETE' as '';
SELECT '========================================' as '';
SELECT '' as '';
SELECT 'If all checks show ✅ PASS, the database schema is correct!' as '';
SELECT 'If any check shows ❌ FAIL, run the corresponding migration.' as '';
SELECT '' as '';
