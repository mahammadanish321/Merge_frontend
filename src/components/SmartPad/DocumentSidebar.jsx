import React, { useState, useEffect } from 'react';
import { FileText, Plus, Loader2, CheckCircle2, AlertCircle, X, Sparkles, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../api';
import BagFilePicker from './BagFilePicker';
import { AIAssistantWidget } from './AIAssistantWidget';
import './DocumentSidebar.css';

const DocumentSidebar = ({ padId, activeDocumentId, onSelectDocument, isOpen, onClose, excalidrawAPI }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sources'); // 'sources' | 'chat'

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pads/${padId}/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (padId) {
      fetchDocuments();
    }
  }, [padId]);

  const handleAttachClick = () => {
    setIsPickerOpen(true);
  };

  const handleRename = async (e, doc) => {
    e.stopPropagation();
    const newName = window.prompt('Enter new name for this file:', doc.file_name);
    if (!newName || newName === doc.file_name) return;
    try {
      await api.patch(`/bag/file/${doc.file_id}/rename`, { newName });
      setDocuments(docs => docs.map(d => d.pad_document_id === doc.pad_document_id ? { ...d, file_name: newName } : d));
    } catch (error) {
      console.error('Failed to rename document', error);
      alert('Failed to rename document.');
    }
  };

  const handleDelete = async (e, doc) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${doc.file_name}" from this pad?`)) return;
    try {
      await api.delete(`/pads/${padId}/documents/${doc.pad_document_id}`);
      setDocuments(docs => docs.filter(d => d.pad_document_id !== doc.pad_document_id));
      if (activeDocumentId === doc.pad_document_id) {
        onSelectDocument(null);
      }
    } catch (error) {
      console.error('Failed to remove document', error);
      alert('Failed to remove document.');
    }
  };

  const handleFileSelected = async (file) => {
    try {
      setLoading(true);
      await api.post(`/pads/${padId}/documents`, { fileId: file.id });
      setIsPickerOpen(false);
      fetchDocuments(); // Refresh list to show the new digesting document
    } catch (error) {
      console.error('Failed to attach document:', error);
      if (error.response?.status === 409) {
        alert('This document is already attached to this pad.');
      } else if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to attach document. Please try again.');
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="document-sidebar">
      {/* Sidebar Header with Unified Tabs */}
      <div className="sidebar-header">
        <div className="sidebar-tabs-container">
          <button 
            className={`sidebar-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
            type="button"
          >
            <FileText size={15} />
            <span>Sources {documents.length > 0 ? `(${documents.length})` : ''}</span>
          </button>
          <button 
            className={`sidebar-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            type="button"
          >
            <Sparkles size={15} />
            <span>AI Assistant</span>
          </button>
        </div>

        <div className="sidebar-header-actions">
          {activeTab === 'sources' && (
            <button 
              className="sidebar-action-icon-btn primary-tint" 
              onClick={handleAttachClick} 
              title="Attach study material from Bag"
              type="button"
            >
              <Plus size={16} />
            </button>
          )}
          <button 
            className="sidebar-action-icon-btn" 
            onClick={onClose} 
            title="Close sidebar"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Sources Tab Content */}
      <div className="document-content-area" style={{ display: activeTab === 'sources' ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {activeDocumentId ? (() => {
          const activeDoc = documents.find(d => d.pad_document_id === activeDocumentId);
          return (
            <div className="document-viewer">
              <div className="viewer-top-bar">
                <button 
                  onClick={() => onSelectDocument(null)} 
                  className="viewer-back-btn"
                  title="Back to materials list"
                  type="button"
                >
                  <ArrowLeft size={15} />
                  <span>Back to materials</span>
                </button>
                <div className="viewer-file-title" title={activeDoc?.file_name}>
                  {activeDoc?.file_name}
                </div>
              </div>
              
              <div className="viewer-body">
                {activeDoc?.file_url ? (() => {
                  let fileUrl = activeDoc.file_url;
                  
                  // Handle relative paths for local development
                  if (!fileUrl.startsWith('http')) {
                    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                    fileUrl = `${baseUrl}/${fileUrl.replace(/\\/g, '/')}`;
                  }
                  
                  if (activeDoc.file_name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    return (
                      <div className="image-viewer-container">
                        <img src={fileUrl} alt={activeDoc.file_name} />
                      </div>
                    );
                  }
                  
                  return (
                    <div className="iframe-viewer-container">
                      <iframe 
                        src={activeDoc.file_name?.toLowerCase().endsWith('.pdf') 
                          ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}` 
                          : fileUrl} 
                        title={activeDoc.file_name}
                      />
                      <div className="viewer-external-link">
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          Open in external tab
                        </a>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="processing-state">
                    <p>File preview not available.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          <div className="document-list">
            {loading ? (
              <div className="sidebar-loading">
                <Loader2 className="spin-icon" size={22} />
                <span>Loading materials...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="sidebar-empty-state">
                <div className="empty-icon-circle">
                  <FileText size={24} />
                </div>
                <h4>No materials attached</h4>
                <p>Attach notes, PDFs, or lecture slides from your Bag to power AI analysis & smart questions.</p>
                <button 
                  className="sidebar-attach-primary-btn" 
                  onClick={handleAttachClick}
                  type="button"
                >
                  <Plus size={15} /> Attach from Bag
                </button>
              </div>
            ) : (
              <div className="doc-cards-list">
                {documents.map(doc => (
                  <div 
                    key={doc.pad_document_id} 
                    className={`doc-card ${activeDocumentId === doc.pad_document_id ? 'active' : ''}`}
                    onClick={() => onSelectDocument(doc)}
                  >
                    <div className="doc-card-icon">
                      <FileText size={18} />
                    </div>
                    <div className="doc-card-info">
                      <span className="doc-card-name" title={doc.file_name}>{doc.file_name}</span>
                      <div className="doc-card-status">
                        {doc.status === 'completed' && <><CheckCircle2 size={12} className="status-success" /> <span>Ready</span></>}
                        {doc.status === 'processing' && <><Loader2 size={12} className="spin-icon" /> <span>Digesting...</span></>}
                        {doc.status === 'error' && <><AlertCircle size={12} className="status-error" /> <span>Processing error</span></>}
                      </div>
                    </div>
                    <div className="doc-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleRename(e, doc)} 
                        className="doc-action-btn"
                        title="Rename"
                        type="button"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, doc)} 
                        className="doc-action-btn danger"
                        title="Remove"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Assistant Chat Tab */}
      {activeTab === 'chat' && (
        <div className="sidebar-chat-wrapper">
          <AIAssistantWidget 
            isOpen={true} 
            isEmbedded={true}
            excalidrawAPI={excalidrawAPI}
            onClose={() => {}}
          />
        </div>
      )}

      <BagFilePicker 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelectFile={handleFileSelected} 
      />
    </div>
  );
};

export default DocumentSidebar;
