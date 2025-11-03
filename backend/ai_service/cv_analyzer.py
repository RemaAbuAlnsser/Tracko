import os
import re
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import io
from groq import Groq
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# إعداد مفتاح API من Groq
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
if not GROQ_API_KEY:
    print("⚠  Warning: GROQ_API_KEY not set. Please set it as environment variable.")
client = Groq(api_key=GROQ_API_KEY)

def extract_text_from_pdf(pdf_path):
    """استخراج النص من ملف PDF مع تطبيق OCR على الصور"""
    doc = fitz.open(pdf_path)
    text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text += page.get_text("text")
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image = Image.open(io.BytesIO(image_bytes))
            ocr_text = pytesseract.image_to_string(image)
            text += ocr_text
    return text

def send_to_groq(text, prompt):
    """إرسال النص إلى نموذج Groq وتحليل البيانات"""
    full_prompt = f"{prompt}\n{text}"

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=1,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None
    )

    output_text = ""
    for chunk in completion:
        content = chunk.choices[0].delta.content or ""
        output_text += content

    # 🔍 استخراج فقط JSON
    json_match = re.search(r"\{[\s\S]*\}", output_text)
    clean_json = json_match.group(0) if json_match else output_text.strip()

    return json.loads(clean_json)

@app.route('/analyze-cv', methods=['POST'])
def analyze_cv():
    try:
        data = request.json
        cv_path = data.get('cv_path')
        
        if not cv_path:
            return jsonify({'success': False, 'message': 'CV path is required'}), 400
        
        # تحويل المسار النسبي إلى مسار مطلق
        full_path = os.path.join(os.path.dirname(__file__), '..', cv_path.lstrip('/'))
        
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'message': 'CV file not found'}), 404
        
        # استخراج النص من PDF
        print(f"📄 Extracting text from: {full_path}")
        extracted_text = extract_text_from_pdf(full_path)
        
        # البرومبت
        prompt = """
Extract the following from this CV and return it as a JSON object with keys:
- Name
- Email
- GPA
- Phone
- Degree
- Skills (only important skills, as an array)
- Experience (as an array of objects with company, position, duration)

Return ONLY valid JSON, no additional text.
"""
        
        # تحليل CV باستخدام Groq
        print("🤖 Analyzing CV with AI...")
        analysis_result = send_to_groq(extracted_text, prompt)
        
        print("✅ CV analyzed successfully")
        return jsonify({
            'success': True,
            'message': 'CV analyzed successfully',
            'analysis': analysis_result
        })
        
    except Exception as e:
        print(f"❌ Error analyzing CV: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error analyzing CV: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
