import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, MoreVertical, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClasseurs } from '../hooks/useClasseurs';
import { useClasseurActions } from '../hooks/useClasseurActions';
import { useDragAndDrop, DragItem } from '../hooks/useDragAndDrop';
import CreateClasseurModal from '../components/CreateClasseurModal';
import EditClasseurModal from '../components/EditClasseurModal';
import ClasseurContextMenu from '../components/ClasseurContextMenu';
import ArchiveSelectionModal from '../components/ArchiveSelectionModal';
import { Classeur } from '../types';

const Dashboard: React.FC = () => {
  const { classeurs, loading, error, createClasseur, updateClasseur, loadClasseurs } = useClasseurs();
  const { 
    contextMenu, 
    archiveModal,
    openContextMenu, 
    closeContextMenu, 
    handleArchive, 
    handleArchiveConfirm,
    closeArchiveModal,
    handleDelete 
  } = useClasseurActions(loadClasseurs);
  const { handleDragStart, handleDragEnd, getDropZoneStyles } = useDragAndDrop();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClasseur, setEditingClasseur] = useState<Classeur | null>(null);

  const handleCreateClasseur = async (classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    path: string;
  }) => {
    await createClasseur(classeurData);
  };

  const handleEditClasseur = (classeur: Classeur) => {
    setEditingClasseur(classeur);
    setIsEditing(true);
  };

  const handleUpdateClasseur = async (id: number, classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
  }) => {
    await updateClasseur(id, classeurData);
  };

  const ClasseurCard: React.FC<{ classeur: Classeur }> = ({ classeur }) => {
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

    const onDragStart = (e: React.DragEvent) => {
      const dragItem: DragItem = {
        id: classeur.id,
        type: 'classeur',
        name: classeur.name,
        data: classeur
      };
      handleDragStart(dragItem);
    };

    return (
      <div
        className="relative rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
        style={{ backgroundColor: classeur.primaryColor }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        draggable
        onDragStart={onDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          console.log('Clic sur classeur:', classeur.id, classeur.name);
          e.preventDefault();
          e.stopPropagation();
          console.log('Tentative de navigation vers:', `/classeur/${classeur.id}`);
          try {
            navigate(`/classeur/${classeur.id}`);
          } catch (error) {
            console.error('Erreur de navigation:', error);
            // Fallback
            window.location.href = `/classeur/${classeur.id}`;
          }
        }}
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
          <div className="flex justify-between items-start gap-2">
            <h3 
              className="text-white font-semibold text-base sm:text-lg leading-tight flex-1 min-w-0"
              title={classeur.name}
            >
              <span className="block truncate">
                {classeur.name}
              </span>
            </h3>
            {showActions && (
              <div className="flex items-center space-x-1 flex-shrink-0">
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
                    openContextMenu(e, classeur);
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
              Créé le {new Date(classeur.createdAt).toLocaleDateString('fr-FR')}
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

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Gérez vos classeurs et organisez vos documents
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Créer un classeur</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement des classeurs...</span>
          </div>
        ) : classeurs.length === 0 ? (
          // État vide
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun classeur créé
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer votre premier classeur pour organiser vos documents
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Créer mon premier classeur</span>
            </button>
          </div>
        ) : (
          // Grille des classeurs responsive avec flex-wrap
          <div className="flex flex-wrap gap-4 md:gap-6">
            {classeurs.map((classeur) => (
              <ClasseurCard key={classeur.id} classeur={classeur} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      <CreateClasseurModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={handleCreateClasseur}
      />

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
        <ClasseurContextMenu
          isOpen={contextMenu.isOpen}
          onClose={closeContextMenu}
          position={contextMenu.position}
          classeur={contextMenu.classeur}
          onEdit={handleEditClasseur}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* Modal de sélection d'archive */}
      {archiveModal.isOpen && archiveModal.classeur && (
        <ArchiveSelectionModal
          isOpen={archiveModal.isOpen}
          onClose={closeArchiveModal}
          onSelect={handleArchiveConfirm}
          classeurName={archiveModal.classeur.name}
        />
      )}
    </div>
  );
};

export default Dashboard;
