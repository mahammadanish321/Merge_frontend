import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, LogIn, Lock, Eye, Edit3, Sparkles, RefreshCw } from 'lucide-react';
import api from '../api';
import './WritingPad.css';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import { io } from 'socket.io-client';
import { RichTextEditor } from '../components/SmartPad/RichTextEditor';
import { PadModeToggle } from '../components/SmartPad/PadModeToggle';
import '@excalidraw/excalidraw/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("SharedPad ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: '#f8fafc', color: '#1e293b' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unable to load drawing canvas</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', fontSize: '0.9rem' }}>
            {this.state.error?.message || "An error occurred while rendering the shared pad."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.69rem 1.25rem', background: '#105934', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SharedPad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const excalidrawAPIRef = useRef(null);
  const socketRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  
  // Read mode from query param: ?mode=edit or ?mode=readonly
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : 'readonly';
  const [collabMode, setCollabMode] = useState(initialMode); // 'edit' or 'readonly'
  const [padMode, setPadMode] = useState('canvas'); // 'canvas' | 'split' | 'notes'
  const [notesContent, setNotesContent] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check auth requirement for edit mode
  useEffect(() => {
    if (collabMode === 'edit' && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [collabMode, user]);

  // Excalidraw Theme Sync
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSharedPad = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pads/shared/${id}`);
        if (!isMounted) return;

        setTitle(res.data.title || 'Shared Pad');
        
        let loadedData = { elements: [], appState: {} };
        if (res.data.content_json) {
          try {
            const parsed = typeof res.data.content_json === 'string' 
              ? JSON.parse(res.data.content_json) 
              : res.data.content_json;
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.elements)) {
                loadedData = parsed;
              } else if (parsed.html === undefined) {
                loadedData = { elements: [], appState: parsed.appState || {} };
              }
            }
          } catch (e) {
             console.error("Parse error", e);
          }
        }
        
        if (!Array.isArray(loadedData.elements)) {
          loadedData.elements = [];
        }

        setInitialData(loadedData);
        setPadMode(res.data.pad_mode || 'canvas');
        if (res.data.notes_content) {
          try {
            const parsedNotes = typeof res.data.notes_content === 'string'
              ? JSON.parse(res.data.notes_content)
              : res.data.notes_content;
            setNotesContent(parsedNotes);
          } catch (e) {
            console.error("Parse notes error", e);
          }
        }

        if (user) {
          api.post(`/pads/shared/${id}/join`).catch(err => console.error('Failed to register collaborator', err));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch shared pad:', error);
        setInitialData({ elements: [], appState: {} });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSharedPad();

    // Connect to live socket session for real-time updates
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(`${backendUrl}/pads`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_pad', id);
    });

    socket.on('pad_update', (data) => {
      if (excalidrawAPIRef.current && Array.isArray(data.elements)) {
        isRemoteUpdateRef.current = true;
        excalidrawAPIRef.current.updateScene({ elements: data.elements });
      }
    });

    socket.on('notes_update', (data) => {
      if (data.notesContent) {
        setNotesContent(data.notesContent);
      }
    });

    socket.on('pointer_update', (data) => {
      if (excalidrawAPIRef.current && data.pointer) {
        const currentAppState = excalidrawAPIRef.current.getAppState();
        const collaboratorsMap = new Map(currentAppState.collaborators || []);
        collaboratorsMap.set(data.socketId, {
          pointer: data.pointer,
          button: data.button || 'up',
          username: data.username || 'Collaborator',
          color: { background: '#105934', stroke: '#105934' }
        });
        excalidrawAPIRef.current.updateScene({ collaborators: collaboratorsMap });
      }
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leave_pad', id);
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (user && id) {
      api.post(`/pads/shared/${id}/join`).catch(err => console.error('Failed to register collaborator', err));
    }
  }, [id, user]);

  const handlePointerUpdate = useCallback((payload) => {
    if (socketRef.current) {
      socketRef.current.emit('pointer_update', {
        padId: id,
        pointer: payload.pointer,
        button: payload.button,
        username: user?.name || user?.email?.split('@')[0] || 'Collaborator'
      });
    }
  }, [id, user]);

  const performSave = async (elements, appState) => {
    try {
      await api.put(`/pads/${id}`, {
        content_json: { elements, appState }
      });
    } catch (err) {
      console.error('Failed to auto-save shared pad', err);
    }
  };

  const debouncedSave = useCallback(
    debounce((elements, appState) => {
      performSave(elements, appState);
    }, 1000),
    [id]
  );

  const handleNotesChange = (json) => {
    setNotesContent(json);
    if (collabMode === 'edit' && socketRef.current) {
      socketRef.current.emit('notes_update', {
        padId: id,
        notesContent: json
      });
      api.put(`/pads/${id}`, { notes_content: json }).catch(console.error);
    }
  };

  const onExcalidrawChange = useCallback((elements, appState) => {
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (collabMode === 'edit' && socketRef.current && Array.isArray(elements)) {
      socketRef.current.emit('pad_update', { 
        padId: id, 
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor }
      });
      debouncedSave(elements, { viewBackgroundColor: appState.viewBackgroundColor });
    }
  }, [id, collabMode, debouncedSave]);

  const handleSaveToDesk = async () => {
    try {
      const res = await api.post('/pads', {
        title: `${title} (Copy)`,
        content_json: initialData
      });
      addToast('Pad copied to your account!', 'success');
      navigate(`/pads/${res.data.id}`);
    } catch (err) {
      console.error('Failed to copy pad:', err);
      addToast('Failed to save pad', 'error');
    }
  };

  const handleLoginToCollaborate = () => {
    const currentHashOrPath = window.location.hash || (window.location.pathname + window.location.search);
    const redirectUrl = encodeURIComponent(currentHashOrPath);
    navigate(`/login?redirect=${redirectUrl}`);
  };

  if (loading || !initialData) {
    return (
      <div className="pad-editor-container animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', height: '100vh', width: '100vw' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const padContent = (
    <div className="pad-editor-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative', height: '100%', width: '100%' }}>
      
      {/* Login Requirement Modal for Edit Mode */}
      {showAuthModal && (
        <div className="share-modal-overlay animate-fade-in" style={{ zIndex: 20000, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="share-modal-content animate-pop-in" style={{ textAlign: 'center', maxWidth: '440px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(16, 89, 52, 0.12)', color: '#105934', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>Please Log In to Collaborate</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              You need a Merge account to join this live pad in full editing mode.
            </p>
            <button 
              className="share-btn primary" 
              onClick={handleLoginToCollaborate}
              style={{ marginBottom: '0.75rem' }}
            >
              <LogIn size={16} /> Log In to Collaborate
            </button>
            <button 
              className="share-btn secondary"
              onClick={() => {
                setCollabMode('readonly');
                setShowAuthModal(false);
              }}
            >
              <Eye size={16} /> Continue as Read-Only Guest
            </button>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="pad-editor-header">
        <div className="pad-header-left">
          <button className="icon-btn-ghost" onClick={() => navigate(-1)} title="Go back">
            <ArrowLeft size={18} />
          </button>
          <div className="pad-title-input" style={{ pointerEvents: 'none', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{title}</span>
            {collabMode === 'edit' ? (
              <span style={{ fontSize: '0.75rem', color: '#105934', background: 'rgba(16, 89, 52, 0.12)', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={12} /> Live Collaboration (Edit Mode)
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-bg)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} /> Read Only
              </span>
            )}
          </div>
        </div>

        <div className="pad-header-right">
          <PadModeToggle mode={padMode} onChange={setPadMode} />
          {!user ? (
            <button 
              onClick={handleLoginToCollaborate}
              className="header-action-btn"
              style={{ background: '#105934', color: 'white' }}
            >
              <LogIn size={14} /> Log in to Collaborate
            </button>
          ) : (
            <button 
              onClick={handleSaveToDesk}
              className="header-action-btn"
            >
              <Save size={14} /> Save to your Pads
            </button>
          )}
        </div>
      </div>

      {/* Editor Canvas (Excalidraw & Notes) */}
      <div className="pad-editor-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%', width: '100%', display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        {(padMode === 'notes' || padMode === 'split') && (
          <div style={{ 
            width: padMode === 'split' ? '48%' : '100%', 
            minWidth: padMode === 'split' ? '320px' : '100%',
            height: '100%', 
            borderRight: padMode === 'split' ? '1px solid var(--border-color)' : 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <RichTextEditor
              content={notesContent}
              onChange={handleNotesChange}
              readOnly={collabMode === 'readonly'}
              placeholder="Shared notes..."
            />
          </div>
        )}

        {(padMode === 'canvas' || padMode === 'split') && (
          <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Excalidraw 
              excalidrawAPI={(api) => excalidrawAPIRef.current = api}
              initialData={initialData}
              onChange={onExcalidrawChange}
              onPointerUpdate={handlePointerUpdate}
              theme={isDark ? 'dark' : 'light'}
              viewModeEnabled={collabMode === 'readonly'}
              UIOptions={{
                canvasActions: {
                  toggleTheme: false,
                  changeViewBackgroundColor: collabMode === 'edit',
                  clearCanvas: collabMode === 'edit',
                  loadScene: false,
                  saveToActiveFile: false,
                }
              }}
            >
              <MainMenu>
            <MainMenu.DefaultItems.Help />
          </MainMenu>
        </Excalidraw>
      </div>
    )}
    </div>
  </div>
);

  // If user is logged in, wrap in the standard app layout
  if (user) {
    return (
      <Layout>
        <div className="smart-pad-wrapper" style={{ display: 'flex', height: '100%', width: '100%' }}>
          {padContent}
        </div>
      </Layout>
    );
  }

  // If guest, show full screen presentation view
  return (
    <div className="smart-pad-wrapper" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {padContent}
    </div>
  );
};

export default function SharedPadWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <SharedPad {...props} />
    </ErrorBoundary>
  );
}
