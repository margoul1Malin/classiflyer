import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Maximize2
} from 'lucide-react';
import { Fichier } from '../types';

interface FileViewerProps {
  file: Fichier;
  files: Fichier[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isOpen: boolean;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  files,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  isOpen
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file?.type?.startsWith('image/')) {
      loadImage();
    } else {
      setImageData(null);
    }
  }, [file, isOpen]);

  const loadImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.serveFile(file.path);
      if (result) {
        setImageData(`data:${result.mimeType};base64,${result.data}`);
      } else {
        setError('Impossible de charger l\'image');
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'image');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < files.length - 1;

  const getFileContent = () => {
    if (file.type?.startsWith('image/')) {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de l'image...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 font-bold text-lg">!</span>
              </div>
              <p className="text-gray-600">{file.name}</p>
              <p className="text-sm text-red-500 mt-2">{error}</p>
              <p className="text-sm text-gray-500">
                Chemin: {file.path}
              </p>
            </div>
          </div>
        );
      }

      if (imageData) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <img
              src={imageData}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            />
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-600 font-bold text-lg">IMG</span>
            </div>
            <p className="text-gray-600">{file.name}</p>
            <p className="text-sm text-gray-500 mt-2">
              Aucune donnée d'image disponible
            </p>
          </div>
        </div>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 font-bold text-lg">PDF</span>
            </div>
            <p className="text-gray-600">{file.name}</p>
            <p className="text-sm text-gray-500 mt-2">
              PDF Viewer non implémenté
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-600 font-bold text-lg">?</span>
          </div>
          <p className="text-gray-600">{file.name}</p>
          <p className="text-sm text-gray-500 mt-2">
            Type de fichier non supporté
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {file.name}
            </h2>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} sur {files.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Contrôles */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RotateCw className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 relative">
          {getFileContent()}
          
          {/* Navigation */}
          {files.length > 1 && (
            <>
              {/* Bouton précédent */}
              <button
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-colors ${
                  canGoPrevious
                    ? 'bg-white hover:bg-gray-50 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Bouton suivant */}
              <button
                onClick={onNext}
                disabled={!canGoNext}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-colors ${
                  canGoNext
                    ? 'bg-white hover:bg-gray-50 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer avec informations */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Taille:</span> {Math.round(file.size / 1024)} KB
            </div>
            <div>
              <span className="font-medium">Type:</span> {file.type}
            </div>
            <div>
              <span className="font-medium">Créé:</span> {new Date(file.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;