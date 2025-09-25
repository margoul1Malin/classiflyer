import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Trash2, Plus } from 'lucide-react';
import { Dossier, Fichier } from '../types';

interface FolderTreeNodeProps {
  folder: Dossier;
  classeurId: number;
  selectedFile: Fichier | null;
  onFileClick: (file: Fichier) => void;
  onDeleteFolder: (folder: Dossier) => void;
  onDeleteFile: (file: Fichier) => void;
  onUploadToFolder: (folder: Dossier) => void;
  level?: number;
}

const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  folder,
  classeurId,
  selectedFile,
  onFileClick,
  onDeleteFolder,
  onDeleteFile,
  onUploadToFolder,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subFolders, setSubFolders] = useState<Dossier[]>([]);
  const [files, setFiles] = useState<Fichier[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFolderContent = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setLoading(true);
    try {
      // Charger les sous-dossiers
      const dossiers = await window.electronAPI.getDossiersByClasseur(classeurId, folder.id);
      setSubFolders(dossiers);

      // Charger les fichiers
      const fichiers = await window.electronAPI.getFichiersByDossier(folder.id);
      setFiles(fichiers);

      setIsExpanded(true);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu du dossier:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: Fichier) => {
    if (file.type?.startsWith('image/')) {
      return <File className="w-4 h-4 text-green-600" />;
    }
    if (file.type === 'application/pdf') {
      return <File className="w-4 h-4 text-red-600" />;
    }
    return <File className="w-4 h-4 text-gray-600" />;
  };

  const indentStyle = {
    paddingLeft: `${level * 16 + 12}px`
  };

  return (
    <div className="select-none">
      {/* Dossier principal */}
      <div className="group flex items-center w-full" style={indentStyle}>
        <button
          onClick={loadFolderContent}
          className="flex-1 flex items-center space-x-2 py-1 text-left hover:bg-gray-50 rounded transition-colors"
          disabled={loading}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          ) : isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
          <Folder className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-900 truncate">{folder.name}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUploadToFolder(folder);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all duration-200 mr-1"
          title="Uploader dans ce dossier"
        >
          <Plus className="w-3 h-3 text-blue-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFolder(folder);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200 mr-2"
          title="Supprimer le dossier"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>

      {/* Contenu déroulé */}
      {isExpanded && (
        <div className="space-y-1">
          {/* Sous-dossiers */}
          {subFolders.map((subFolder) => (
            <FolderTreeNode
              key={subFolder.id}
              folder={subFolder}
              classeurId={classeurId}
              selectedFile={selectedFile}
              onFileClick={onFileClick}
              onDeleteFolder={onDeleteFolder}
              onDeleteFile={onDeleteFile}
              onUploadToFolder={onUploadToFolder}
              level={level + 1}
            />
          ))}

          {/* Fichiers */}
          {files.map((file) => {
            const isSelected = selectedFile?.id === file.id;
            return (
              <div
                key={file.id}
                className="group flex items-center w-full"
                style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
              >
                <button
                  onClick={() => onFileClick(file)}
                  className={`flex-1 flex items-center space-x-2 py-1 text-left rounded transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-3 h-3" /> {/* Espace pour l'alignement */}
                  {getFileIcon(file)}
                  <span className="text-sm truncate">{file.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200 mr-2"
                  title="Supprimer le fichier"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            );
          })}

          {/* Message vide si pas de contenu */}
          {subFolders.length === 0 && files.length === 0 && (
            <div 
              className="text-xs text-gray-400 py-2"
              style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
            >
              Dossier vide
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderTreeNode;
