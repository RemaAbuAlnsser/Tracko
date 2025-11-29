# Tracko Backend

Backend server for the Tracko application built with Node.js, Express, and MySQL.

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── models/
│   └── User.js              # User model with database operations
├── routes/
│   └── auth.js              # Authentication routes (signup, login)
├── scripts/
│   ├── createUsersTable.js  # Database table creation script
│   └── test-signup.http     # API testing examples
├── .env                     # Environment variables (not in git)
├── .gitignore              # Git ignore rules
├── API_DOCUMENTATION.md    # Detailed API documentation
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── server.js               # Main server entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=tracko_db
DB_PORT=3306

# Get your Groq API key from: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
```

3. **Create database tables:**
```bash
node scripts/createUsersTable.js
```

4. **Start the server:**
```bash
npm start
```

The server will run on `http://localhost:5050`

5. **Start the AI CV Analyzer (optional):**
If you want to use the CV analysis feature:
```bash
cd ai_service
python cv_analyzer.py
```

The AI service will run on `http://localhost:5001`

**Note:** Make sure you have set `GROQ_API_KEY` in your `.env` file before running the AI service.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user

### Health Check
- `GET /api/health` - Check server and database status

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🗄️ Database Schema

### Users Table
| Column      | Type                                    | Description                |
|-------------|-----------------------------------------|----------------------------|
| id          | INT (PRIMARY KEY, AUTO_INCREMENT)       | User ID                    |
| full_name   | VARCHAR(255)                            | User's full name           |
| email       | VARCHAR(255) UNIQUE                     | User's email address       |
| password    | VARCHAR(255)                            | Hashed password            |
| user_type   | ENUM('university', 'company', 'student')| Type of user               |
| created_at  | TIMESTAMP                               | Account creation timestamp |

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ CORS enabled
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation
- ✅ Email uniqueness validation

## 🛠️ Development

### Available Scripts

- `npm start` - Start the server
- `node scripts/createUsersTable.js` - Create database tables

### Testing

Use the test file in `scripts/test-signup.http` with REST Client extension in VS Code, or use tools like:
- Postman
- Insomnia
- cURL

Example cURL request:
```bash
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "securePass123",
    "user_type": "student"
  }'
```

## 📦 Dependencies

- **express** - Web framework
- **mysql2** - MySQL client
- **bcrypt** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 🌐 Frontend Integration

The backend serves the React frontend from the root route (`/`). All API routes are prefixed with `/api`.

To build and deploy the frontend:
```bash
cd ../frontend
npm run build
```

The backend will automatically serve the built files.

## 📝 Notes

- Port 5050 is used instead of 5000 (macOS AirPlay Receiver conflict)
- Database connection is established on server startup
- All passwords are hashed before storage
- API routes are processed before static file serving
