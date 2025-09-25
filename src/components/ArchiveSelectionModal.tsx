import React, { useState, useEffect } from 'react';
import { X, Folder, FolderOpen, Check, Plus } from 'lucide-react';
import { ArchiveFolder } from '../types';

interface ArchiveSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: number | null, folderName: string) => void;
  classeurName: string;
}

const ArchiveSelectionModal: React.FC<ArchiveSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  classeurName
}) => {
  const [archiveFolders, setArchiveFolders] = useState<ArchiveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadArchiveFolders();
    }
  }, [isOpen]);

  const loadArchiveFolders = async () => {
    try {
      setLoading(true);
      const folders = await window.electronAPI.getArchiveFolders();
      setArchiveFolders(folders);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await window.electronAPI.createArchiveFolder({
        name: newFolderName.trim(),
        path: `archives/${newFolderName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      });
      
      setArchiveFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    }
  };

  const handleFolderClick = (folder: ArchiveFolder) => {
    setSelectedFolder(folder.id);
  };

  const handleToggleExpand = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const folder = archiveFolders.find(f => f.id === selectedFolder);
    if (selectedFolder === null) {
      onSelect(null, 'Archives principales');
    } else if (folder) {
      onSelect(selectedFolder, folder.name);
    }
    onClose();
  };

  const buildFolderTree = (folders: ArchiveFolder[], parentId: number | null = null, level: number = 0) => {
    return folders
      .filter(folder => {
        // Pour simplifier, on considère que tous les dossiers sont au même niveau
        // Dans une vraie implémentation, on aurait un parentId dans ArchiveFolder
        return true;
      })
      .map(folder => (
        <div key={folder.id} className="ml-0">
          <div
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedFolder === folder.id
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => handleFolderClick(folder)}
          >
            <div className="flex items-center space-x-2 flex-1">
              <Folder className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{folder.name}</span>
            </div>
            
            {selectedFolder === folder.id && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>
      ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Archiver "{classeurName}"
            </h2>
            <p className="text-gray-600 mt-1">
              Sélectionnez le dossier d'archive de destination
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des dossiers...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Option Archives principales */}
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedFolder === null
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Archives principales</span>
                {selectedFolder === null && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>

              {/* Séparateur */}
              {archiveFolders.length > 0 && (
                <div className="border-t border-gray-200 my-3"></div>
              )}

              {/* Dossiers d'archives */}
              {archiveFolders.length > 0 ? (
                buildFolderTree(archiveFolders)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun dossier d'archive créé</p>
                  <p className="text-sm">Créez votre premier dossier d'archive</p>
                </div>
              )}

              {/* Bouton créer un dossier */}
              <div className="pt-4 border-t border-gray-200">
                {!showCreateFolder ? (
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer un nouveau dossier</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nom du dossier"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Créer
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateFolder(false);
                          setNewFolderName('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Archiver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveSelectionModal;
