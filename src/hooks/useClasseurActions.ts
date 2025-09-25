import { useState } from 'react';
import { Classeur } from '../types';

export const useClasseurActions = (onRefresh?: () => void) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    classeur: Classeur | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    classeur: null,
  });

  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    classeur: Classeur | null;
  }>({
    isOpen: false,
    classeur: null,
  });

  const openContextMenu = (event: React.MouseEvent, classeur: Classeur) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width - 200, // Position à gauche du bouton
      y: rect.bottom + 5, // Juste en dessous du bouton
    };

    setContextMenu({
      isOpen: true,
      position,
      classeur,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      classeur: null,
    });
  };

  const handleArchive = (classeur: Classeur) => {
    setArchiveModal({
      isOpen: true,
      classeur
    });
    closeContextMenu();
  };

  const handleArchiveConfirm = async (folderId: number | null, folderName: string) => {
    if (!archiveModal.classeur) return;

    try {
      const success = await window.electronAPI.archiveClasseur(
        archiveModal.classeur.id,
        folderName
      );

      if (success) {
        console.log(`Classeur archivé avec succès: ${archiveModal.classeur.name} → ${folderName}`);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
    }

    setArchiveModal({
      isOpen: false,
      classeur: null
    });
  };

  const closeArchiveModal = () => {
    setArchiveModal({
      isOpen: false,
      classeur: null
    });
  };

  const handleDelete = async (classeur: Classeur) => {
    try {
      const success = await window.electronAPI.deleteClasseur(classeur.id);
      
      if (success) {
        console.log('Classeur supprimé avec succès:', classeur.name);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return {
    contextMenu,
    archiveModal,
    openContextMenu,
    closeContextMenu,
    handleArchive,
    handleArchiveConfirm,
    closeArchiveModal,
    handleDelete,
  };
};
