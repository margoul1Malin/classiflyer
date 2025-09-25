import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Grid, List } from 'lucide-react';
import { Classeur, Dossier, Fichier } from '../types';
import ClasseurSidebarTree from '../components/ClasseurSidebarTree';
import FileViewerPanel from '../components/FileViewerPanel';
import ClasseurActions from '../components/ClasseurActions';
import CreateFolderModal from '../components/CreateFolderModal';
import UploadModal from '../components/UploadModal';

const ClasseurView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [classeur, setClasseur] = useState<Classeur | null>(null);
  const [folders, setFolders] = useState<Dossier[]>([]);
  const [files, setFiles] = useState<Fichier[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // État pour la visualisation de fichiers
  const [selectedFile, setSelectedFile] = useState<Fichier | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [targetFolder, setTargetFolder] = useState<Dossier | null>(null);

  useEffect(() => {
    if (id) {
      loadClasseurData(parseInt(id));
    }
  }, [id]);

  const loadClasseurData = async (classeurId: number) => {
    setLoading(true);
    try {
      const fetchedClasseur = await window.electronAPI.getClasseur(classeurId);
      setClasseur(fetchedClasseur);
      await loadFolderContent(null);
    } catch (error) {
      console.error('Erreur lors du chargement du classeur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContent = async (folderId: number | null) => {
    try {
      if (id) {
        const classeurId = parseInt(id);
        
        // Charger les dossiers
        const dossiers = await window.electronAPI.getDossiersByClasseur(classeurId, folderId);
        setFolders(dossiers);
        
        // Charger les fichiers
        if (folderId) {
          const fichiers = await window.electronAPI.getFichiersByDossier(folderId);
          setFiles(fichiers);
        } else {
          const fichiers = await window.electronAPI.getFichiersByClasseur(classeurId);
          setFiles(fichiers);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    }
  };


  const handleFileClick = (file: Fichier) => {
    setSelectedFile(file);
    setCurrentFileIndex(filteredFiles.indexOf(file));
  };

  const handlePreviousFile = () => {
    if (currentFileIndex > 0) {
      const newIndex = currentFileIndex - 1;
      setCurrentFileIndex(newIndex);
      setSelectedFile(filteredFiles[newIndex]);
    }
  };

  const handleNextFile = () => {
    if (currentFileIndex < filteredFiles.length - 1) {
      const newIndex = currentFileIndex + 1;
      setCurrentFileIndex(newIndex);
      setSelectedFile(filteredFiles[newIndex]);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      if (id && classeur) {
        const classeurId = parseInt(id);
        
        await window.electronAPI.createDossier({
          classeurId,
          name,
          path: '', // Le chemin sera généré automatiquement
          parentId: null
        });
        
        await loadFolderContent(null);
      }
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    }
  };

  const handleUploadFiles = async (files: File[], destinationPath: string) => {
    try {
      if (!classeur) {
        throw new Error('Classeur introuvable');
      }
      
      for (const file of files) {
        // Convertir le fichier en base64
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Enlever le préfixe "data:image/jpeg;base64," par exemple
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Déterminer le chemin de destination
        // Construire le chemin de destination
        const finalDestinationPath = targetFolder 
          ? `${targetFolder.path}/${file.name}`
          : `All_Classeurs/${classeur.name}/${file.name}`;

        // Uploader le fichier physique
        const uploadResult = await window.electronAPI.uploadFile({
          name: file.name,
          data: fileData,
          type: file.type,
          size: file.size
        }, finalDestinationPath);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Erreur lors de l\'upload');
        }

        // Créer l'enregistrement dans la base de données
        if (targetFolder) {
          await window.electronAPI.createFichier({
            dossierId: targetFolder.id,
            name: file.name,
            path: uploadResult.path, // Utiliser le chemin relatif retourné par uploadFile
            type: file.type,
            size: uploadResult.size || file.size
          });
        } else {
          await window.electronAPI.createFichier({
            classeurId: classeur.id,
            name: file.name,
            path: uploadResult.path, // Utiliser le chemin relatif retourné par uploadFile
            type: file.type,
            size: uploadResult.size || file.size
          });
        }
      }
      
      await loadFolderContent(null);
      setTargetFolder(null); // Réinitialiser le dossier cible
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert(`Erreur lors de l'upload: ${error.message}`);
    }
  };

  const handleDeleteFolder = async (folder: Dossier) => {
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer le dossier "${folder.name}" vers la corbeille ?`)) {
      try {
        await window.electronAPI.deleteDossier(folder.id);
        await loadFolderContent(null);
      } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
      }
    }
  };

  const handleDeleteFile = async (file: Fichier) => {
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer le fichier "${file.name}" vers la corbeille ?`)) {
      try {
        await window.electronAPI.deleteFichier(file.id);
        await loadFolderContent(null);
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
      }
    }
  };

  const handleUploadToFolder = (folder: Dossier) => {
    // Ouvrir le modal d'upload avec le dossier cible
    setShowUpload(true);
    // Stocker le dossier cible pour l'upload
    setTargetFolder(folder);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du classeur...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!classeur) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-600">Classeur introuvable.</p>
      </div>
    );
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Sidebar avec système d'arbre */}
      <ClasseurSidebarTree
        folders={filteredFolders}
        files={filteredFiles}
        classeurId={classeur.id}
        classeurName={classeur.name}
        selectedFile={selectedFile}
        onFileClick={handleFileClick}
        onDeleteFolder={handleDeleteFolder}
        onDeleteFile={handleDeleteFile}
        onUploadToFolder={handleUploadToFolder}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: classeur.primaryColor }}
                />
                <h1 className="text-xl font-bold text-gray-900">{classeur.name}</h1>
              </div>
            </div>

            <ClasseurActions
              onUpload={() => setShowUpload(true)}
              onCreateFolder={() => setShowCreateFolder(true)}
            />
          </div>
        </div>

        {/* Barre de recherche et contrôles */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans ce classeur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full"
              />
            </div>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Vue grille"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Vue liste"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Zone de contenu principal - maintenant avec le panneau de visualisation */}
        <FileViewerPanel
          file={selectedFile}
          files={filteredFiles}
          currentIndex={currentFileIndex}
          onClose={() => setSelectedFile(null)}
          onPrevious={handlePreviousFile}
          onNext={handleNextFile}
          isOpen={true}
        />
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={handleCreateFolder}
        parentPath={classeur?.path || '/classeurs'}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => {
          setShowUpload(false);
          setTargetFolder(null);
        }}
        onUpload={handleUploadFiles}
        destinationPath={targetFolder?.path || classeur?.path || '/classeurs'}
      />
    </div>
  );
};

export default ClasseurView;