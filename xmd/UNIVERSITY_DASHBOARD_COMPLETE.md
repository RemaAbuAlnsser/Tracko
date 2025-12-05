# University Dashboard Implementation Guide

## ✅ Backend Complete

### 1. Database Tables Created
- ✅ `Universities` table
- ✅ `University_Company_Partnerships` table

### 2. Models Created
- ✅ `University.js` - Full CRUD operations
- ✅ `Partnership.js` - Partnership management

### 3. API Routes Created
- ✅ `/api/universities` - University management
- ✅ `/api/partnerships` - Partnership management

### 4. Routes Added to Server
- ✅ University routes registered
- ✅ Partnership routes registered

## 📋 Frontend Implementation Needed

The frontend file `UniversityDashboard.js` needs to be created with the same design as `CompanyDashboard.js`.

### Key Features to Include:

#### Sidebar Menu Items:
1. **لوحة التحكم** (Dashboard) - Overview and statistics
2. **الملف الشخصي** (Profile) - Edit university information
3. **الشراكات مع الشركات** (Partnerships) - Main feature
   - View all partnerships
   - Create new partnership
   - Update partnership status
   - Delete partnership
4. **إدارة الطلاب** (Students Management)
5. **فرص التدريب** (Internships)
6. **التقارير والإحصائيات** (Reports)
7. **الإشعارات** (Notifications)
8. **الرسائل** (Messages)

#### Partnership Management Features:
- **Create Partnership Form:**
  - Select company from dropdown
  - Agreement start/end dates
  - Agreement duration (months)
  - Contact person from university
  - Contact person from company
  - Terms and conditions
  - Status (pending/active/expired/terminated)

- **Partnerships Table:**
  - Company name and logo
  - Agreement dates
  - Duration
  - Status badge with colors
  - Actions (view, edit status, delete)

### API Endpoints Available:

```javascript
// Get all partnerships for university
GET /api/partnerships/university/:universityId

// Create new partnership
POST /api/partnerships
Body: {
  university_id, company_id, agreement_date, agreement_end_date,
  agreement_duration, contact_person_university, contact_person_company,
  terms_and_conditions, status
}

// Update partnership status
PATCH /api/partnerships/:id/status
Body: { status: 'active' | 'expired' | 'pending' | 'terminated' }

// Delete partnership
DELETE /api/partnerships/:id

// Get all companies
GET /api/companies
```

### CSS File Needed:
Create `UniversityDashboard.css` - Copy from `CompanyDashboard.css` and adjust colors/Arabic text alignment.

## 🎨 Design Guidelines:
- Use same layout as CompanyDashboard
- Sidebar width: 280px
- Main content: margin-left 280px
- Color scheme: Blue gradient (#1e88e5 to #1565c0)
- RTL support for Arabic text
- Responsive design

## 📝 Next Steps:
1. Create complete UniversityDashboard.js component
2. Create UniversityDashboard.css stylesheet
3. Add route in App.js
4. Test all features
5. Add Arabic language support throughout

## 🔗 Related Files:
- Backend: `/backend/models/Partnership.js`
- Backend: `/backend/routes/partnership.js`
- Frontend Reference: `/frontend/src/pages/CompanyDashboard.js`
- CSS Reference: `/frontend/src/styles/CompanyDashboard.css`
