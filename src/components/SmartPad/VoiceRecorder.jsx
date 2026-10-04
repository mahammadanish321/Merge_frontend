import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Play, Pause, Trash2, FileText, Loader } from 'lucide-react';
import api from '../../api';
import './VoiceRecorder.css';

const VoiceRecorder = ({ isOpen, onClose, padId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && padId) {
      fetchVoiceNotes();
    }
    return () => {
      stopRecording();
    };
  }, [isOpen, padId]);

  const fetchVoiceNotes = async () => {
    try {
      const res = await api.get(`/pads/${padId}/voice-notes`);
      setVoiceNotes(res.data || []);
    } catch (err) {
      console.error('Error fetching voice notes', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording', err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const uploadVoiceNote = async (blob) => {
    try {
      setLoading(true);
      
      // 1. Upload to /bag/files
      const file = new File([blob], `voice_note_${new Date().getTime()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/bag/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fileUrl = uploadRes.data.file_url;
      const fileName = uploadRes.data.file_name || file.name;

      // 2. Save voice note reference to pad
      const noteRes = await api.post(`/pads/${padId}/voice-notes`, {
        file_url: fileUrl,
        file_name: fileName,
        duration: recordingTime
      });

      setVoiceNotes(prev => [noteRes.data, ...prev]);
    } catch (err) {
      console.error('Error uploading voice note', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDigest = async (noteId) => {
    try {
      const updatedNotes = [...voiceNotes];
      const noteIdx = updatedNotes.findIndex(n => n._id === noteId);
      if (noteIdx === -1) return;
      
      updatedNotes[noteIdx].isProcessing = true;
      setVoiceNotes(updatedNotes);

      const res = await api.post(`/pads/${padId}/voice-notes/${noteId}/digest`);
      
      const refreshNotes = [...voiceNotes];
      refreshNotes[noteIdx] = { ...refreshNotes[noteIdx], ...res.data, isProcessing: false };
      setVoiceNotes(refreshNotes);
    } catch (err) {
      console.error('Error generating digest', err);
      // Remove loading state on error
      fetchVoiceNotes(); 
    }
  };

  const deleteVoiceNote = async (noteId) => {
    try {
      await api.delete(`/pads/${padId}/voice-notes/${noteId}`);
      setVoiceNotes(prev => prev.filter(n => n._id !== noteId));
    } catch (err) {
      console.error('Error deleting voice note', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="voice-recorder-overlay">
      <motion.div 
        className="voice-recorder-panel"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="vr-header">
          <h2>Voice Notes</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="vr-content">
          <div className="recording-section">
            <div className={`record-btn-container ${isRecording ? 'recording' : ''}`}>
              <button 
                className={`main-record-btn ${isRecording ? 'stop' : 'start'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square fill="white" size={24} /> : <Mic size={24} />}
              </button>
              {isRecording && (
                <div className="pulse-ring"></div>
              )}
            </div>
            
            <div className="recording-status">
              {isRecording ? (
                <>
                  <span className="rec-indicator"></span>
                  <span className="time">{formatTime(recordingTime)}</span>
                </>
              ) : (
                <span>Tap to start recording</span>
              )}
            </div>
            
            {loading && <div className="loading-text">Uploading...</div>}
          </div>

          <div className="voice-notes-list">
            <h3>Saved Notes</h3>
            {voiceNotes.length === 0 ? (
              <p className="empty-text">No voice notes yet.</p>
            ) : (
              voiceNotes.map(note => (
                <div key={note._id} className="voice-note-card">
                  <div className="vn-header">
                    <div className="vn-info">
                      <span className="vn-name">Note {new Date(note.createdAt).toLocaleDateString()}</span>
                      <span className="vn-duration">{formatTime(note.duration || 0)}</span>
                    </div>
                    <div className="vn-actions">
                      <button className="action-btn delete" onClick={() => deleteVoiceNote(note._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <audio controls className="custom-audio" src={note.file_url}>
                    Your browser does not support the audio element.
                  </audio>

                  <div className="vn-digest-section">
                    {note.transcript ? (
                      <div className="digest-content">
                        <h4>Summary</h4>
                        <p>{note.summary || 'Summary not available.'}</p>
                      </div>
                    ) : (
                      <button 
                        className="digest-btn" 
                        onClick={() => generateDigest(note._id)}
                        disabled={note.isProcessing}
                      >
                        {note.isProcessing ? <Loader className="spin" size={16} /> : <FileText size={16} />}
                        {note.isProcessing ? 'Processing AI Digest...' : 'Generate AI Digest'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { VoiceRecorder };
export default VoiceRecorder;
