import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { Dossier, Fichier } from '../types';

interface ClasseurSidebarProps {
  folders: Dossier[];
  files: Fichier[];
  currentFolder: Dossier | null;
  currentPath: Dossier[];
  onFolderClick: (folder: Dossier) => void;
  onFileClick: (file: Fichier) => void;
  onBreadcrumbClick: (index: number) => void;
  onDeleteFolder: (folder: Dossier) => void;
  onDeleteFile: (file: Fichier) => void;
  classeurName: string;
}

const ClasseurSidebar: React.FC<ClasseurSidebarProps> = ({
  folders,
  files,
  currentFolder,
  currentPath,
  onFolderClick,
  onFileClick,
  onBreadcrumbClick,
  onDeleteFolder,
  onDeleteFile,
  classeurName
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
          {folders.length} dossier{folders.length !== 1 ? 's' : ''}, {files.length} fichier{files.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-1 text-sm">
          <button
            onClick={() => onBreadcrumbClick(-1)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {classeurName}
          </button>
          {currentPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={() => onBreadcrumbClick(index)}
                className="text-blue-600 hover:text-blue-800 font-medium truncate"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Dossiers */}
        {folders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Folder className="w-4 h-4 mr-2" />
              Dossiers
            </h3>
            <div className="space-y-1">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group flex items-center w-full"
                >
                  <button
                    onClick={() => onFolderClick(folder)}
                    className="flex-1 flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-900 truncate">{folder.name}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                    title="Supprimer le dossier"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fichiers */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <File className="w-4 h-4 mr-2" />
              Fichiers
            </h3>
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center w-full"
                >
                  <button
                    onClick={() => onFileClick(file)}
                    className="flex-1 flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {getFileIcon(file)}
                    <span className="text-sm text-gray-900 truncate">{file.name}</span>
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
              ))}
            </div>
          </div>
        )}

        {/* Message vide */}
        {folders.length === 0 && files.length === 0 && (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Ce dossier est vide</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClasseurSidebar;
