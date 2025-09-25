import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  FileText
} from 'lucide-react';
import { Fichier } from '../types';
import PDFViewer from './PDFViewer';

interface FileViewerPanelProps {
  file: Fichier | null;
  files: Fichier[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isOpen: boolean;
}

const FileViewerPanel: React.FC<FileViewerPanelProps> = ({
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
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen && file?.type?.startsWith('image/')) {
      loadImage();
    } else {
      setImageData(null);
    }
    setZoom(1); // Reset zoom when file changes
  }, [file, isOpen]);

  const loadImage = async () => {
    if (!file) return;
    
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

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < files.length - 1;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));

  if (!isOpen || !file) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun fichier sélectionné
          </h3>
          <p className="text-gray-600">
            Cliquez sur un fichier dans la sidebar pour le visualiser
          </p>
        </div>
      </div>
    );
  }

  const getFileContent = () => {
    if (file.type?.startsWith('image/')) {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de l'image...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 font-bold text-lg">!</span>
              </div>
              <p className="text-gray-600">{file.name}</p>
              <p className="text-sm text-red-500 mt-2">{error}</p>
            </div>
          </div>
        );
      }

      if (imageData) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 overflow-auto">
            <img
              src={imageData}
              alt={file.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                maxHeight: 'calc(100vh - 200px)'
              }}
            />
          </div>
        );
      }
    }

    if (file.type === 'application/pdf') {
      return <PDFViewer file={file} onDownload={() => {/* TODO: Implement download */}} />;
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
    <div className="flex-1 flex flex-col bg-white" style={{ height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
            {file.name}
          </h2>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {currentIndex + 1} sur {files.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Contrôles pour les images */}
          {file.type?.startsWith('image/') && (
            <>
              <button 
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoom(1)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Zoom normal"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}
          
          <button 
            onClick={() => {/* TODO: Implement download */}}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 relative" style={{ height: '0', overflow: 'hidden' }}>
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
  );
};

export default FileViewerPanel;
