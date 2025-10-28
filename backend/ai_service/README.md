# CV Analyzer AI Service

This service uses Groq AI to analyze CVs and extract information.

## Setup

1. Install Python dependencies:
```bash
cd backend/ai_service
pip install -r requirements.txt
```

2. Install Tesseract OCR (for image text extraction):
- **Mac**: `brew install tesseract`
- **Ubuntu**: `sudo apt-get install tesseract-ocr`
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki

3. Set up Groq API key in `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

**Note:** The service reads the API key from `backend/.env` file using `python-dotenv`.
You don't need to export it manually.

Get your API key from: https://console.groq.com/keys

## Run the Service

```bash
cd backend/ai_service
python cv_analyzer.py
```

The service will run on `http://localhost:5001`

## API Endpoint

**POST** `/analyze-cv`

Request body:
```json
{
  "cv_path": "/uploads/cvs/cv-123456.pdf"
}
```

Response:
```json
{
  "success": true,
  "message": "CV analyzed successfully",
  "analysis": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "GPA": "3.8",
    "Phone": "+1234567890",
    "Degree": "Computer Science",
    "Skills": ["JavaScript", "Python", "React"],
    "Experience": [
      {
        "company": "Tech Corp",
        "position": "Software Engineer",
        "duration": "2020-2023"
      }
    ]
  }
}
```

## How it Works

1. Frontend uploads CV to Node.js backend (`/api/upload/cv`)
2. Node.js saves CV to `uploads/cvs/` folder
3. Frontend calls Python AI service (`/analyze-cv`) with CV path
4. Python service:
   - Extracts text from PDF using PyMuPDF
   - Applies OCR on images using Tesseract
   - Sends text to Groq AI (Llama 3.3 70B)
   - Returns structured JSON with extracted data
5. Frontend displays results and can update student profile

## Security Notes

- API key is stored in `.env` file (not committed to Git)
- `.env` file is in `.gitignore` to prevent accidental commits
- Use `.env.example` as a template for setting up your environment
