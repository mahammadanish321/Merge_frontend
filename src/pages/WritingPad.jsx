import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, Download, Sparkles, Share2, Users, Library, Mic, ImagePlus } from 'lucide-react';
import api from '../api';
import './WritingPad.css';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DocumentSidebar from '../components/SmartPad/DocumentSidebar';
import { AIAssistantWidget } from '../components/SmartPad/AIAssistantWidget';
import { ImmersiveAIMenu } from '../components/SmartPad/ImmersiveAIMenu';
import { SharePadModal } from '../components/SmartPad/SharePadModal';
import { Excalidraw, exportToBlob, MainMenu } from '@excalidraw/excalidraw';
import { io } from 'socket.io-client';
import { PadModeToggle } from '../components/SmartPad/PadModeToggle';
import { RichTextEditor } from '../components/SmartPad/RichTextEditor';
import { StudyToolbar } from '../components/SmartPad/StudyToolbar';
import { FlashcardDrawer } from '../components/SmartPad/FlashcardDrawer';
import { QuizModal } from '../components/SmartPad/QuizModal';
import { MathSolver } from '../components/SmartPad/MathSolver';
import { VoiceRecorder } from '../components/SmartPad/VoiceRecorder';
import '@excalidraw/excalidraw/index.css';

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee', color: 'red', height: '100vh', overflow: 'auto' }}>
          <h2>Something went wrong in the component.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const WritingPad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [loading, setLoading] = useState(true);
  const [activeDocument, setActiveDocument] = useState(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [immersiveMenu, setImmersiveMenu] = useState({ isOpen: false, position: null, selectedElement: null, canvasContext: '' });
  
  // Pad Mode & Notes State
  const [padMode, setPadMode] = useState('canvas'); // 'canvas' | 'split' | 'notes'
  const [notesContent, setNotesContent] = useState(null);
  const notesContentRef = useRef(null);
  const editorRef = useRef(null);
  
  // Study Tools State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isMathSolverOpen, setIsMathSolverOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  
  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const isResizing = useRef(false);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = document.body.clientWidth - e.clientX;
    if (newWidth >= 260 && newWidth <= 720) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      const iframes = document.querySelectorAll('.smart-pad-wrapper iframe, .smart-pad-wrapper .excalidraw');
      iframes.forEach(el => { el.style.pointerEvents = ''; });
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    const iframes = document.querySelectorAll('.smart-pad-wrapper iframe, .smart-pad-wrapper .excalidraw');
    iframes.forEach(el => { el.style.pointerEvents = 'none'; });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Split View Resize State (between Notes & Canvas)
  const [splitRatio, setSplitRatio] = useState(50); // percentage for Notes panel
  const isSplitResizing = useRef(false);
  const editorCanvasContainerRef = useRef(null);

  const handleSplitMouseMove = useCallback((e) => {
    if (!isSplitResizing.current || !editorCanvasContainerRef.current) return;
    const containerRect = editorCanvasContainerRef.current.getBoundingClientRect();
    if (!containerRect.width) return;
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newRatio >= 20 && newRatio <= 80) {
      setSplitRatio(Math.round(newRatio));
    }
  }, []);

  const handleSplitMouseUp = useCallback(() => {
    if (isSplitResizing.current) {
      isSplitResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      const iframes = document.querySelectorAll('.smart-pad-wrapper iframe, .smart-pad-wrapper .excalidraw');
      iframes.forEach(el => { el.style.pointerEvents = ''; });
    }
    document.removeEventListener('mousemove', handleSplitMouseMove);
    document.removeEventListener('mouseup', handleSplitMouseUp);
  }, [handleSplitMouseMove]);

  const handleSplitMouseDown = (e) => {
    e.preventDefault();
    isSplitResizing.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    const iframes = document.querySelectorAll('.smart-pad-wrapper iframe, .smart-pad-wrapper .excalidraw');
    iframes.forEach(el => { el.style.pointerEvents = 'none'; });
    document.addEventListener('mousemove', handleSplitMouseMove);
    document.addEventListener('mouseup', handleSplitMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleSplitMouseMove);
      document.removeEventListener('mouseup', handleSplitMouseUp);
    };
  }, [handleSplitMouseMove, handleSplitMouseUp]);
  
  // Sharing & Collaboration State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [collaborators, setCollaborators] = useState(1);
  const socketRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Excalidraw Theme Sync
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Cleanup socket on unmount
    return () => {
      observer.disconnect();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Excalidraw Initial Data
  const [initialData, setInitialData] = useState(null);
  const excalidrawAPIRef = useRef(null);

  // Use refs to access current state in debounced function without recreation
  const contentRef = useRef(null);
  const titleRef = useRef(title);
  const isFetchingRef = useRef(true);
  const menuDebounceRef = useRef(null);

  // The actual save API call
  const performSave = async (currentTitle, excalidrawData) => {
    try {
      setSaveStatus('saving');
      const payload = {
        title: currentTitle,
        content_json: excalidrawData
      };
      
      await api.put(`/pads/${id}`, payload);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  };

  const debouncedSave = useCallback(
    debounce((newTitle, newContent) => {
      performSave(newTitle, newContent);
    }, 1000),
    [id]
  );

  const performNotesSave = async (currentTitle, notesData) => {
    try {
      setSaveStatus('saving');
      await api.put(`/pads/${id}`, {
        title: currentTitle,
        notes_content: notesData
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Notes auto-save failed:', error);
      setSaveStatus('error');
    }
  };

  const debouncedNotesSave = useCallback(
    debounce((newTitle, newContent) => {
      performNotesSave(newTitle, newContent);
    }, 1000),
    [id]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchPad = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pads/${id}`);
        if (!isMounted) return;

        setTitle(res.data.title || 'Untitled Pad');
        titleRef.current = res.data.title || 'Untitled Pad';
        setIsPublic(res.data.is_public || false);
        
        // Load pad mode and notes content
        setPadMode(res.data.pad_mode || 'canvas');
        if (res.data.notes_content) {
          const notesData = typeof res.data.notes_content === 'string'
            ? JSON.parse(res.data.notes_content)
            : res.data.notes_content;
          setNotesContent(notesData);
          notesContentRef.current = notesData;
        }
        
        if (res.data.is_live_active) {
          setIsLiveSession(true);
          initSocketSession();
        }
        
        let loadedData = { elements: [], appState: {} };
        if (res.data.content_json) {
          try {
            const parsed = typeof res.data.content_json === 'string' 
              ? JSON.parse(res.data.content_json) 
              : res.data.content_json;
            
            // If it's old TipTap HTML data, ignore it or clear it
            if (parsed.html !== undefined) {
              loadedData = { elements: [], appState: {} };
            } else {
              loadedData = parsed;
            }
          } catch (e) {
             loadedData = { elements: [], appState: {} };
          }
        }
        
        contentRef.current = loadedData;
        setInitialData(loadedData);
        isFetchingRef.current = false;
        setSaveStatus('saved');
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch pad:', error);
        const msg = error.response?.data?.message || error.message || 'Failed to load pad';
        addToast(msg, 'error');
        navigate('/pads');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPad();

    return () => {
      isMounted = false;
    };
  }, [id, addToast, navigate]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;
    setSaveStatus('saving');
    debouncedSave(newTitle, contentRef.current);
  };

  const handleNotesChange = (json) => {
    setNotesContent(json);
    notesContentRef.current = json;
    setSaveStatus('saving');
    debouncedNotesSave(titleRef.current, json);
    
    // Broadcast via socket for live collaboration
    if (isLiveSession && socketRef.current) {
      socketRef.current.emit('notes_update', {
        padId: id,
        notesContent: json
      });
    }
  };

  const handleModeChange = async (newMode) => {
    setPadMode(newMode);
    try {
      await api.put(`/pads/${id}`, { pad_mode: newMode });
    } catch (err) {
      console.error('Failed to save pad mode:', err);
    }
  };

  const handleGenerateMindmap = async () => {
    if (!excalidrawAPIRef.current) return;
    try {
      const res = await api.post(`/pads/${id}/mindmap`);
      if (res.data?.mermaid) {
        const { parseMermaidToExcalidraw } = await import('@excalidraw/mermaid-to-excalidraw');
        let cleanMermaid = res.data.mermaid;
        if (cleanMermaid.startsWith('```')) {
          cleanMermaid = cleanMermaid.replace(/^```mermaid\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = await parseMermaidToExcalidraw(cleanMermaid, { fontSize: 20 });
        const elements = excalidrawAPIRef.current.getSceneElements();
        excalidrawAPIRef.current.updateScene({ elements: [...elements, ...parsed.elements] });
        if (padMode === 'notes') setPadMode('split');
      }
    } catch (err) {
      console.error('Failed to generate mindmap:', err);
      addToast('Failed to generate mindmap', 'error');
    }
  };

  const handleInsertCanvasSelectionToNotes = async () => {
    if (!excalidrawAPIRef.current) {
      addToast('Canvas is not ready yet', 'error');
      return;
    }

    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const selectedIds = Object.keys(appState.selectedElementIds || {}).filter(id => appState.selectedElementIds[id]);

      let elementsToExport = elements.filter(el => selectedIds.includes(el.id) && !el.isDeleted);

      // If nothing selected, prompt or export visible elements
      if (elementsToExport.length === 0) {
        const visibleElements = elements.filter(el => !el.isDeleted);
        if (visibleElements.length === 0) {
          addToast('Please select elements or draw on the canvas first!', 'info');
          return;
        }
        elementsToExport = visibleElements;
      }

      // Convert selection to PNG image
      const blob = await exportToBlob({
        elements: elementsToExport,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
          exportWithDarkMode: isDark,
        },
        files: excalidrawAPIRef.current.getFiles(),
        mimeType: 'image/png',
      });

      // Convert blob to base64 Data URL so it is fully self-contained in the notes document
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // If in canvas mode, switch to split mode so notes are visible
      if (padMode === 'canvas') {
        handleModeChange('split');
      }

      // If editor instance is active, insert image node directly
      if (editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: dataUrl }).run();
      } else {
        // Fallback: append image to notesContent JSON
        const imageNode = {
          type: 'image',
          attrs: { src: dataUrl }
        };
        const currentContent = notesContentRef.current || { type: 'doc', content: [] };
        const updated = {
          ...currentContent,
          content: [...(currentContent.content || []), imageNode]
        };
        handleNotesChange(updated);
      }

      addToast('📸 Canvas snapshot added to notes!', 'success');
    } catch (err) {
      console.error('Failed to export canvas selection to notes:', err);
      addToast('Failed to copy selection to notes', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (!excalidrawAPIRef.current) return;
    
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      if (!elements || !elements.length) {
        addToast('The canvas is empty.', 'info');
        return;
      }
      
      const blob = await exportToBlob({
        elements,
        mimeType: 'image/png',
        appState: { exportBackground: true }
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'Pad'}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      addToast('Exported as PNG successfully!', 'success');
    } catch (err) {
      console.error('Failed to export:', err);
      addToast('Export failed', 'error');
    }
  };

  const handlePointerUpdate = useCallback((payload) => {
    if (isLiveSession && socketRef.current) {
      socketRef.current.emit('pointer_update', {
        padId: id,
        pointer: payload.pointer,
        button: payload.button,
        username: user?.name || user?.email?.split('@')[0] || 'Collaborator'
      });
    }
  }, [id, isLiveSession, user]);

  const initSocketSession = () => {
    if (socketRef.current) return;
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    socketRef.current = io(`${backendUrl}/pads`, {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_pad', id);
    });
    
    socketRef.current.on('collaborator_joined', () => {
      setCollaborators(prev => prev + 1);
      addToast('⚡ A collaborator joined the session!', 'info');
    });

    socketRef.current.on('collaborator_left', () => {
      setCollaborators(prev => Math.max(1, prev - 1));
    });
    
    socketRef.current.on('pad_update', (data) => {
      if (excalidrawAPIRef.current && data.elements) {
        isRemoteUpdateRef.current = true;
        excalidrawAPIRef.current.updateScene({ 
          elements: data.elements,
          ...(data.appState?.viewBackgroundColor ? { appState: { viewBackgroundColor: data.appState.viewBackgroundColor } } : {})
        });
      }
    });

    socketRef.current.on('notes_update', (data) => {
      if (data.notesContent) {
        setNotesContent(data.notesContent);
        notesContentRef.current = data.notesContent;
      }
    });

    socketRef.current.on('pointer_update', (data) => {
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
  };

  const startLiveSession = async (audienceSettings = {}) => {
    setIsLiveSession(true);
    setIsPublic(true);

    try {
      await api.put(`/pads/${id}`, { 
        is_public: true,
        is_live_active: true,
        target_audience_type: audienceSettings.targetAudienceType || 'everyone',
        target_year: audienceSettings.targetYear || null,
        target_stream: audienceSettings.targetStream || null,
        invited_user_ids: audienceSettings.invitedUserIds || [],
        live_mode: audienceSettings.collabPermission || 'edit'
      });
    } catch (err) {
      console.error('Failed to mark pad as active live session in DB:', err);
    }
    
    initSocketSession();
  };

  const stopLiveSession = async () => {
    setIsLiveSession(false);
    try {
      await api.put(`/pads/${id}`, { is_live_active: false });
    } catch (err) {
      console.error('Failed to update live session state in DB:', err);
    }
    if (socketRef.current) {
      socketRef.current.emit('leave_pad', id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    addToast('Live session stopped', 'info');
  };

  const onExcalidrawChange = (elements, appState) => {
    if (isFetchingRef.current) return;
    
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (isLiveSession && socketRef.current) {
      socketRef.current.emit('pad_update', { 
        padId: id, 
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor }
      });
    }
    
    // Save logic
    const excalidrawData = { 
      elements, 
      appState: { 
        viewBackgroundColor: appState.viewBackgroundColor 
      } 
    };
    
    contentRef.current = excalidrawData;
    setSaveStatus('saving');
    debouncedSave(titleRef.current, excalidrawData);

    // Immersive AI Menu Logic
    // Don't show menu if user is dragging or resizing
    if (appState.draggingElement || appState.resizingElement || appState.multiElement) {
      if (immersiveMenu.isOpen) setImmersiveMenu(prev => ({ ...prev, isOpen: false }));
      return;
    }

    const selectedIds = Object.keys(appState.selectedElementIds || {}).filter(id => appState.selectedElementIds[id]);
    
    if (selectedIds.length > 0) {
      if (menuDebounceRef.current) clearTimeout(menuDebounceRef.current);
      
      menuDebounceRef.current = setTimeout(() => {
        const selectedElements = elements.filter(el => selectedIds.includes(el.id) && !el.isDeleted);
        
        if (selectedElements.length > 0) {
          // Bounding box for multiple elements
          const minX = Math.min(...selectedElements.map(el => el.x));
          const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
          const minY = Math.min(...selectedElements.map(el => el.y));

          // Extract text from selected elements (if any)
          const selectedTextStr = selectedElements
            .filter(el => el.type === 'text')
            .map(el => el.text)
            .join('\\n\\n');
          
          // Manual coordinate calculation from scene to viewport
          const zoom = typeof appState.zoom === 'number' ? appState.zoom : (appState.zoom?.value || 1);
          const scrollX = appState.scrollX || 0;
          const scrollY = appState.scrollY || 0;
          
          // Top-right of the bounding box
          const sceneX = maxX;
          const sceneY = minY;
          
          // Place it to the right of the element
          const viewportX = (sceneX + scrollX) * zoom + 40;
          const viewportY = (sceneY + scrollY) * zoom + 10; 

          const safeX = isNaN(viewportX) ? 0 : viewportX;
          const safeY = isNaN(viewportY) ? 0 : viewportY;

          // Gather Canvas Context (all other text on canvas)
          const canvasContext = elements
            .filter(el => el.type === 'text' && !el.isDeleted && !selectedIds.includes(el.id))
            .map(el => el.text)
            .join('\\n\\n');

          setImmersiveMenu(prev => {
            if (prev.isOpen && prev.position?.x === safeX && prev.position?.y === safeY && prev.selectedText === selectedTextStr) {
              return prev;
            }
            return {
              isOpen: true,
              position: { x: safeX, y: safeY },
              selectedElement: selectedElements[0], // Keep primary element for anchoring
              selectedText: selectedTextStr,
              canvasContext
            };
          });
        } else {
          setImmersiveMenu(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
        }
      }, 300); // 300ms debounce to wait for selection to finish
    } else {
      if (menuDebounceRef.current) clearTimeout(menuDebounceRef.current);
      setImmersiveMenu(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
    }
  };

  const handleImmersiveActionComplete = async (newText, isReplace, isDiagram = false) => {
    if (!excalidrawAPIRef.current || !immersiveMenu.selectedElement) return;
    
    if (!newText || newText.trim() === '') {
      alert("AI returned an empty response. Check backend console for errors.");
      return;
    }

    if (isDiagram) {
      try {
        const { parseMermaidToExcalidraw } = await import('@excalidraw/mermaid-to-excalidraw');
        let cleanMermaid = newText;
        if (cleanMermaid.startsWith('```mermaid')) {
          cleanMermaid = cleanMermaid.replace(/^```mermaid\n/, '').replace(/\n```$/, '');
        }
        if (cleanMermaid.startsWith('```')) {
          cleanMermaid = cleanMermaid.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const res = await parseMermaidToExcalidraw(cleanMermaid, { fontSize: 20 });
        const elements = excalidrawAPIRef.current.getSceneElements();
        const originalEl = immersiveMenu.selectedElement;
        
        const offsetX = originalEl.x + originalEl.width + 80;
        const offsetY = originalEl.y;
        
        const minX = Math.min(...res.elements.map(el => el.x));
        const minY = Math.min(...res.elements.map(el => el.y));

        const offsetElements = res.elements.map(el => ({
            ...el,
            x: el.x - minX + offsetX,
            y: el.y - minY + offsetY
        }));

        excalidrawAPIRef.current.updateScene({ elements: [...elements, ...offsetElements] });
      } catch (err) {
        console.error("Failed to parse mermaid diagram", err);
        alert("Failed to insert diagram. It might be too complex or invalid Mermaid syntax.");
      }
      return;
    }

    const elements = excalidrawAPIRef.current.getSceneElements();
    const originalEl = immersiveMenu.selectedElement;

    if (isReplace) {
      // Replace the text of the selected element
      const updatedElements = elements.map(el => {
        if (el.id === originalEl.id) {
          return { ...el, text: newText, originalText: newText, updated: Date.now(), version: el.version + 1 };
        }
        return el;
      });
      excalidrawAPIRef.current.updateScene({ elements: updatedElements });
    } else {
      // Spawn a new text box adjacent to the original
      const newElement = {
        ...originalEl,
        id: `ai-text-${Date.now()}`,
        x: originalEl.x + originalEl.width + 40,
        text: newText,
        originalText: newText,
        seed: Math.random() * 100000,
        version: 1,
        versionNonce: Math.random() * 100000,
        updated: Date.now(),
        boundElements: null,
      };
      excalidrawAPIRef.current.updateScene({ elements: [...elements, newElement] });
    }
  };

  if (loading || !initialData) {
    return (
      <div className="pad-editor-container animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="smart-pad-wrapper" style={{ display: 'flex' }}>
      
      <div className="pad-editor-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Editor Top Navigation Bar */}
        <div className="pad-editor-header">
          {/* Zone 1: Back, Title & Save Status */}
          <div className="pad-header-left">
            <button 
              className="pad-header-icon-btn" 
              onClick={() => navigate('/pads')}
              title="Back to Writing Pads"
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="pad-title-wrapper">
              <input 
                type="text"
                className="pad-title-input"
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled Pad"
                title="Click to rename pad"
              />
            </div>
            <div className="pad-save-badge">
              {saveStatus === 'saved' && (
                <span className="status-indicator saved">
                  <CheckCircle2 size={13} />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="status-indicator saving">
                  <span className="save-dot spin-icon" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="status-indicator error">
                  <span>Error saving</span>
                </span>
              )}
            </div>
          </div>

          {/* Zone 2: Segmented View Mode Toggle */}
          <div className="pad-header-center">
            <PadModeToggle mode={padMode} onChange={handleModeChange} />
          </div>

          {/* Zone 3: Standardized Action Buttons */}
          <div className="pad-header-right">
            {/* Canvas Actions */}
            {(padMode === 'canvas' || padMode === 'split') && (
              <div className="header-btn-group">
                <button 
                  onClick={handleInsertCanvasSelectionToNotes}
                  className="header-action-btn primary-tint"
                  title="Snap selected canvas area directly into your notes"
                  type="button"
                >
                  <ImagePlus size={15} />
                  <span className="btn-text">Snap to Notes</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="header-action-btn"
                  title="Export canvas as high-resolution image"
                  type="button"
                >
                  <Download size={15} />
                  <span className="btn-text">Export</span>
                </button>
              </div>
            )}

            <div className="header-divider" />

            {/* Pad Utilities */}
            <div className="header-btn-group">
              <button
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                className={`header-action-btn ${isLibraryOpen ? 'active' : ''}`}
                title="Study Sources & AI Documents"
                type="button"
              >
                <Library size={15} />
                <span className="btn-text">Sources</span>
              </button>

              <button 
                onClick={() => setIsVoiceRecorderOpen(!isVoiceRecorderOpen)}
                className={`header-action-btn ${isVoiceRecorderOpen ? 'active-recording' : ''}`}
                title="Voice Notes"
                type="button"
              >
                <Mic size={15} />
                <span className="btn-text">Voice</span>
              </button>

              <button 
                onClick={() => setIsShareModalOpen(true)}
                className={`header-action-btn ${isLiveSession ? 'active-live' : ''}`}
                title="Live Collaboration & Sharing"
                type="button"
              >
                <Share2 size={15} />
                <span className="btn-text">Share</span>
                {isLiveSession && (
                  <span className="collab-badge">{collaborators}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Canvas Area */}
        <div 
          ref={editorCanvasContainerRef}
          className="pad-editor-canvas" 
          style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'row', minHeight: 0 }}
        >
          {/* Notes Panel (left side in split mode, or full width in notes mode) */}
          {(padMode === 'notes' || padMode === 'split') && (
            <div 
              className="pad-notes-panel-wrapper"
              style={{ 
                width: padMode === 'split' ? `${splitRatio}%` : '100%', 
                minWidth: padMode === 'split' ? '280px' : '100%',
                maxWidth: padMode === 'split' ? '80%' : '100%',
                height: '100%', 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <RichTextEditor
                content={notesContent}
                onChange={handleNotesChange}
                readOnly={false}
                placeholder="Start typing your notes..."
                editorRef={editorRef}
                onSnapCanvas={handleInsertCanvasSelectionToNotes}
              />
            </div>
          )}

          {/* Draggable Split Divider in Split Mode */}
          {padMode === 'split' && (
            <div 
              className="pad-split-divider"
              onMouseDown={handleSplitMouseDown}
              onDoubleClick={() => setSplitRatio(50)}
              title="Drag to resize panels (Double-click to reset 50/50)"
              role="separator"
              aria-orientation="vertical"
            >
              <div className="pad-split-divider-grip" />
            </div>
          )}

          {/* Canvas Panel (right side in split mode, or full width in canvas mode) */}
          {(padMode === 'canvas' || padMode === 'split') && (
            <div 
              className="pad-canvas-panel-wrapper"
              style={{ 
                width: padMode === 'split' ? `${100 - splitRatio}%` : '100%', 
                flex: padMode === 'split' ? 'none' : 1,
                minWidth: padMode === 'split' ? '280px' : 0,
                height: '100%', 
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Excalidraw 
                excalidrawAPI={(api) => excalidrawAPIRef.current = api}
                initialData={initialData}
                onChange={onExcalidrawChange}
                onPointerUpdate={handlePointerUpdate}
                theme={isDark ? 'dark' : 'light'}
                UIOptions={{
                  canvasActions: {
                    toggleTheme: false,
                    changeViewBackgroundColor: true,
                  }
                }}
              >
            <MainMenu>
              <MainMenu.Item onSelect={() => {
                if (excalidrawAPIRef.current) {
                  excalidrawAPIRef.current.updateScene({
                    appState: { openSidebar: { name: "default", tab: "library" } }
                  });
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Library size={14} /> Library
                </div>
              </MainMenu.Item>
              <MainMenu.Separator />
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </Excalidraw>

          <ImmersiveAIMenu 
            isOpen={immersiveMenu.isOpen}
            onClose={() => setImmersiveMenu(prev => ({ ...prev, isOpen: false }))}
            position={immersiveMenu.position}
            selectedText={immersiveMenu.selectedText || ''}
            canvasContext={immersiveMenu.canvasContext}
            onActionComplete={handleImmersiveActionComplete}
            excalidrawAPI={excalidrawAPIRef.current}
            onInsertToNotes={handleInsertCanvasSelectionToNotes}
          />
            </div>
          )}
        </div>

        {/* Study Tools */}
        <StudyToolbar
          onFlashcards={() => setIsFlashcardOpen(true)}
          onQuiz={() => setIsQuizOpen(true)}
          onMindmap={handleGenerateMindmap}
          onMathSolver={() => setIsMathSolverOpen(true)}
        />
        
        <FlashcardDrawer isOpen={isFlashcardOpen} onClose={() => setIsFlashcardOpen(false)} padId={id} />
        <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} padId={id} />
        <MathSolver isOpen={isMathSolverOpen} onClose={() => setIsMathSolverOpen(false)} padId={id} />
        <VoiceRecorder isOpen={isVoiceRecorderOpen} onClose={() => setIsVoiceRecorderOpen(false)} padId={id} />
        
        <SharePadModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          padId={id} 
          initialIsPublic={isPublic}
          isLiveSession={isLiveSession}
          onLiveSessionStart={startLiveSession}
          onLiveSessionStop={stopLiveSession}
          userName={user?.name}
        />

      </div>

      {isLibraryOpen && (
        <>
          {/* Resize Handle */}
          <div 
            className="pad-sidebar-resizer"
            onMouseDown={handleMouseDown}
            onDoubleClick={() => setSidebarWidth(360)}
            title="Drag to resize panel (Double-click to reset)"
          >
            <div className="pad-resizer-line" />
          </div>
          {/* Sidebar */}
          <div 
            className="pad-sidebar-container"
            style={{ width: `${sidebarWidth}px` }}
          >
            <DocumentSidebar 
              padId={id} 
              activeDocumentId={activeDocument?.pad_document_id} 
              onSelectDocument={setActiveDocument} 
              isOpen={isLibraryOpen}
              onClose={() => setIsLibraryOpen(false)}
              excalidrawAPI={excalidrawAPIRef.current}
            />
          </div>
        </>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default WritingPad;
