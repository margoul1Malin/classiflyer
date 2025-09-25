import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, File, Archive, Eye, Download, Plus, Upload, FolderPlus, MoreVertical, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArchiveFolder, Classeur, Fichier } from '../types';
import FileViewerPanel from '../components/FileViewerPanel';
import CreateClasseurModal from '../components/CreateClasseurModal';
import { useClasseurActions } from '../hooks/useClasseurActions';
import ArchivedClasseurContextMenu from '../components/ArchivedClasseurContextMenu';
import EditClasseurModal from '../components/EditClasseurModal';
import ArchiveSelectionModal from '../components/ArchiveSelectionModal';

const ArchiveFolderContent: React.FC = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const [folder, setFolder] = useState<ArchiveFolder | null>(null);
  const [classeurs, setClasseurs] = useState<Classeur[]>([]);
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [sousDossiers, setSousDossiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<Fichier | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showCreateClasseur, setShowCreateClasseur] = useState(false);
  const [showCreateSubFolder, setShowCreateSubFolder] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<Array<{id: number, name: string}>>([]);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClasseur, setEditingClasseur] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    contextMenu,
    openContextMenu,
    closeContextMenu,
    handleDelete
  } = useClasseurActions(() => loadFolderContent(parseInt(folderId || '0')));

  useEffect(() => {
    if (folderId) {
      loadFolderContent(parseInt(folderId));
    }
  }, [folderId]);

  const loadFolderContent = async (id: number) => {
    try {
      setLoading(true);
      
      // Charger les informations du dossier
      const archiveFolders = await window.electronAPI.getArchiveFolders();
      let currentFolder = archiveFolders.find(f => f.id === id);
      
      // Si ce n'est pas un dossier d'archive principal, chercher dans tous les dossiers
      if (!currentFolder) {
        const allDossiers = await window.electronAPI.getAllDossiers();
        const subDossier = allDossiers.find(d => d.id === id);
        
        if (subDossier) {
          // C'est un sous-dossier, créer un objet temporaire pour l'affichage
          currentFolder = {
            id: subDossier.id,
            name: subDossier.name,
            path: subDossier.path,
            createdAt: subDossier.createdAt
          };
        } else {
          console.error('Dossier introuvable avec ID:', id);
          navigate('/archives');
          return;
        }
      }
      
      setFolder(currentFolder);
      
      // Construire le breadcrumb
      await buildBreadcrumb(id);
      
      // Charger les classeurs de ce dossier (seulement pour les dossiers d'archives principaux)
      if (archiveFolders.find(f => f.id === id)) {
        const allArchivedClasseurs = await window.electronAPI.getArchivedClasseurs();
        const folderClasseurs = allArchivedClasseurs.filter(
          c => c.archiveFolder === currentFolder.name
        );
        setClasseurs(folderClasseurs);
      } else {
        // C'est un sous-dossier, pas de classeurs archivés
        setClasseurs([]);
      }
      
      // Charger les sous-dossiers de ce dossier (hiérarchie infinie)
      try {
        const subDossiers = await window.electronAPI.getSubDossiers(id);
        setSousDossiers(subDossiers);
      } catch (error) {
        console.log('Aucun sous-dossier trouvé ou erreur:', error);
        setSousDossiers([]);
      }
      
      // Charger les fichiers du dossier
      try {
        const folderFiles = await window.electronAPI.getFichiersByDossier(id);
        setFichiers(folderFiles);
      } catch (error) {
        console.log('Aucun fichier trouvé ou erreur:', error);
        setFichiers([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement du contenu du dossier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: Fichier) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const buildBreadcrumb = async (currentFolderId: number) => {
    const archiveFolders = await window.electronAPI.getArchiveFolders();
    const allDossiers = await window.electronAPI.getAllDossiers();
    
    const breadcrumbPath: Array<{id: number, name: string}> = [];
    let currentId = currentFolderId;
    
    // Construire le chemin en remontant la hiérarchie
    while (currentId) {
      // Vérifier si c'est un dossier d'archive principal
      const archiveFolder = archiveFolders.find(f => f.id === currentId);
      if (archiveFolder) {
        breadcrumbPath.unshift({ id: archiveFolder.id, name: archiveFolder.name });
        break; // On a atteint la racine
      }
      
      // Vérifier si c'est un sous-dossier
      const dossier = allDossiers.find(d => d.id === currentId);
      if (dossier) {
        breadcrumbPath.unshift({ id: dossier.id, name: dossier.name });
        currentId = dossier.parentId || 0;
      } else {
        break;
      }
    }
    
    setBreadcrumb(breadcrumbPath);
  };

  const handleBackToArchives = async () => {
    if (!folder) {
      navigate('/archives');
      return;
    }

    // Si c'est un dossier d'archive principal, retourner aux archives
    const archiveFolders = await window.electronAPI.getArchiveFolders();
    const isArchiveFolder = archiveFolders.find(f => f.id === folder.id);
    
    if (isArchiveFolder) {
      navigate('/archives');
      return;
    }

    // Si c'est un sous-dossier, trouver le dossier parent
    const allDossiers = await window.electronAPI.getAllDossiers();
    const currentDossier = allDossiers.find(d => d.id === folder.id);
    
    if (currentDossier && currentDossier.parentId) {
      navigate(`/archive-folder/${currentDossier.parentId}`);
    } else {
      navigate('/archives');
    }
  };

  const handleEditClasseur = (classeur: any) => {
    setEditingClasseur(classeur);
    setIsEditing(true);
  };

  const handleUpdateClasseur = async (id: number, classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
  }) => {
    try {
      await window.electronAPI.updateClasseur(id, classeurData);
      await loadFolderContent(parseInt(folderId || '0'));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleUnarchive = async (classeur: any) => {
    try {
      await window.electronAPI.unarchiveClasseur(classeur.id);
      await loadFolderContent(parseInt(folderId || '0'));
    } catch (error) {
      console.error('Erreur lors du désarchivage:', error);
    }
  };

  const handleDeleteSubFolder = async (dossier: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer le dossier "${dossier.name}" vers la corbeille ?`)) {
      try {
        await window.electronAPI.deleteDossier(dossier.id);
        await loadFolderContent(parseInt(folderId || '0'));
        // Recharger la page pour mettre à jour les statistiques des cartes
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
      }
    }
  };

  const handleCreateSubFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !folder) return;

    try {
      const result = await window.electronAPI.createDossier({
        name: newFolderName.trim(),
        parentId: folder.id,
        classeurId: null,
        path: `${folder.path}/${newFolderName.trim()}`
      });

      if (result) {
        console.log('Sous-dossier créé:', result);
        setNewFolderName('');
        setShowCreateSubFolder(false);
        // Naviguer vers le nouveau dossier créé
        navigate(`/archive-folder/${result.id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création du sous-dossier:', error);
      alert('Erreur lors de la création du sous-dossier');
    }
  };

  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0 || !folder) return;

    try {
      for (const file of uploadedFiles) {
        // Convertir le fichier en base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64Data = fileData.split(',')[1];

        // Uploader le fichier physiquement - utiliser le chemin relatif pour la DB
        const relativePath = `Archives/${folder.name}/${file.name}`;
        
        const uploadResult = await window.electronAPI.uploadFile({
          fileName: file.name,
          fileData: base64Data,
          filePath: relativePath
        });

        if (uploadResult) {
          // Créer l'entrée dans la base de données avec le chemin relatif
          await window.electronAPI.createFichier({
            name: file.name,
            type: file.type,
            size: file.size,
            path: relativePath,
            classeurId: null,
            dossierId: folder.id
          });
        }
      }

      console.log('Fichiers uploadés:', uploadedFiles.length);
      setUploadedFiles([]);
      setShowUploadFile(false);
      // Recharger le contenu du dossier
      await loadFolderContent(parseInt(folderId || '0'));
      // Recharger la page pour mettre à jour les statistiques des cartes
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      alert('Erreur lors de l\'upload des fichiers');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const DossierCard: React.FC<{ dossier: any }> = ({ dossier }) => {
    const [showActions, setShowActions] = useState(false);
    const [stats, setStats] = useState<{ files: number; folders: number }>({ files: 0, folders: 0 });

    useEffect(() => {
      const loadStats = async () => {
        try {
          // Charger les sous-dossiers
          const subDossiers = await window.electronAPI.getSubDossiers(dossier.id);
          
          // Charger les fichiers
          const fichiers = await window.electronAPI.getFichiersByDossier(dossier.id);
          
          setStats({
            files: fichiers.length,
            folders: subDossiers.length
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      };
      
      loadStats();
    }, [dossier.id]);

    return (
      <div
        className="relative rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden bg-white"
        onClick={() => navigate(`/archive-folder/${dossier.id}`)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Barre de marqueur - couleur par défaut */}
        <div
          className="absolute top-0 bottom-0 w-1 right-0 z-10"
          style={{ backgroundColor: '#3b82f6' }}
        />
        
        {/* Bouton de suppression */}
        {showActions && (
          <button
            className="absolute top-2 left-2 z-20 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSubFolder(dossier);
            }}
            title="Supprimer le dossier"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
        
        {/* Carte du dossier avec design responsive */}
        <div 
          className="h-80 sm:h-96 w-full relative p-4 sm:p-6 flex flex-col justify-between bg-white"
          style={{ 
            width: '280px',
            flexShrink: 0
          }}
        >
          {/* Contenu de la carte */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg leading-tight pr-2">
                {dossier.name}
              </h3>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <div className="text-gray-600 text-xs sm:text-sm">
              Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center space-x-2 text-gray-600 text-xs sm:text-sm">
              <span>{stats.files} fichier{stats.files > 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{stats.folders} dossier{stats.folders > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ClasseurCard: React.FC<{ classeur: Classeur; onMenuClick: (e: React.MouseEvent) => void }> = ({ classeur, onMenuClick }) => {
    const [showActions, setShowActions] = useState(false);
    const [stats, setStats] = useState<{ files: number; folders: number }>({ files: 0, folders: 0 });

    // Charger les statistiques du classeur
    useEffect(() => {
      const loadStats = async () => {
        try {
          // Récupérer les fichiers et dossiers du classeur
          const fichiers = await window.electronAPI.getFichiersByClasseur(classeur.id);
          const dossiers = await window.electronAPI.getDossiersByClasseur(classeur.id);
          
          setStats({
            files: fichiers.length,
            folders: dossiers.length
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      };
      loadStats();
    }, [classeur.id]);

    return (
      <div
        className="relative rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
        style={{ backgroundColor: classeur.primaryColor }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={() => navigate(`/classeur/${classeur.id}`)}
      >
        {/* Barre de marqueur - complètement à droite du conteneur */}
        <div
          className="absolute top-0 bottom-0 w-1 right-0 z-10"
          style={{ backgroundColor: classeur.secondaryColor }}
        />
        
        {/* Carte du classeur avec design personnalisé et responsive */}
        <div 
          className="h-80 sm:h-96 w-full relative p-4 sm:p-6 flex flex-col justify-between"
          style={{ 
            backgroundColor: classeur.primaryColor,
            width: '280px',
            flexShrink: 0
          }}
        >
          {/* Contenu de la carte */}
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold text-base sm:text-lg leading-tight pr-2">
              {classeur.name}
            </h3>
            {showActions && (
              <div className="flex items-center space-x-1">
                <button
                  className="text-white/80 hover:text-white p-1 rounded flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/classeur/${classeur.id}`);
                  }}
                  title="Ouvrir le classeur"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="text-white/80 hover:text-white p-1 rounded flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick(e);
                  }}
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <div className="text-white/80 text-xs sm:text-sm">
              Archivé le {new Date(classeur.updatedAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center space-x-2 text-white/80 text-xs sm:text-sm">
              <span>{stats.files} fichier{stats.files > 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{stats.folders} dossier{stats.folders > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dossier introuvable</h3>
          <p className="text-gray-600 mb-6">Le dossier demandé n'existe pas</p>
          <button
            onClick={handleBackToArchives}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux archives</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {/* Ligne 1: Bouton retour + Titre principal */}
        <div className="flex items-center justify-between mb-3 sm:mb-0">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={handleBackToArchives}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {folder.name}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base truncate">
                  {classeurs.length} classeur{classeurs.length > 1 ? 's' : ''} • {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} • {sousDossiers.length} sous-dossier{sousDossiers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne 2: Breadcrumb (sur mobile) ou Breadcrumb + Actions (sur desktop) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Breadcrumb */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 min-w-0">
              <span className="flex-shrink-0">Chemin:</span>
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 overflow-x-auto">
                {breadcrumb.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {index > 0 && <span>/</span>}
                    <button
                      onClick={() => navigate(`/archive-folder/${item.id}`)}
                      className={`hover:text-blue-600 transition-colors truncate max-w-20 sm:max-w-32 ${
                        index === breadcrumb.length - 1 ? 'font-semibold text-gray-900' : ''
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreateClasseur(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Créer un classeur</span>
              <span className="sm:hidden">Classeur</span>
            </button>
            
            <button
              onClick={() => setShowCreateSubFolder(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
            >
              <FolderPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sous-dossier</span>
              <span className="sm:hidden">Dossier</span>
            </button>
            
            <button
              onClick={() => setShowUploadFile(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Upload fichier</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Sous-dossiers */}
        {sousDossiers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Sous-dossiers ({sousDossiers.length})
            </h2>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {sousDossiers.map((dossier) => (
                <DossierCard key={dossier.id} dossier={dossier} />
              ))}
            </div>
          </div>
        )}

        {/* Classeurs */}
        {classeurs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Archive className="w-5 h-5 mr-2" />
              Classeurs ({classeurs.length})
            </h2>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {classeurs.map((classeur) => (
                <ClasseurCard 
                  key={classeur.id} 
                  classeur={classeur} 
                  onMenuClick={(e) => openContextMenu(e, classeur)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fichiers */}
        {fichiers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <File className="w-5 h-5 mr-2" />
              Fichiers ({fichiers.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fichiers.map((fichier) => (
                <div
                  key={fichier.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleFileClick(fichier)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {fichier.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {(fichier.size / 1024 / 1024).toFixed(2)} MB • {fichier.type}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick(fichier);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Prévisualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {classeurs.length === 0 && fichiers.length === 0 && (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Dossier vide
            </h3>
            <p className="text-gray-600">
              Ce dossier d'archive ne contient aucun classeur ou fichier
            </p>
          </div>
        )}
      </div>

      {/* Visionneuse de fichiers */}
      {selectedFile && showFileViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <FileViewerPanel
              file={selectedFile}
              files={fichiers}
              currentIndex={fichiers.findIndex(f => f.id === selectedFile.id)}
              isOpen={showFileViewer}
              onClose={() => {
                setShowFileViewer(false);
                setSelectedFile(null);
              }}
              onPrevious={() => {
                const currentIndex = fichiers.findIndex(f => f.id === selectedFile.id);
                if (currentIndex > 0) {
                  setSelectedFile(fichiers[currentIndex - 1]);
                }
              }}
              onNext={() => {
                const currentIndex = fichiers.findIndex(f => f.id === selectedFile.id);
                if (currentIndex < fichiers.length - 1) {
                  setSelectedFile(fichiers[currentIndex + 1]);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de création de classeur */}
      {showCreateClasseur && (
        <CreateClasseurModal
          isOpen={showCreateClasseur}
          onClose={() => setShowCreateClasseur(false)}
          onCreate={async (classeurData) => {
            // TODO: Créer le classeur dans ce dossier d'archive
            console.log('Création de classeur dans le dossier:', folder?.name, classeurData);
            setShowCreateClasseur(false);
            // Recharger le contenu du dossier
            if (folder) {
              loadFolderContent(folder.id);
            }
          }}
        />
      )}

      {/* Modal de création de sous-dossier */}
      {showCreateSubFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Créer un sous-dossier</h3>
            <form onSubmit={handleCreateSubFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du sous-dossier
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Documents 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSubFolder(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'upload de fichier */}
      {showUploadFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Uploader un fichier</h3>
            <form onSubmit={handleUploadFiles} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {uploadedFiles.length > 0 
                    ? `${uploadedFiles.length} fichier(s) sélectionné(s)`
                    : 'Sélectionnez des fichiers à uploader'
                  }
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept="*/*"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Sélectionner des fichiers
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadFile(false);
                    setUploadedFiles([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadedFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Uploader ({uploadedFiles.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      <EditClasseurModal
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingClasseur(null);
        }}
        onUpdate={handleUpdateClasseur}
        classeur={editingClasseur}
      />

      {/* Menu contextuel */}
      {contextMenu.classeur && (
        <ArchivedClasseurContextMenu
          isOpen={contextMenu.isOpen}
          onClose={closeContextMenu}
          position={contextMenu.position}
          classeur={contextMenu.classeur}
          onEdit={handleEditClasseur}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ArchiveFolderContent;
