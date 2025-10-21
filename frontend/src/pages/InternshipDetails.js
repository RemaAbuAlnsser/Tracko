import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/InternshipDetails.css';

function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadInternshipDetails();
    }
  }, [id]);

  const loadInternshipDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading internship details for ID:', id);
      const response = await fetch(`http://localhost:5050/api/internships/${id}`);
      
      console.log('📡 Response status:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.success && data.internship) {
          console.log('✅ Internship loaded successfully:', data.internship);
          setInternship(data.internship);
        } else {
          console.error('❌ Invalid data structure:', data);
          setError('Internship not found');
        }
      } else {
        console.error('❌ Response not OK:', response.status);
        setError('Failed to load internship details');
      }
    } catch (error) {
      console.error('❌ Error loading internship details:', error);
      setError('An error occurred while loading internship details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleApply = () => {
    // TODO: Implement apply functionality
    alert('Apply functionality will be implemented soon!');
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    alert('Save functionality will be implemented soon!');
  };

  if (loading) {
    return (
      <div className="internship-details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading internship details...</p>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="internship-details-container">
        <div className="error-state">
          <svg width="64" height="64" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>{error || 'Internship not found'}</h2>
          <button className="btn-back" onClick={handleBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="internship-details-container">
      {/* Header with Back Button */}
      <div className="details-header">
        <button className="btn-back-header" onClick={handleBack}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Internships
        </button>
      </div>

      <div className="details-content">
        {/* Company Header */}
        <div className="detail-company-header">
          <div className="detail-company-logo">
            {internship.company_logo ? (
              <img src={`http://localhost:5050${internship.company_logo}`} alt={internship.company_name} />
            ) : (
              <div className="detail-logo-placeholder">
                {internship.company_name?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="detail-company-info">
            <h1>{internship.title}</h1>
            <p className="detail-company-name">{internship.company_name}</p>
            {internship.status && (
              <span className={`detail-status-badge status-${internship.status}`}>
                {internship.status}
              </span>
            )}
          </div>
        </div>

        {/* Internship Information */}
        <div className="detail-section">
          <h2 className="detail-section-title">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Basic Information
          </h2>
          <div className="detail-info-grid">
            {internship.specialization && (
              <div className="detail-info-item">
                <span className="detail-label">Specialization</span>
                <span className="detail-value">{internship.specialization}</span>
              </div>
            )}
            {internship.min_gpa && (
              <div className="detail-info-item">
                <span className="detail-label">Minimum GPA</span>
                <span className="detail-value">{internship.min_gpa}</span>
              </div>
            )}
            {internship.work_mode && (
              <div className="detail-info-item">
                <span className="detail-label">Work Mode</span>
                <span className="detail-value">
                  {internship.work_mode === 'onsite' ? '🏢 Onsite' : 
                   internship.work_mode === 'online' ? '💻 Online' : '🔄 Hybrid'}
                </span>
              </div>
            )}
            {internship.capacity && (
              <div className="detail-info-item">
                <span className="detail-label">Available Positions</span>
                <span className="detail-value">{internship.capacity}</span>
              </div>
            )}
            {internship.industry && (
              <div className="detail-info-item">
                <span className="detail-label">Industry</span>
                <span className="detail-value">{internship.industry}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {internship.description && (
          <div className="detail-section">
            <h2 className="detail-section-title">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
              Description
            </h2>
            <p className="detail-description">{internship.description}</p>
          </div>
        )}

        {/* Requirements */}
        {internship.requirements && (
          <div className="detail-section">
            <h2 className="detail-section-title">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Requirements
            </h2>
            <p className="detail-requirements">{internship.requirements}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="detail-actions">
          <button className="btn-apply-internship" onClick={handleApply}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Apply Now
          </button>
          <button className="btn-save-internship" onClick={handleSave}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default InternshipDetails;
