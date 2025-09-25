import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  FileText
} from 'lucide-react';
import { Fichier } from '../types';

// Configuration de PDF.js worker - utiliser un CDN fiable
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: Fichier;
  onDownload?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onDownload }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [workerError, setWorkerError] = useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Mémoriser les options pour éviter les rechargements inutiles
  const pdfOptions = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  // Charger le PDF
  React.useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setWorkerError(false);
        
        console.log('Chargement PDF:', file.path, 'Type:', file.type);
        
        // Récupérer les données du PDF via l'API Electron
        const result = await window.electronAPI.serveFile(file.path);
        console.log('Résultat serveFile:', result);
        
        // Accepter les PDFs si le type MIME est correct ou si l'extension est .pdf
        if (result && result.data && (result.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
          setPdfData(`data:${result.mimeType || 'application/pdf'};base64,${result.data}`);
        } else {
          console.error('Type MIME reçu:', result?.mimeType, 'Données:', result?.data ? 'présentes' : 'absentes');
          setError(`Fichier PDF non trouvé ou corrompu (Type: ${result?.mimeType || 'inconnu'})`);
        }
      } catch (err) {
        setError('Erreur lors du chargement du PDF');
        console.error('Erreur PDF:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [file.path, file.name, file.type]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset à la première page
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Erreur de chargement PDF:', error);
    if (error.message.includes('worker') || error.message.includes('Worker')) {
      setWorkerError(true);
      setError('Erreur du worker PDF.js - Essayez de recharger la page');
    } else if (error.message.includes('Transport destroyed')) {
      // Ignorer les erreurs de transport détruit lors de la navigation
      console.warn('Transport détruit lors de la navigation, ignoré');
    } else {
      setError('Erreur lors du chargement du document PDF');
    }
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1.0);
    setRotation(0);
  };

  // Centrer le PDF après changement de page ou zoom
  const centerPDF = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // Centrer automatiquement après changement de page ou zoom
  React.useEffect(() => {
    const timer = setTimeout(centerPDF, 100);
    return () => clearTimeout(timer);
  }, [pageNumber, scale, rotation, centerPDF]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">{file.name}</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          {workerError && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recharger la page
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-600">Aucune donnée PDF disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Contrôles */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className={`p-2 rounded-lg transition-colors ${
                pageNumber <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
              {pageNumber} / {numPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className={`p-2 rounded-lg transition-colors ${
                pageNumber >= numPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <button
            onClick={handleRotate}
            className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors"
            title="Rotation (90°)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-white hover:bg-gray-50 rounded-lg transition-colors"
            title="Réinitialiser"
          >
            Reset
          </button>

          <div className="h-4 w-px bg-gray-300" />

          <button
            onClick={centerPDF}
            className="px-3 py-1 text-sm bg-white hover:bg-gray-50 rounded-lg transition-colors"
            title="Centrer le PDF"
          >
            Centrer
          </button>
        </div>

        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Zone de visualisation PDF */}
      <div ref={containerRef} className="flex-1 bg-gray-100 overflow-y-auto overflow-x-auto" style={{ height: '0', minHeight: '500px' }}>
        <div className="flex justify-center p-4" style={{ minHeight: '100%' }}>
          <Document
            key={`pdf-${file.id || file.name}`}
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={pdfOptions}
            loading={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement de la page...</span>
              </div>
            }
            error={
              <div className="text-center py-8">
                <p className="text-red-600">Erreur lors du chargement de la page</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vérifiez que le fichier PDF n'est pas corrompu
                </p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>

      {/* Footer avec informations */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Fichier:</span> {file.name}
          </div>
          <div>
            <span className="font-medium">Pages:</span> {numPages}
          </div>
          <div>
            <span className="font-medium">Taille:</span> {Math.round(file.size / 1024)} KB
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
