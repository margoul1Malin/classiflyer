import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { ArchiveFolder } from '../types';

interface ArchiveFolderTreeProps {
  onFolderSelect: (folder: ArchiveFolder) => void;
  selectedFolderId?: number;
}

interface FolderNode extends ArchiveFolder {
  children: FolderNode[];
  isExpanded: boolean;
}

const ArchiveFolderTree: React.FC<ArchiveFolderTreeProps> = ({ 
  onFolderSelect, 
  selectedFolderId 
}) => {
  const [folders, setFolders] = useState<ArchiveFolder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchiveFolders();
  }, []);

  const loadArchiveFolders = async () => {
    try {
      const archiveFolders = await window.electronAPI.getArchiveFolders();
      setFolders(archiveFolders);
      buildFolderTree(archiveFolders);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers d\'archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folders: ArchiveFolder[]) => {
    // Créer un map pour un accès rapide
    const folderMap = new Map<number, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Créer tous les nœuds
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        isExpanded: false
      });
    });

    // Construire l'arbre
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      
      // Pour l'instant, on considère que tous les dossiers sont à la racine
      // Plus tard, on pourra ajouter un champ parentId si nécessaire
      rootFolders.push(node);
    });

    setFolderTree(rootFolders);
  };

  const toggleExpanded = (folderId: number) => {
    setFolderTree(prev => 
      prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const renderFolderNode = (folder: FolderNode, depth: number = 0) => {
    const isSelected = selectedFolderId === folder.id;
    
    return (
      <div key={folder.id}>
        <div
          className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder)}
        >
          {folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {folder.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          {folder.children.length === 0 && <div className="w-4" />}
          
          {isSelected ? (
            <FolderOpen className="w-4 h-4 text-blue-600" />
          ) : (
            <Folder className="w-4 h-4 text-gray-500" />
          )}
          
          <span className="text-sm font-medium truncate">
            {folder.name}
          </span>
        </div>
        
        {folder.isExpanded && folder.children.map(child => 
          renderFolderNode(child, depth + 1)
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-4 text-center">
        <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Aucun dossier d'archive</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {folderTree.map(folder => renderFolderNode(folder))}
    </div>
  );
};

export default ArchiveFolderTree;
