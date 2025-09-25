import { useState, useCallback } from 'react';

export interface DragItem {
  id: number;
  type: 'classeur' | 'fichier' | 'dossier';
  name: string;
  data: any;
}

export interface DropTarget {
  id: number;
  type: 'dossier' | 'archive-folder';
  name: string;
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    setDropTarget(target);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Ne pas réinitialiser si on survole un enfant
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    try {
      // TODO: Implémenter la logique de déplacement selon le type
      if (draggedItem.type === 'classeur') {
        if (target.type === 'archive-folder') {
          // Archiver le classeur
          console.log(`Archivage du classeur "${draggedItem.name}" vers "${target.name}"`);
          // await window.electronAPI.archiveClasseur(draggedItem.id, target.name);
        } else if (target.type === 'dossier') {
          // Déplacer le classeur vers un dossier
          console.log(`Déplacement du classeur "${draggedItem.name}" vers "${target.name}"`);
          // await window.electronAPI.moveClasseurToFolder(draggedItem.id, target.id);
        }
      } else if (draggedItem.type === 'fichier') {
        // Déplacer le fichier
        console.log(`Déplacement du fichier "${draggedItem.name}" vers "${target.name}"`);
        // await window.electronAPI.moveFile(draggedItem.id, target.id);
      }
      
      console.log(`Déplacement réussi: ${draggedItem.name} → ${target.name}`);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
    } finally {
      setDraggedItem(null);
      setDropTarget(null);
    }
  }, [draggedItem]);

  const getDropZoneStyles = useCallback((target: DropTarget) => {
    if (dropTarget?.id === target.id) {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '2px dashed #3B82F6',
        transform: 'scale(1.02)',
      };
    }
    return {};
  }, [dropTarget]);

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    getDropZoneStyles,
  };
};
