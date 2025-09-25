import React, { useState, useEffect } from 'react';
import { Plus, Folder, Archive, Search, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useArchives } from '../hooks/useArchives';
import { useDragAndDrop, DragItem } from '../hooks/useDragAndDrop';
import { useClasseurActions } from '../hooks/useClasseurActions';
import ArchivedClasseurContextMenu from '../components/ArchivedClasseurContextMenu';
import EditClasseurModal from '../components/EditClasseurModal';
import ArchiveSelectionModal from '../components/ArchiveSelectionModal';

const ArchiveFolderCard: React.FC<{
  folder: any;
  onDelete: (folder: any) => void;
  onNavigate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  dropZoneStyles: any;
}> = ({ folder, onDelete, onNavigate, onDragOver, onDragLeave, onDrop, dropZoneStyles }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
      style={{
        width: '280px',
        flexShrink: 0,
        ...dropZoneStyles
      }}
      onClick={onNavigate}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Bouton de suppression */}
      {showActions && (
        <button
          className="absolute top-2 left-2 z-20 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder);
          }}
          title="Supprimer le dossier d'archive"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      )}
      
      <div className="flex flex-col items-center text-center">
        <Folder className="w-12 h-12 text-blue-600 mb-3" />
        <h3 className="font-medium text-gray-900 mb-1 truncate w-full">
          {folder.name}
        </h3>
        <p className="text-sm text-gray-500">
          Créé le {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
};

const Archives: React.FC = () => {
  const { 
    classeurs, 
    archiveFolders, 
    loading, 
    error, 
    createArchiveFolder, 
    unarchiveClasseur,
    loadArchivedClasseurs
  } = useArchives();
  
  const { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop, getDropZoneStyles } = useDragAndDrop();
  const {
    contextMenu,
    openContextMenu,
    closeContextMenu,
    handleDelete
  } = useClasseurActions(loadArchivedClasseurs);
  
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClasseur, setEditingClasseur] = useState<any>(null);

  const handleUnarchive = async (classeur: any) => {
    try {
      await unarchiveClasseur(classeur.id);
    } catch (error) {
      console.error('Erreur lors du désarchivage:', error);
    }
  };

  const handleEditClasseur = (classeur: any) => {
    setEditingClasseur(classeur);
    setIsEditing(true);
  };

  const handleDeleteArchiveFolder = async (folder: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer le dossier "${folder.name}" vers la corbeille ?`)) {
      try {
        await window.electronAPI.deleteArchiveFolder(folder.id);
        // Recharger les archives
        window.location.reload(); // Simple refresh pour recharger les données
      } catch (error) {
        console.error('Erreur lors de la suppression du dossier d\'archive:', error);
      }
    }
  };

  const handleUpdateClasseur = async (id: number, classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
  }) => {
    try {
      await window.electronAPI.updateClasseur(id, classeurData);
      await loadArchivedClasseurs();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const filteredClasseurs = classeurs.filter(classeur => {
    const matchesSearch = searchQuery === '' ||
      classeur.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Si un dossier est sélectionné, ne montrer que les classeurs de ce dossier
    if (selectedFolder !== null) {
      return matchesSearch && classeur.archiveFolder === selectedFolder;
    }
    
    // Si aucun dossier n'est sélectionné, montrer les classeurs dans les "Archives principales"
    // (archiveFolder est null, undefined, vide, ou "Archives principales")
    return matchesSearch && (
      !classeur.archiveFolder || 
      classeur.archiveFolder === '' || 
      classeur.archiveFolder === 'Archives principales'
    );
  });

  const ClasseurCard: React.FC<{ classeur: any }> = ({ classeur }) => {
    const [showActions, setShowActions] = useState(false);
    const [stats, setStats] = useState<{ files: number; folders: number }>({ files: 0, folders: 0 });

    // Charger les statistiques du classeur
    useEffect(() => {
      const loadStats = async () => {
        try {
          const classeurStats = await window.electronAPI.getClasseurStats(classeur.id);
          setStats(classeurStats);
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      };
      loadStats();
    }, [classeur.id]);

    const handleCardClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Navigation vers classeur:', classeur.id);
      
      // Utiliser navigate() comme dans Dashboard
      navigate(`/classeur/${classeur.id}`);
    };

    return (
      <div
        className="relative rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
        style={{ backgroundColor: classeur.primaryColor }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleCardClick}
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
              <button
                className="text-white/80 hover:text-white p-1 rounded flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  openContextMenu(e, classeur);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
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
              {classeur.archiveFolder && (
                <>
                  <span>•</span>
                  <span>📁 {classeur.archiveFolder}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CreateFolderModal: React.FC = () => {
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      try {
        await createArchiveFolder({ name, path: `archives/${name}` });
        setShowCreateFolder(false);
        setName('');
      } catch (error) {
        console.error('Erreur lors de la création:', error);
      }
    };

    if (!showCreateFolder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Créer un dossier d'archive</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du dossier
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Projets 2023"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Archives</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Gérez vos classeurs archivés et organisez-les par dossiers
            </p>
          </div>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Créer un dossier</span>
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher dans les archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des archives...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dossiers d'archives */}
            {archiveFolders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Folder className="w-5 h-5 mr-2" />
                  Dossiers d'archives ({archiveFolders.length})
                </h2>
                <div className="flex flex-wrap gap-4 md:gap-6">
                  {archiveFolders.map((folder) => (
                    <ArchiveFolderCard 
                      key={folder.id} 
                      folder={folder} 
                      onDelete={handleDeleteArchiveFolder}
                      onNavigate={() => navigate(`/archive-folder/${folder.id}`)}
                      onDragOver={(e) => handleDragOver(e, { id: folder.id, type: 'archive-folder', name: folder.name })}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, { id: folder.id, type: 'archive-folder', name: folder.name })}
                      dropZoneStyles={getDropZoneStyles({ id: folder.id, type: 'archive-folder', name: folder.name })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Classeurs archivés */}
            {filteredClasseurs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Archive className="w-5 h-5 mr-2" />
                  Classeurs archivés ({filteredClasseurs.length})
                </h2>
                <div className="flex flex-wrap gap-4 md:gap-6">
                  {filteredClasseurs.map((classeur) => (
                    <ClasseurCard key={classeur.id} classeur={classeur} />
                  ))}
                </div>
              </div>
            )}

            {/* État vide */}
            {archiveFolders.length === 0 && filteredClasseurs.length === 0 && (
              <div className="text-center py-12">
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Aucune archive'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Essayez avec d\'autres mots-clés'
                    : 'Créez votre premier dossier d\'archive pour commencer'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création de dossier */}
      <CreateFolderModal />

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

export default Archives;
