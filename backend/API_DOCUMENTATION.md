# Tracko Backend API Documentation

## Base URL
```
http://localhost:5050
```

## Authentication Endpoints

### 1. User Signup/Registration

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user in the system

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "user_type": "student"
}
```

**Fields:**
- `full_name` (string, required): User's full name
- `email` (string, required): User's email address (must be unique)
- `password` (string, required): User's password (will be hashed)
- `user_type` (string, required): Must be one of: `"student"`, `"company"`, or `"university"`

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 1
}
```

**Error Responses:**

- **400 Bad Request** - Missing fields:
```json
{
  "success": false,
  "message": "All fields are required"
}
```

- **400 Bad Request** - Invalid user type:
```json
{
  "success": false,
  "message": "Invalid user type. Must be 'university', 'company', or 'student'"
}
```

- **409 Conflict** - Email already exists:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

- **500 Server Error**:
```json
{
  "success": false,
  "message": "Server error"
}
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate a user and return user data

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Fields:**
- `email` (string, required): User's email address
- `password` (string, required): User's password

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "user_type": "student"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing fields:
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

- **401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

- **500 Server Error**:
```json
{
  "success": false,
  "message": "Server error"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  user_type ENUM('university', 'company', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Testing

You can test the API using:
1. **cURL:**
```bash
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "user_type": "student"
  }'
```

2. **Postman/Insomnia:** Import the test-signup.http file

3. **Frontend Form:** Connect your React signup form to this endpoint

## Security Features
- ✅ Password hashing using bcrypt (10 salt rounds)
- ✅ Email uniqueness validation
- ✅ Input validation
- ✅ CORS enabled
- ✅ SQL injection protection (parameterized queries)
