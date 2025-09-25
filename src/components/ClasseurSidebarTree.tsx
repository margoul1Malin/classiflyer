import React from 'react';
import { Folder, File, Trash2 } from 'lucide-react';
import { Dossier, Fichier } from '../types';
import FolderTreeNode from './FolderTreeNode';

interface ClasseurSidebarTreeProps {
  folders: Dossier[];
  files: Fichier[];
  classeurId: number;
  classeurName: string;
  selectedFile: Fichier | null;
  onFileClick: (file: Fichier) => void;
  onDeleteFolder: (folder: Dossier) => void;
  onDeleteFile: (file: Fichier) => void;
  onUploadToFolder: (folder: Dossier) => void;
}

const ClasseurSidebarTree: React.FC<ClasseurSidebarTreeProps> = ({
  folders,
  files,
  classeurId,
  classeurName,
  selectedFile,
  onFileClick,
  onDeleteFolder,
  onDeleteFile,
  onUploadToFolder
}) => {
  const getFileIcon = (file: Fichier) => {
    if (file.type?.startsWith('image/')) {
      return <File className="w-4 h-4 text-green-600" />;
    }
    if (file.type === 'application/pdf') {
      return <File className="w-4 h-4 text-red-600" />;
    }
    return <File className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{classeurName}</h2>
        <p className="text-sm text-gray-500">
          Structure des dossiers
        </p>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Dossiers racines avec système d'arbre */}
        {folders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Folder className="w-4 h-4 mr-2" />
              Dossiers
            </h3>
            <div className="space-y-1">
              {folders.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  classeurId={classeurId}
                  selectedFile={selectedFile}
                  onFileClick={onFileClick}
                  onDeleteFolder={onDeleteFolder}
                  onDeleteFile={onDeleteFile}
                  onUploadToFolder={onUploadToFolder}
                  level={0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fichiers à la racine */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <File className="w-4 h-4 mr-2" />
              Fichiers racine
            </h3>
            <div className="space-y-1">
              {files.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    className="group flex items-center w-full"
                  >
                    <button
                      onClick={() => onFileClick(file)}
                      className={`flex-1 flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {getFileIcon(file)}
                      <span className="text-sm truncate">{file.name}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                      title="Supprimer le fichier"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message vide */}
        {folders.length === 0 && files.length === 0 && (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Ce classeur est vide</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClasseurSidebarTree;
