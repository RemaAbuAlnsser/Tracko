// AI Matching Service - Based on skill categorization and matching logic

class AIMatchingService {
  constructor() {
    // تعريف التصنيفات والكلمات المفتاحية (من كود Python)
    this.categories = {
      "Frontend": ["html", "css", "javascript", "react", "vue", "angular", "bootstrap", "typescript", "sass", "less", "webpack"],
      "Backend": ["node.js", "nodejs", "express", "spring", "django", "flask", "php", "java", "python", "ruby", "go", "c#", ".net"],
      "Database": ["mysql", "mongodb", "postgresql", "sqlite", "redis", "oracle", "sql", "nosql"],
      "DevOps": ["docker", "kubernetes", "jenkins", "aws", "azure", "gcp", "ci/cd", "terraform", "ansible"],
      "AI Engineer": ["python", "tensorflow", "pytorch", "ai", "machine learning", "deep learning", "ml", "data science", "nlp"],
      "QA / Testing": [
        "software testing", "qa", "qc", "sdlc", "test cases", "bug reports",
        "cypress", "selenium", "appium", "testng", "gherkin", "cucumber",
        "api testing", "mobile testing", "jira", "postman", "maven", "testing"
      ],
      "Mobile": ["android", "ios", "react native", "flutter", "swift", "kotlin", "mobile"],
      "Tools / Others": ["git", "github", "gitlab", "bitbucket", "agile", "scrum", "jira"]
    };
  }

  /**
   * تصنيف المهارات حسب الفئة
   */
  categorizeSkills(skills) {
    if (!skills || !Array.isArray(skills)) {
      return { categorized: {}, uncategorized: [] };
    }

    const detected = {};
    const uncategorized = [];
    
    // تحويل المهارات لأحرف صغيرة
    const normalizedSkills = skills.map(s => s.toLowerCase().trim());

    for (const skill of normalizedSkills) {
      let found = false;
      
      for (const [category, keywords] of Object.entries(this.categories)) {
        for (const keyword of keywords) {
          if (skill.includes(keyword) || keyword.includes(skill)) {
            if (!detected[category]) {
              detected[category] = [];
            }
            // إضافة المهارة الأصلية (بحالة Title Case)
            const originalSkill = skills.find(s => s.toLowerCase().trim() === skill);
            if (originalSkill && !detected[category].includes(originalSkill)) {
              detected[category].push(originalSkill);
            }
            found = true;
            break;
          }
        }
        if (found) break;
      }
      
      if (!found) {
        const originalSkill = skills.find(s => s.toLowerCase().trim() === skill);
        if (originalSkill && !uncategorized.includes(originalSkill)) {
          uncategorized.push(originalSkill);
        }
      }
    }

    return { categorized: detected, uncategorized };
  }

  /**
   * استخراج المهارات من requirements و specialization
   */
  extractRequiredSkills(requirements, specialization) {
    const requiredSkills = [];
    
    // استخراج من requirements
    if (requirements) {
      const reqText = requirements.toLowerCase();
      for (const [category, keywords] of Object.entries(this.categories)) {
        for (const keyword of keywords) {
          if (reqText.includes(keyword)) {
            requiredSkills.push(keyword);
          }
        }
      }
    }
    
    // استخراج من specialization
    if (specialization) {
      const specText = specialization.toLowerCase();
      for (const [category, keywords] of Object.entries(this.categories)) {
        for (const keyword of keywords) {
          if (specText.includes(keyword) && !requiredSkills.includes(keyword)) {
            requiredSkills.push(keyword);
          }
        }
      }
    }
    
    return requiredSkills;
  }

  /**
   * حساب نسبة المطابقة بين CV والتدريب
   */
  calculateMatch(cvAnalysisData, internshipRequirements, internshipSpecialization, internshipMinGpa = null, internshipWorkMode = null, studentGpa = null, studentWorkPreference = null) {
    try {
      // استخراج المهارات من CV
      let studentSkills = [];
      if (cvAnalysisData) {
        if (typeof cvAnalysisData === 'string') {
          cvAnalysisData = JSON.parse(cvAnalysisData);
        }
        studentSkills = cvAnalysisData.Skills || [];
      }

      if (!Array.isArray(studentSkills) || studentSkills.length === 0) {
        return {
          matchPercentage: 0,
          matchedSkills: [],
          matchedCategories: {},
          studentCategories: {},
          requiredSkills: []
        };
      }

      // تصنيف مهارات الطالب
      const { categorized: studentCategories } = this.categorizeSkills(studentSkills);

      // استخراج المهارات المطلوبة من التدريب
      const requiredSkills = this.extractRequiredSkills(
        internshipRequirements, 
        internshipSpecialization
      );

      if (requiredSkills.length === 0) {
        // إذا لم نجد متطلبات محددة، نستخدم specialization كفئة
        const specMatch = this.matchBySpecialization(
          studentCategories, 
          internshipSpecialization
        );
        return specMatch;
      }

      // حساب المهارات المتطابقة
      const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
      const matchedSkills = requiredSkills.filter(reqSkill => 
        normalizedStudentSkills.some(studentSkill => 
          studentSkill.includes(reqSkill) || reqSkill.includes(studentSkill)
        )
      );

      // حساب نسبة المطابقة الأساسية (من المهارات)
      let matchPercentage = requiredSkills.length > 0 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 0;

      // تصنيف المهارات المتطابقة
      const { categorized: matchedCategories } = this.categorizeSkills(matchedSkills);

      // فحص GPA - إذا كان مطلوب ولا يطابق، تقليل النسبة
      let gpaMatch = true;
      let gpaMessage = null;
      if (internshipMinGpa && studentGpa !== null && studentGpa !== undefined) {
        const studentGpaNum = parseFloat(studentGpa);
        const minGpaNum = parseFloat(internshipMinGpa);
        
        if (studentGpaNum < minGpaNum) {
          gpaMatch = false;
          gpaMessage = `GPA ${studentGpaNum} is below required ${minGpaNum}`;
          // تقليل النسبة بـ 30% إذا GPA أقل من المطلوب
          matchPercentage = Math.max(0, matchPercentage - 30);
        } else {
          gpaMessage = `GPA ${studentGpaNum} meets requirement ${minGpaNum}`;
          // زيادة النسبة بـ 5% إذا GPA يطابق أو أعلى
          matchPercentage = Math.min(100, matchPercentage + 5);
        }
      }

      // فحص Work Mode - إذا كان مطلوب ويطابق تفضيلات الطالب
      let workModeMatch = true;
      let workModeMessage = null;
      if (internshipWorkMode && studentWorkPreference) {
        if (internshipWorkMode === studentWorkPreference || internshipWorkMode === 'hybrid') {
          workModeMatch = true;
          workModeMessage = `Work mode ${internshipWorkMode} matches preference`;
          // زيادة النسبة بـ 5% إذا Work Mode يطابق
          matchPercentage = Math.min(100, matchPercentage + 5);
        } else {
          workModeMatch = false;
          workModeMessage = `Work mode ${internshipWorkMode} doesn't match preference ${studentWorkPreference}`;
          // تقليل النسبة بـ 10% إذا Work Mode لا يطابق
          matchPercentage = Math.max(0, matchPercentage - 10);
        }
      }

      return {
        matchPercentage,
        matchedSkills,
        matchedCategories,
        studentCategories,
        requiredSkills,
        gpaMatch,
        gpaMessage,
        workModeMatch,
        workModeMessage
      };

    } catch (error) {
      console.error('Error calculating match:', error);
      return {
        matchPercentage: 0,
        matchedSkills: [],
        matchedCategories: {},
        studentCategories: {},
        requiredSkills: []
      };
    }
  }

  /**
   * مطابقة بناءً على التخصص
   */
  matchBySpecialization(studentCategories, specialization) {
    if (!specialization) {
      return {
        matchPercentage: 0,
        matchedSkills: [],
        matchedCategories: {},
        studentCategories,
        requiredSkills: []
      };
    }

    const specLower = specialization.toLowerCase();
    let matchPercentage = 0;
    const matchedCategories = {};

    // مطابقة التخصص مع الفئات
    for (const [category, skills] of Object.entries(studentCategories)) {
      if (specLower.includes(category.toLowerCase()) || 
          category.toLowerCase().includes(specLower)) {
        matchPercentage += 30; // نقاط إضافية للتطابق في الفئة
        matchedCategories[category] = skills;
      }
    }

    // إضافة نقاط بناءً على عدد الفئات المتطابقة
    const categoryCount = Object.keys(studentCategories).length;
    if (categoryCount > 0) {
      matchPercentage += Math.min(categoryCount * 10, 40);
    }

    // التأكد من أن النسبة لا تتجاوز 100
    matchPercentage = Math.min(matchPercentage, 100);

    return {
      matchPercentage,
      matchedSkills: [],
      matchedCategories,
      studentCategories,
      requiredSkills: []
    };
  }
}

export default new AIMatchingService();
