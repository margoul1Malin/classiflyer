import React, { useRef, useEffect, useState } from 'react';
import { Edit3, Archive, Trash2, RotateCcw } from 'lucide-react';
import { Classeur } from '../types';

interface ArchivedClasseurContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  classeur: Classeur;
  onEdit: (classeur: Classeur) => void;
  onUnarchive: (classeur: Classeur) => void;
  onDelete: (classeur: Classeur) => void;
}

const ArchivedClasseurContextMenu: React.FC<ArchivedClasseurContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  classeur,
  onEdit,
  onUnarchive,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEdit = () => {
    onEdit(classeur);
    onClose();
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await onUnarchive(classeur);
      onClose();
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer "${classeur.name}" vers la corbeille ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(classeur);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <button
          onClick={handleEdit}
          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Modifier</span>
        </button>

        <button
          onClick={handleUnarchive}
          disabled={isUnarchiving}
          className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 flex items-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isUnarchiving ? 'Désarchivage...' : 'Désarchiver'}</span>
        </button>

        <div className="border-t border-gray-100 my-1" />

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isDeleting ? 'Suppression...' : 'Envoyer vers la Corbeille'}</span>
        </button>
      </div>
    </>
  );
};

export default ArchivedClasseurContextMenu;
