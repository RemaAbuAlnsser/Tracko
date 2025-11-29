# Backend File Structure

```
backend/
│
├── config/                      # Configuration files
│   └── database.js             # MySQL database connection setup
│
├── models/                      # Data models
│   └── User.js                 # User model with CRUD operations
│
├── routes/                      # API route handlers
│   └── auth.js                 # Authentication routes (signup, login)
│
├── scripts/                     # Utility scripts
│   ├── createUsersTable.js     # Database table creation script
│   └── test-signup.http        # API testing examples (REST Client)
│
├── utils/                       # Utility functions (empty for now)
│
├── .env                         # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
├── API_DOCUMENTATION.md        # Detailed API documentation
├── package.json                # Project dependencies and scripts
├── README.md                   # Project overview and setup guide
├── server.js                   # Main application entry point
└── STRUCTURE.md                # This file
```

## File Descriptions

### Core Files

**server.js**
- Main application entry point
- Sets up Express server
- Configures middleware (CORS, JSON parsing)
- Defines API routes
- Serves React frontend build files
- Runs on port 5050

### Configuration

**config/database.js**
- MySQL database connection configuration
- Uses environment variables from .env
- Exports database connection instance

### Models

**models/User.js**
- User data model
- Methods:
  - `create()` - Create new user with hashed password
  - `findByEmail()` - Find user by email
  - `findById()` - Find user by ID
  - `verifyPassword()` - Compare passwords
  - `getAll()` - Get all users

### Routes

**routes/auth.js**
- Authentication endpoints
- POST `/api/auth/signup` - User registration
- Uses User model for database operations
- Includes validation and error handling

### Scripts

**scripts/createUsersTable.js**
- Creates Users table in MySQL database
- Run once during initial setup: `npm run setup-db`

**scripts/test-signup.http**
- HTTP request examples for testing API
- Use with REST Client VS Code extension

### Documentation

**README.md**
- Project overview
- Setup instructions
- Development guide

**API_DOCUMENTATION.md**
- Detailed API endpoint documentation
- Request/response examples
- Error codes and messages

**STRUCTURE.md**
- This file
- Project structure overview

## Environment Variables

Required in `.env` file:
```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=tracko_db
DB_PORT=3306
```

## NPM Scripts

- `npm start` - Start the production server
- `npm run dev` - Start server with auto-reload (Node 18+)
- `npm run setup-db` - Create database tables
- `npm test` - Run tests (not implemented yet)

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user

### Health Check
- `GET /api/health` - Server and database status

### Frontend
- `GET /*` - Serves React application (catch-all route)

## Database Tables

### Users
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- full_name (VARCHAR 255)
- email (VARCHAR 255, UNIQUE)
- password (VARCHAR 255, hashed)
- user_type (ENUM: 'university', 'company', 'student')
- created_at (TIMESTAMP)

## Security Features

✅ Password hashing with bcrypt (10 salt rounds)
✅ SQL injection protection (parameterized queries)
✅ CORS enabled for cross-origin requests
✅ Input validation
✅ Email uniqueness validation
✅ Environment variables for sensitive data

## Development Workflow

1. **Setup**: Install dependencies and configure .env
2. **Database**: Run `npm run setup-db` to create tables
3. **Development**: Use `npm run dev` for auto-reload
4. **Testing**: Use scripts/test-signup.http or Postman
5. **Production**: Use `npm start` to run the server

## Future Additions

Suggested folders for future development:
- `middleware/` - Custom middleware (auth, validation, etc.)
- `controllers/` - Business logic separated from routes
- `utils/` - Helper functions and utilities
- `tests/` - Unit and integration tests
- `validators/` - Input validation schemas
