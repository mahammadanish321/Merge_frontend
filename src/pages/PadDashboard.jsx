import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Clock, Zap, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { AcademicTemplates } from '../components/SmartPad/AcademicTemplates';
import api from '../api';
import './WritingPad.css';
import { useToast } from '../context/ToastContext';

const PadDashboard = () => {
  const [pads, setPads] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchPads();
    fetchLiveInvitations();
  }, []);

  const fetchPads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pads/user/all');
      setPads(res.data);
    } catch (error) {
      console.error('Failed to fetch pads:', error);
      addToast('Failed to load your pads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveInvitations = async () => {
    try {
      const res = await api.get('/pads/live-invitations');
      setInvitations(res.data);
    } catch (error) {
      console.error('Failed to fetch live invitations:', error);
    }
  };

  const handleCreateNew = () => {
    setShowTemplates(true);
  };

  const handleTemplateSelect = async (templateData) => {
    setShowTemplates(false);
    try {
      const res = await api.post('/pads', {
        title: templateData.title || 'Untitled Pad',
        content_json: templateData.content_json || null,
        pad_mode: templateData.pad_mode || 'canvas',
        notes_content: templateData.notes_content || null
      });
      navigate(`/pads/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create pad:', error);
      addToast(`Failed to create: ${error.message}`, 'error');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this pad?')) return;
    
    try {
      await api.delete(`/pads/${id}`);
      setPads(pads.filter(p => p.id !== id));
      addToast('Pad deleted', 'success');
    } catch (error) {
      console.error('Failed to delete pad:', error);
      addToast('Failed to delete pad', 'error');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCardClick = (pad) => {
    if (pad.is_live_active) {
      navigate(`/pad/shared/${pad.id}?mode=${pad.live_mode || 'edit'}`);
    } else if (pad.is_owner === false) {
      navigate(`/pad/shared/${pad.id}?mode=readonly`);
    } else {
      navigate(`/pads/${pad.id}`);
    }
  };

  return (
    <div className="pad-dashboard-container animate-fade-in">
      <div className="pad-dashboard-header">
        <div>
          <h2>Writing Pads</h2>
          <p>Your distraction-free personal notes & live collaboration workspace</p>
        </div>
        <button className="pad-create-btn" onClick={handleCreateNew} type="button">
          <Plus size={16} />
          <span>New Pad</span>
        </button>
      </div>

      {/* Live Collaboration Invitation Banner */}
      {invitations.length > 0 && (
        <div className="pad-invitations-section" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#105934', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} className="spin-icon" style={{ color: '#105934' }} /> Active Collaboration Invitations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invitations.map(inv => (
              <div 
                key={inv.id} 
                className="pad-invitation-card animate-pop-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 89, 52, 0.08) 0%, rgba(16, 89, 52, 0.02) 100%)',
                  border: '1px solid rgba(16, 89, 52, 0.25)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#105934', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      ⚡ LIVE SESSION
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Hosted by <strong>{inv.host_name}</strong>
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    You are invited to collaborate on "{inv.title || 'Untitled Pad'}"
                  </h4>
                </div>
                <button 
                  onClick={() => navigate(`/pad/shared/${inv.id}?mode=${inv.live_mode || 'edit'}`)}
                  style={{
                    background: '#105934',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.65rem 1.2rem',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 89, 52, 0.2)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Join Collaboration <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="pad-loading-state">
          <div className="spinner"></div>
          <p>Loading your pads...</p>
        </div>
      ) : pads.length === 0 ? (
        <div className="pad-empty-state animate-fade-in">
          <div className="pad-empty-icon-box">
            <FileText size={36} />
          </div>
          <h3>No writing pads yet</h3>
          <p>Create your first writing pad to start sketching, typing notes, or collaborating in real time.</p>
          <button className="pad-empty-create-btn" onClick={handleCreateNew} type="button">
            <Plus size={18} />
            <span>Create New Pad</span>
          </button>
        </div>
      ) : (
        <div className="pad-grid">
          {pads.map(pad => (
            <div key={pad.id} className="pad-card" onClick={() => handleCardClick(pad)}>
              <div className="pad-card-header">
                <div className="pad-icon-box">
                  <FileText size={20} />
                </div>
                <button 
                  className="pad-delete-btn" 
                  onClick={(e) => handleDelete(e, pad.id)}
                  title="Delete Pad"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="pad-card-body">
                <h3>{pad.title || 'Untitled Pad'}</h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {pad.pad_mode && (
                    <span className="pad-mode-pill">
                      {pad.pad_mode === 'split' ? 'Split View' : pad.pad_mode === 'notes' ? 'Notes' : 'Canvas'}
                    </span>
                  )}
                  {pad.is_live_active ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 89, 52, 0.12)', color: '#105934', padding: '2px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700 }}>
                      <Zap size={11} style={{ color: '#105934' }} /> Live
                    </span>
                  ) : pad.is_owner === false ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--hover-bg, #f1f5f9)', color: 'var(--text-secondary, #64748b)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 600 }}>
                      <Users size={11} /> Shared
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="pad-card-footer">
                <Clock size={13} /> 
                <span>Updated {formatDate(pad.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AcademicTemplates 
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default PadDashboard;
