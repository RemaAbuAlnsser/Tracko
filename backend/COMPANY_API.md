# Company API Documentation

## Base URL
```
http://localhost:5050/api/companies
```

## Company Endpoints

### 1. Create Company

**Endpoint:** `POST /api/companies`

**Description:** Create a new company profile

**Request Body:**
```json
{
  "name": "Tech Corp",
  "email": "contact@techcorp.com",
  "phone": "+1234567890",
  "industry": "Technology",
  "address": "123 Tech Street, Silicon Valley, CA",
  "description": "Leading technology company",
  "website": "https://techcorp.com",
  "logo": "https://techcorp.com/logo.png",
  "status": "active"
}
```

**Fields:**
- `name` (string, required): Company name
- `email` (string, required): Company email (must be unique)
- `phone` (string, optional): Contact phone number
- `industry` (string, optional): Industry sector
- `address` (text, optional): Company address
- `description` (text, optional): Company description
- `website` (string, optional): Company website URL
- `logo` (string, optional): Logo image URL
- `status` (enum, optional): 'active', 'inactive', or 'pending' (default: 'pending')

**Success Response (201):**
```json
{
  "success": true,
  "message": "Company created successfully",
  "companyId": 1
}
```

**Error Responses:**
- **400**: Missing required fields
- **409**: Email already exists
- **500**: Server error

---

### 2. Get All Companies

**Endpoint:** `GET /api/companies`

**Description:** Retrieve all companies (with optional status filter)

**Query Parameters:**
- `status` (optional): Filter by status ('active', 'inactive', 'pending')

**Example:**
```
GET /api/companies?status=active
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "companies": [
    {
      "id": 1,
      "name": "Tech Corp",
      "email": "contact@techcorp.com",
      "phone": "+1234567890",
      "industry": "Technology",
      "address": "123 Tech Street",
      "description": "Leading technology company",
      "website": "https://techcorp.com",
      "logo": "https://techcorp.com/logo.png",
      "status": "active",
      "created_at": "2025-10-15T10:00:00.000Z",
      "updated_at": "2025-10-15T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Company by ID

**Endpoint:** `GET /api/companies/:id`

**Description:** Retrieve a specific company by ID

**Example:**
```
GET /api/companies/1
```

**Success Response (200):**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "Tech Corp",
    "email": "contact@techcorp.com",
    "phone": "+1234567890",
    "industry": "Technology",
    "address": "123 Tech Street",
    "description": "Leading technology company",
    "website": "https://techcorp.com",
    "logo": "https://techcorp.com/logo.png",
    "status": "active",
    "created_at": "2025-10-15T10:00:00.000Z",
    "updated_at": "2025-10-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **404**: Company not found
- **500**: Server error

---

### 4. Update Company

**Endpoint:** `PUT /api/companies/:id`

**Description:** Update company information

**Request Body:** (all fields optional, but at least one should be provided)
```json
{
  "name": "Tech Corp Updated",
  "email": "newemail@techcorp.com",
  "phone": "+9876543210",
  "industry": "Software",
  "address": "456 New Street",
  "description": "Updated description",
  "website": "https://newtechcorp.com",
  "logo": "https://newtechcorp.com/logo.png",
  "status": "active"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Company updated successfully"
}
```

**Error Responses:**
- **404**: Company not found
- **409**: Email already in use by another company
- **500**: Server error

---

### 5. Delete Company

**Endpoint:** `DELETE /api/companies/:id`

**Description:** Delete a company

**Example:**
```
DELETE /api/companies/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

**Error Responses:**
- **404**: Company not found
- **500**: Server error

---

### 6. Update Company Status

**Endpoint:** `PATCH /api/companies/:id/status`

**Description:** Update only the company status

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:**
- `active` - Company is active
- `inactive` - Company is inactive
- `pending` - Company registration pending approval

**Success Response (200):**
```json
{
  "success": true,
  "message": "Company status updated successfully"
}
```

**Error Responses:**
- **400**: Invalid status value
- **404**: Company not found
- **500**: Server error

---

### 7. Search Companies

**Endpoint:** `GET /api/companies/search/:term`

**Description:** Search companies by name or industry

**Example:**
```
GET /api/companies/search/tech
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "companies": [
    {
      "id": 1,
      "name": "Tech Corp",
      "industry": "Technology",
      ...
    }
  ]
}
```

---

## Database Schema

### Company Table
```sql
CREATE TABLE Company (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  industry VARCHAR(100),
  address TEXT,
  description TEXT,
  website VARCHAR(255),
  logo VARCHAR(255),
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## Testing Examples

### Create a Company
```bash
curl -X POST http://localhost:5050/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp",
    "email": "contact@techcorp.com",
    "phone": "+1234567890",
    "industry": "Technology",
    "address": "123 Tech Street",
    "description": "Leading technology company",
    "website": "https://techcorp.com",
    "status": "active"
  }'
```

### Get All Companies
```bash
curl http://localhost:5050/api/companies
```

### Get Active Companies Only
```bash
curl http://localhost:5050/api/companies?status=active
```

### Get Company by ID
```bash
curl http://localhost:5050/api/companies/1
```

### Update Company
```bash
curl -X PUT http://localhost:5050/api/companies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Corp Updated",
    "status": "active"
  }'
```

### Update Status Only
```bash
curl -X PATCH http://localhost:5050/api/companies/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Search Companies
```bash
curl http://localhost:5050/api/companies/search/tech
```

### Delete Company
```bash
curl -X DELETE http://localhost:5050/api/companies/1
```

## Setup Instructions

1. **Create the Company table:**
```bash
cd backend
node scripts/createCompanyTable.js
```

2. **Restart the server:**
```bash
npm start
```

3. **Test the endpoints** using the examples above or Postman

## Notes

- All timestamps are automatically managed by MySQL
- `updated_at` is automatically updated on any record modification
- Email must be unique across all companies
- Status defaults to 'pending' if not specified
- Logo and website fields accept URLs
