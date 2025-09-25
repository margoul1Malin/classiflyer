import React from 'react';
import { Upload, FolderPlus, MoreVertical } from 'lucide-react';

interface ClasseurActionsProps {
  onUpload: () => void;
  onCreateFolder: () => void;
  onShowMenu?: () => void;
}

const ClasseurActions: React.FC<ClasseurActionsProps> = ({
  onUpload,
  onCreateFolder,
  onShowMenu
}) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onUpload}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        <span>Upload</span>
      </button>

      <button
        onClick={onCreateFolder}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <FolderPlus className="w-4 h-4" />
        <span>Nouveau dossier</span>
      </button>

      {onShowMenu && (
        <button
          onClick={onShowMenu}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ClasseurActions;
