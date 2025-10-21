"""
Main Flask application for AI services
Includes CV analysis and matching services
"""

from cv_analyzer import app

if __name__ == '__main__':
    print("🤖 Starting Tracko AI Service...")
    print("📊 Services available:")
    print("   - CV Analysis: POST /analyze-cv")
    print("   - Skills Extraction: POST /extract-skills")
    print("   - Health Check: GET /health")
    print("\n🌐 Server running on http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
