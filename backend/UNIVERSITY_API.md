# University API Documentation

## Base URL
```
http://localhost:5050/api
```

## Authentication Endpoints

### 1. University Signup
Creates a new user account with university type and automatically creates a university record.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "full_name": "جامعة بيرزيت",
  "email": "info@birzeit.edu",
  "password": "securePassword123",
  "user_type": "university"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 1
}
```

**Note:** This endpoint automatically:
- Creates a record in the `Users` table
- Creates a record in the `Universities` table with the same name and email

---

## University Management Endpoints

### 2. Get All Universities
Retrieves all universities with optional filtering.

**Endpoint:** `GET /api/universities`

**Query Parameters:**
- `university_type` (optional): Filter by type ('public' or 'private')

**Example:**
```
GET /api/universities
GET /api/universities?university_type=public
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "جامعة بيرزيت",
      "email": "info@birzeit.edu",
      "phone": "022982000",
      "address": "بيرزيت، رام الله، فلسطين",
      "university_type": "public",
      "website": "https://www.birzeit.edu",
      "logo": "/uploads/birzeit-logo.png",
      "coordinator_name": "د. أحمد محمود",
      "coordinator_phone": "0599123456"
    }
  ]
}
```

---

### 3. Get University by ID
Retrieves a specific university by its ID.

**Endpoint:** `GET /api/universities/:id`

**Example:**
```
GET /api/universities/1
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "جامعة بيرزيت",
    "email": "info@birzeit.edu",
    "phone": "022982000",
    "address": "بيرزيت، رام الله، فلسطين",
    "university_type": "public",
    "website": "https://www.birzeit.edu",
    "logo": "/uploads/birzeit-logo.png",
    "coordinator_name": "د. أحمد محمود",
    "coordinator_phone": "0599123456"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "University not found"
}
```

---

### 4. Update University
Updates university information.

**Endpoint:** `PUT /api/universities/:id`

**Request Body:**
```json
{
  "name": "جامعة بيرزيت",
  "email": "info@birzeit.edu",
  "phone": "022982000",
  "address": "بيرزيت، رام الله، فلسطين",
  "university_type": "public",
  "website": "https://www.birzeit.edu",
  "logo": "/uploads/birzeit-logo.png",
  "coordinator_name": "د. أحمد محمود",
  "coordinator_phone": "0599123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "University updated successfully",
  "data": {
    "id": 1,
    "name": "جامعة بيرزيت",
    "email": "info@birzeit.edu",
    "phone": "022982000",
    "address": "بيرزيت، رام الله، فلسطين",
    "university_type": "public",
    "website": "https://www.birzeit.edu",
    "logo": "/uploads/birzeit-logo.png",
    "coordinator_name": "د. أحمد محمود",
    "coordinator_phone": "0599123456"
  }
}
```

---

### 5. Delete University
Deletes a university record.

**Endpoint:** `DELETE /api/universities/:id`

**Example:**
```
DELETE /api/universities/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "University deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "University not found"
}
```

---

### 6. Search Universities
Searches universities by name or address.

**Endpoint:** `GET /api/universities/search/:term`

**Example:**
```
GET /api/universities/search/بيرزيت
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "جامعة بيرزيت",
      "email": "info@birzeit.edu",
      "phone": "022982000",
      "address": "بيرزيت، رام الله، فلسطين",
      "university_type": "public",
      "website": "https://www.birzeit.edu",
      "logo": "/uploads/birzeit-logo.png",
      "coordinator_name": "د. أحمد محمود",
      "coordinator_phone": "0599123456"
    }
  ]
}
```

---

### 7. Get Universities by Type
Retrieves universities filtered by type.

**Endpoint:** `GET /api/universities/type/:type`

**Parameters:**
- `type`: Must be 'public' or 'private'

**Example:**
```
GET /api/universities/type/public
GET /api/universities/type/private
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "جامعة بيرزيت",
      "email": "info@birzeit.edu",
      "phone": "022982000",
      "address": "بيرزيت، رام الله، فلسطين",
      "university_type": "public",
      "website": "https://www.birzeit.edu",
      "logo": "/uploads/birzeit-logo.png",
      "coordinator_name": "د. أحمد محمود",
      "coordinator_phone": "0599123456"
    }
  ]
}
```

---

## Database Schema

### Universities Table
```sql
CREATE TABLE Universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  university_type ENUM('public', 'private'),
  website VARCHAR(255),
  logo VARCHAR(255),
  coordinator_name VARCHAR(255),
  coordinator_phone VARCHAR(20)
)
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid university type. Must be 'public' or 'private'"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "University not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "University with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch universities"
}
```

---

## Notes

1. **Automatic Record Creation**: When a user signs up with `user_type: "university"`, the system automatically creates:
   - A record in the `Users` table (for authentication)
   - A record in the `Universities` table (for university-specific data)

2. **Email Uniqueness**: The email must be unique across both `Users` and `Universities` tables.

3. **University Types**: Only two types are supported: 'public' and 'private'.

4. **Coordinator Information**: The coordinator fields store information about the training coordinator at the university.
