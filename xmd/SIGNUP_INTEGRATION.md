# SignUp Page Integration Guide

## ✅ What Was Implemented

The SignUp page is now fully connected to the backend API and will store user data in the MySQL database.

## 🔄 How It Works

### Frontend (SignUp.js)
1. User fills in the form with:
   - Full Name
   - Email
   - User Type (Student/Company/University)
   - Password
   - Confirm Password

2. When clicking "CREATE ACCOUNT":
   - Validates passwords match
   - Validates password length (min 6 characters)
   - Sends POST request to `http://localhost:5050/api/auth/signup`
   - Shows loading state during submission
   - Displays error messages if validation fails
   - Redirects to login page on success

### Backend (API)
- **Endpoint:** `POST /api/auth/signup`
- **Validates:** All required fields, user type, email uniqueness
- **Security:** Hashes password with bcrypt (10 salt rounds)
- **Database:** Stores user in MySQL Users table

### Database (Users Table)
Stores:
- id (auto-generated)
- full_name
- email (unique)
- password (hashed)
- user_type (student/company/university)
- created_at (timestamp)

## 🚀 Testing the Integration

### Step 1: Start the Backend Server
```bash
cd backend
npm start
```
Server should show:
```
Server running on port 5050
✅ Connected to MySQL Database!
```

### Step 2: Access the SignUp Page
Open browser and go to:
```
http://localhost:5050/signup
```

### Step 3: Fill in the Form
- **Full Name:** John Doe
- **Email:** john@example.com
- **User Type:** Student
- **Password:** testpass123
- **Confirm Password:** testpass123
- Check "I agree to Terms & Conditions"

### Step 4: Click "CREATE ACCOUNT"
- Button will show "Creating Account..." while processing
- On success: Alert "Account created successfully! Please login."
- Redirects to login page

### Step 5: Verify Data in Database
```bash
cd backend
node scripts/checkUsers.js
```

You should see your newly created user!

## 🔍 Debugging

### Check Server Logs
When you submit the form, the backend terminal will show:
```
📝 Signup request received: { full_name, email, user_type }
💾 Creating user in database...
✅ User created successfully with ID: 1
```

### Common Issues

**1. "Network error. Please check if the server is running."**
- Make sure backend server is running on port 5050
- Check `npm start` in backend directory

**2. "Email already registered"**
- This email is already in the database
- Try a different email address

**3. "Passwords do not match!"**
- Password and Confirm Password fields must be identical

**4. "Password must be at least 6 characters long"**
- Use a longer password

**5. Form submits but nothing in database**
- Check backend terminal for error logs
- Run `node scripts/checkUsers.js` to verify database state
- Ensure MySQL is running and .env is configured correctly

## 📊 Verify Database Entries

**Check all users:**
```bash
node scripts/checkUsers.js
```

**Test signup from command line:**
```bash
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "testpass123",
    "user_type": "student"
  }'
```

## 🎯 Features Implemented

✅ Form validation (client-side)
✅ Password matching validation
✅ Password length validation
✅ Loading state during submission
✅ Error message display
✅ Success message and redirect
✅ Backend API integration
✅ Password hashing (bcrypt)
✅ Email uniqueness check
✅ Database storage
✅ Proper error handling

## 📝 API Request Format

The frontend sends this JSON to the backend:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "testpass123",
  "user_type": "student"
}
```

## 📥 API Response Format

**Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 1
}
```

**Error (400/409/500):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

## 🔐 Security Features

- Passwords are hashed with bcrypt before storage
- SQL injection protection (parameterized queries)
- CORS enabled for cross-origin requests
- Input validation on both frontend and backend
- Email uniqueness enforced at database level

## 🎨 UI Features

- Real-time error display
- Loading state with disabled inputs
- Button text changes to "Creating Account..."
- Form fields disabled during submission
- Error messages clear when user starts typing
- Success alert before redirect

## 📂 Files Modified

### Frontend
- `/frontend/src/pages/SignUp.js` - Added API integration

### Backend
- `/backend/routes/auth.js` - Added logging and test endpoint
- `/backend/models/User.js` - User model with CRUD operations
- `/backend/config/database.js` - Database connection
- `/backend/server.js` - API routes configuration

### Scripts
- `/backend/scripts/checkUsers.js` - Verify database entries
- `/backend/scripts/createUsersTable.js` - Create Users table

## 🔄 Next Steps

Consider implementing:
1. Login functionality
2. Email verification
3. Password strength indicator
4. Better error styling
5. Success animation
6. Form field validation feedback
7. Remember me functionality
8. Social login options
