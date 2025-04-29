import React, { useState, useRef, useEffect } from 'react';
import { Entry } from '../types/database';
import { TYPE_TO_SYMBOL } from '../constants/prefixes';
import { EntryService } from '../services/entryService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface EntryCardProps {
  entry: Entry;
  onDelete?: () => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);
  const [originalContent, setOriginalContent] = useState(entry.content);
  const [originalPrefixes, setOriginalPrefixes] = useState(entry.entry_prefixes);
  const [removedPrefixIds, setRemovedPrefixIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleDelete = async () => {
    try {
      await EntryService.deleteEntry(entry.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleEdit = () => {
    setOriginalContent(entry.content);
    setOriginalPrefixes(entry.entry_prefixes);
    setEditedContent(entry.content);
    setIsEditing(true);
  };

  const handlePrefixRemove = async (prefixId: string, prefixValue: string) => {
    try {
      // Remove the prefix from the content
      const prefixType = entry.entry_prefixes.find(p => p.prefix.id === prefixId)?.prefix.type;
      if (!prefixType) return;
      
      const prefixPattern = new RegExp(`\\[${TYPE_TO_SYMBOL[prefixType]}${prefixValue}\\]`, 'g');
      const newContent = editedContent.replace(prefixPattern, '');
      setEditedContent(newContent);

      // Update the entry's prefixes by removing the deleted one
      entry.entry_prefixes = entry.entry_prefixes.filter(ep => ep.prefix.id !== prefixId);
      
      // Track the removed prefix ID
      setRemovedPrefixIds(prev => [...prev, prefixId]);
    } catch (error) {
      console.error('Failed to remove prefix:', error);
    }
  };

  const handleSave = async () => {
    try {
      await EntryService.updateEntry(entry.id, editedContent, removedPrefixIds);
      setIsEditing(false);
      setRemovedPrefixIds([]);
      onDelete?.(); // Refresh the list
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    entry.entry_prefixes = originalPrefixes;
    setRemovedPrefixIds([]);
    setIsEditing(false);
  };

  return (
    <>
      <div className="bg-black/50 backdrop-blur-sm rounded-xl border border-gray-800 p-3 mb-3 group">
        <div className="flex justify-between items-start mb-2">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="text-gray-100 font-mono text-sm whitespace-pre-wrap flex-1 bg-transparent resize-none focus:outline-none"
              rows={3}
            />
          ) : (
            <div className="text-gray-100 font-mono text-sm whitespace-pre-wrap flex-1">{entry.content}</div>
          )}
          <div className="flex gap-2 ml-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-green-400 hover:text-green-300 transition-colors p-1"
                  title="Save changes"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                  title="Cancel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                  title="Edit entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                  title="Delete entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
        {entry.entry_prefixes && entry.entry_prefixes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {entry.entry_prefixes.map(({ prefix }) => (
              <span 
                key={prefix.id} 
                className="px-1.5 py-0.5 bg-gray-800 text-gray-50 rounded text-xs border border-gray-700 flex items-center gap-1"
              >
                {TYPE_TO_SYMBOL[prefix.type]} {prefix.value}
                {isEditing && (
                  <button
                    onClick={() => handlePrefixRemove(prefix.id, prefix.value)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="text-gray-400 text-xs font-mono">
          <span>
            {new Date(entry.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDelete();
        }}
      />
    </>
  );
} 