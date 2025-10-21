# 🚀 Tracko Setup Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Tracko_Gp
```

### 2. Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Setup environment variables
cp .env.example .env
```

**Important:** Edit `.env` file and add your credentials:
- Database credentials (MySQL)
- **GROQ_API_KEY** - Get it from [Groq Console](https://console.groq.com/keys)

```bash
# Create database tables
node scripts/createUsersTable.js

# Start the backend server
npm start
```

Backend will run on: `http://localhost:5050`

### 3. AI Service Setup (Optional)

```bash
cd backend/ai_service

# Install Python dependencies
pip install -r requirements.txt

# Make sure GROQ_API_KEY is set in backend/.env

# Start the AI service
python cv_analyzer.py
```

AI Service will run on: `http://localhost:5001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on: `http://localhost:3000`

---

## 🔑 Getting Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to your `.env` file:
   ```
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

---

## ⚠️ Important Notes

- **Never commit `.env` file to GitHub** - It contains sensitive credentials
- `.env.example` is safe to commit - It's just a template
- Make sure MySQL is running before starting the backend
- The AI service requires Python 3.7+ and the dependencies listed in requirements.txt

---

## 📝 Environment Variables

### Backend `.env` file should contain:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trackoDB
DB_PORT=3306

# AI Service
GROQ_API_KEY=your_groq_api_key_here
```

---

## 🐛 Troubleshooting

### Port Already in Use
- Backend (5050): Check if another service is using port 5050
- AI Service (5001): Check if another service is using port 5001
- Frontend (3000): Check if another React app is running

### Database Connection Error
- Make sure MySQL is running
- Verify credentials in `.env` file
- Check if database `trackoDB` exists

### AI Service Not Working
- Verify `GROQ_API_KEY` is set in `.env`
- Check if Python dependencies are installed
- Make sure the `.env` file is in the `backend/` directory (not `ai_service/`)

---

## 📦 Tech Stack

- **Backend:** Node.js, Express, MySQL
- **Frontend:** React
- **AI Service:** Python, Flask, Groq API
- **CV Processing:** PyMuPDF, Tesseract OCR
