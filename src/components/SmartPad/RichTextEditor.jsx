import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Undo, Redo, Table as TableIcon, Highlighter, Minus, ImagePlus, Trash2, Plus } from 'lucide-react';
import './RichTextEditor.css';

const MenuBar = ({ editor, onSnapCanvas = null }) => {
  if (!editor) {
    return null;
  }

  const isTableActive = editor.isActive('table');

  const handleDelete = () => {
    if (editor.isActive('table')) {
      editor.chain().focus().deleteTable().run();
    } else {
      const { selection } = editor.state;
      if (!selection.empty) {
        editor.chain().focus().deleteSelection().run();
      } else {
        editor.chain().focus().selectParentNode().deleteSelection().run();
      }
    }
  };

  return (
    <div className="rich-text-menubar-container">
      <div className="rich-text-toolbar">
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          <Code size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
          <button
            onClick={handleDelete}
            className={isTableActive ? 'danger-btn' : ''}
            title={isTableActive ? "Delete Table" : "Delete Current Line / Element"}
          >
            <Trash2 size={16} />
          </button>
        </div>

      {onSnapCanvas && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              onClick={onSnapCanvas}
              title="Insert Canvas Selection as Image"
              style={{ color: '#105934' }}
            >
              <ImagePlus size={16} />
            </button>
          </div>
        </>
      )}
      </div>

      {/* Contextual Table Actions Bar */}
      {isTableActive && (
        <div className="rich-text-sub-toolbar">
          <span className="sub-toolbar-label">Table:</span>
          <button onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below">
            <Plus size={12} /> Row
          </button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Current Row">
            <Minus size={12} /> Row
          </button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right">
            <Plus size={12} /> Col
          </button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Current Column">
            <Minus size={12} /> Col
          </button>
          <button 
            onClick={() => editor.chain().focus().deleteTable().run()} 
            className="danger-btn"
            title="Delete Entire Table"
          >
            <Trash2 size={12} /> Delete Table
          </button>
        </div>
      )}
    </div>
  );
};

const RichTextEditor = ({ content, onChange, readOnly = false, placeholder = "Start typing...", editorRef = null, onSnapCanvas = null }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  return (
    <div className={`rich-text-editor ${readOnly ? 'read-only' : ''}`}>
      {!readOnly && <MenuBar editor={editor} onSnapCanvas={onSnapCanvas} />}
      <EditorContent editor={editor} className="editor-content-wrapper" />
    </div>
  );
};

export { RichTextEditor };
export default RichTextEditor;
