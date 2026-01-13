import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TrainerDashboard.css';

function TrainerSubmissionsView() {
  const { studentId } = useParams();
  const [user, setUser] = useState(null);
  const [trainerId, setTrainerId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.user_type !== 'company' && parsedUser.user_type !== 'trainer') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    loadTrainerData(parsedUser.id);
  }, [navigate]);

  const loadTrainerData = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/trainers/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.trainer) {
          setTrainerId(data.trainer.id);
          loadSubmissions(data.trainer.id);
        }
      }
    } catch (error) {
      console.error('Error loading trainer data:', error);
    }
  };

  const loadSubmissions = async (trId) => {
    try {
      const url = studentId 
        ? `http://localhost:5050/api/task-submissions/student/${studentId}/trainer/${trId}`
        : `http://localhost:5050/api/task-submissions/trainer/${trId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewStatus(submission.status === 'pending' ? 'approved' : submission.status);
    setReviewComment(submission.trainer_comment || '');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`http://localhost:5050/api/task-submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          trainer_comment: reviewComment
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Review submitted successfully! Student has been notified.' 
        });
        
        loadSubmissions(trainerId);
        
        setTimeout(() => {
          setShowReviewModal(false);
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to submit review' 
        });
      }
    } catch (error) {
      console.error('Submit review error:', error);
      setMessage({ type: 'error', text: 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending Review', color: '#fb8c00', bgColor: '#fff3e0' },
      approved: { text: 'Approved', color: '#43a047', bgColor: '#e8f5e9' },
      rejected: { text: 'Needs Revision', color: '#e53935', bgColor: '#ffebee' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '12px', 
        fontSize: '0.85rem',
        fontWeight: '500',
        backgroundColor: config.bgColor,
        color: config.color
      }}>
        {config.text}
      </span>
    );
  };

  const downloadFile = (filePath) => {
    if (filePath) {
      window.open(`http://localhost:5050${filePath}`, '_blank');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="trainer-dashboard">
      <div style={{ 
        padding: '1.5rem 2rem', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <button 
            onClick={() => navigate('/trainer-dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            Back to Dashboard
          </button>
        </div>
        <h2 style={{ margin: 0 }}>Student Task Submissions</h2>
        <div style={{ width: '120px' }}></div>
      </div>

      <main className="trainer-main-content">
        <div className="dashboard-header">
          <h1>Task Submissions</h1>
          <p>Review and provide feedback on student submissions</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="table-section">
          <h2>All Submissions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No Submissions Yet</h3>
              <p>Students have not submitted any tasks yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Task</th>
                    <th>Plan</th>
                    <th>Week</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <div className="student-cell">
                          {submission.student_img ? (
                            <img 
                              src={`http://localhost:5050${submission.student_img}`} 
                              alt={submission.student_name}
                              className="student-avatar-small"
                            />
                          ) : (
                            <div className="student-avatar-placeholder">
                              {submission.student_name?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div>
                            <div className="student-name">{submission.student_name}</div>
                            <div className="student-email">{submission.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{submission.task_title}</strong>
                      </td>
                      <td>{submission.plan_title}</td>
                      <td>Week {submission.week_number}</td>
                      <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                      <td>{getStatusBadge(submission.status)}</td>
                      <td>
                        <button 
                          className="btn-primary"
                          onClick={() => handleReviewSubmission(submission)}
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                        >
                          {submission.status === 'pending' ? 'Review' : 'View Review'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Submission</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="task-detail-section">
                <h3>{selectedSubmission.task_title}</h3>
                <p><strong>Student:</strong> {selectedSubmission.student_name}</p>
                <p><strong>Plan:</strong> {selectedSubmission.plan_title}</p>
                <p><strong>Week:</strong> {selectedSubmission.week_number} - {selectedSubmission.week_title}</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>

              <div className="task-detail-section">
                <h4>Submission Content</h4>
                
                {selectedSubmission.submission_file && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>File:</strong>
                    <button 
                      onClick={() => downloadFile(selectedSubmission.submission_file)}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#1e88e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Download File
                    </button>
                  </div>
                )}

                {selectedSubmission.submission_text && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Text Submission:</strong>
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedSubmission.submission_text}
                    </div>
                  </div>
                )}

                {selectedSubmission.submission_link && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Link:</strong>
                    <a 
                      href={selectedSubmission.submission_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginLeft: '0.5rem', color: '#1e88e5' }}
                    >
                      {selectedSubmission.submission_link}
                    </a>
                  </div>
                )}
              </div>

              {selectedSubmission.status !== 'pending' && (
                <div className="task-detail-section">
                  <h4>Previous Review</h4>
                  <p><strong>Status:</strong> {getStatusBadge(selectedSubmission.status)}</p>
                  {selectedSubmission.trainer_comment && (
                    <p><strong>Comment:</strong> {selectedSubmission.trainer_comment}</p>
                  )}
                  {selectedSubmission.reviewed_at && (
                    <p><strong>Reviewed:</strong> {new Date(selectedSubmission.reviewed_at).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="task-detail-section">
                <h4>Your Review</h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Request Revision</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Comment (Optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows="5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {message.text && (
                  <div className={`alert alert-${message.type}`} style={{ marginTop: '1rem' }}>
                    {message.text}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowReviewModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmitReview}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerSubmissionsView;
