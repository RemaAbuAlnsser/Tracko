// Test validation logic
const applications = [
  {"id":89,"student_id":1,"internship_id":6,"status":"accepted","applied_at":"2025-10-22T12:57:36.000Z","hours_per_week":null,"internship_title":"AI","internship_description":"djfhyf","specialization":"AI/Machine Learning","company_id":1,"company_name":"asal","company_logo":"/uploads/logos/logo-1760540966651-488575380.png"},
  {"id":16,"student_id":1,"internship_id":3,"status":"accepted","applied_at":"2025-10-21T17:09:55.000Z","hours_per_week":null,"internship_title":"back","internship_description":"nnnn","specialization":"Software Engineering","company_id":1,"company_name":"asal","company_logo":"/uploads/logos/logo-1760540966651-488575380.png"},
  {"id":9,"student_id":1,"internship_id":5,"status":"accepted","applied_at":"2025-10-21T16:17:15.000Z","hours_per_week":null,"internship_title":"FrontEnd","internship_description":"dvrg","specialization":"Software Engineering","company_id":1,"company_name":"asal","company_logo":"/uploads/logos/logo-1760540966651-488575380.png"}
];

console.log('🧪 Testing validation logic...\n');

// Check if student has an accepted application
const hasAcceptedApplication = applications.some(app => app.status === 'accepted');

console.log('Applications:', applications.length);
console.log('Accepted applications:', applications.filter(app => app.status === 'accepted').length);
console.log('Has accepted application:', hasAcceptedApplication);

if (hasAcceptedApplication) {
  console.log('✅ VALIDATION SHOULD BLOCK: Student has accepted applications');
  console.log('📱 Alert should show: "You already have an accepted internship application. You must complete your current internship before applying to a new one."');
} else {
  console.log('✅ VALIDATION SHOULD ALLOW: Student can apply to new internships');
}
