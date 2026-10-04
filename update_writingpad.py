import re
import sys

with open('/home/mahammadanish/Coding/MERGE/Merge_frontend/src/pages/WritingPad.jsx', 'r') as f:
    content = f.read()

# 1. Imports
import_replacement = """import { io } from 'socket.io-client';
import { PadModeToggle } from '../components/SmartPad/PadModeToggle';
import { RichTextEditor } from '../components/SmartPad/RichTextEditor';
import { StudyToolbar } from '../components/SmartPad/StudyToolbar';
import { FlashcardDrawer } from '../components/SmartPad/FlashcardDrawer';
import { QuizModal } from '../components/SmartPad/QuizModal';
import { MathSolver } from '../components/SmartPad/MathSolver';
import { VoiceRecorder } from '../components/SmartPad/VoiceRecorder';"""
content = content.replace("import { io } from 'socket.io-client';", import_replacement)

lucide_import_old = "import { ArrowLeft, Save, CheckCircle2, Download, Sparkles, Share2, Users, Library } from 'lucide-react';"
lucide_import_new = "import { ArrowLeft, Save, CheckCircle2, Download, Sparkles, Share2, Users, Library, Mic } from 'lucide-react';"
content = content.replace(lucide_import_old, lucide_import_new)

# 2. State variables
state_vars = """  const [immersiveMenu, setImmersiveMenu] = useState({ isOpen: false, position: null, selectedElement: null, canvasContext: '' });
  
  // Pad Mode & Notes State
  const [padMode, setPadMode] = useState('canvas'); // 'canvas' | 'split' | 'notes'
  const [notesContent, setNotesContent] = useState(null);
  const notesContentRef = useRef(null);
  
  // Study Tools State
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isMathSolverOpen, setIsMathSolverOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);"""
content = content.replace("  const [immersiveMenu, setImmersiveMenu] = useState({ isOpen: false, position: null, selectedElement: null, canvasContext: '' });", state_vars)

# 3. fetchPad changes
fetch_pad_old = """        setIsPublic(res.data.is_public || false);
        
        if (res.data.is_live_active) {"""
fetch_pad_new = """        setIsPublic(res.data.is_public || false);
        
        // Load pad mode and notes content
        setPadMode(res.data.pad_mode || 'canvas');
        if (res.data.notes_content) {
          const notesData = typeof res.data.notes_content === 'string'
            ? JSON.parse(res.data.notes_content)
            : res.data.notes_content;
          setNotesContent(notesData);
          notesContentRef.current = notesData;
        }
        
        if (res.data.is_live_active) {"""
content = content.replace(fetch_pad_old, fetch_pad_new)

# 4. Save functions
debounced_save_end = """    [id]
  );"""

notes_save_funcs = """    [id]
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
  );"""
content = content.replace(debounced_save_end, notes_save_funcs, 1)

# 5. Handlers
title_change_end = """    debouncedSave(newTitle, contentRef.current);
  };"""

notes_handlers = """    debouncedSave(newTitle, contentRef.current);
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
          cleanMermaid = cleanMermaid.replace(/^```mermaid\\n?/, '').replace(/^```\\n?/, '').replace(/\\n?```$/, '');
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
  };"""
content = content.replace(title_change_end, notes_handlers, 1)

# 6. Socket update
pad_update_end = """        });
      }
    });"""

notes_update = """        });
      }
    });

    socketRef.current.on('notes_update', (data) => {
      if (data.notesContent) {
        setNotesContent(data.notesContent);
        notesContentRef.current = data.notesContent;
      }
    });"""
content = content.replace(pad_update_end, notes_update, 1)

# 7 & 8. JSX Replacement
jsx_start = """        {/* Editor Canvas (Excalidraw) */}
        <div className="pad-editor-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>"""
jsx_start_replacement = """        {/* Editor Canvas (Excalidraw) */}
        <div className="pad-editor-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          
          {/* Notes Panel (left side in split mode, or full width in notes mode) */}
          {(padMode === 'notes' || padMode === 'split') && (
            <div style={{ 
              width: padMode === 'split' ? '45%' : '100%', 
              height: '100%', 
              borderRight: padMode === 'split' ? '1px solid var(--border-color)' : 'none',
              overflow: 'auto'
            }}>
              <RichTextEditor
                content={notesContent}
                onChange={handleNotesChange}
                readOnly={false}
                placeholder="Start typing your notes..."
              />
            </div>
          )}

          {/* Canvas Panel (right side in split mode, or full width in canvas mode) */}
          {(padMode === 'canvas' || padMode === 'split') && (
            <div style={{ 
              flex: 1, 
              height: '100%', 
              position: 'relative' 
            }}>"""
content = content.replace(jsx_start, jsx_start_replacement)

# Top Right UI update
top_right_ui_old = """            renderTopRightUI={() => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '8px' }}>
                <div className="pad-save-status" style={{ fontSize: '0.8rem' }}>"""
top_right_ui_new = """            renderTopRightUI={() => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '8px' }}>
                <PadModeToggle mode={padMode} onChange={handleModeChange} />
                <div className="pad-save-status" style={{ fontSize: '0.8rem' }}>"""
content = content.replace(top_right_ui_old, top_right_ui_new)

# Bottom Right UI Voice Recorder update & Study Tools & closing tags
bottom_right_ui_old = """            <button 
              onClick={() => setIsShareModalOpen(true)}"""
bottom_right_ui_new = """            <button 
              onClick={() => setIsVoiceRecorderOpen(!isVoiceRecorderOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isVoiceRecorderOpen ? '#ef4444' : 'var(--surface-bg)',
                border: isVoiceRecorderOpen ? 'none' : '1px solid var(--border-color)',
                color: isVoiceRecorderOpen ? 'white' : 'var(--text-primary)',
                width: '36px', height: '36px', borderRadius: '8px',
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
              title="Voice Notes"
            >
              <Mic size={16} />
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}"""
content = content.replace(bottom_right_ui_old, bottom_right_ui_new)

canvas_end_old = """            excalidrawAPI={excalidrawAPIRef.current}
          />
        </div>

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

      </div>"""
canvas_end_new = """            excalidrawAPI={excalidrawAPIRef.current}
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

      </div>"""
content = content.replace(canvas_end_old, canvas_end_new)

with open('/home/mahammadanish/Coding/MERGE/Merge_frontend/src/pages/WritingPad.jsx', 'w') as f:
    f.write(content)

print("Done")
