import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, File, Folder, Archive, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Classeur, Dossier, Fichier } from '../types';

interface TrashItem {
  id: number;
  type: 'classeur' | 'dossier' | 'fichier';
  name: string;
  originalPath: string;
  deletedAt: string;
  data: Classeur | Dossier | Fichier;
}

const Trash: React.FC = () => {
  const navigate = useNavigate();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isRestoring, setIsRestoring] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  useEffect(() => {
    loadTrashItems();
  }, []);

  const loadTrashItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger tous les éléments de la corbeille
      const [classeurs, dossiers, fichiers] = await Promise.all([
        window.electronAPI.getTrashClasseurs(),
        window.electronAPI.getTrashDossiers(),
        window.electronAPI.getTrashFichiers()
      ]);

      // Combiner tous les éléments avec leur type
      const allItems: TrashItem[] = [
        ...classeurs.map(c => ({
          id: c.id,
          type: 'classeur' as const,
          name: c.name,
          originalPath: c.path,
          deletedAt: c.deletedAt,
          data: c
        })),
        ...dossiers.map(d => ({
          id: d.id,
          type: 'dossier' as const,
          name: d.name,
          originalPath: d.path,
          deletedAt: d.deletedAt,
          data: d
        })),
        ...fichiers.map(f => ({
          id: f.id,
          type: 'fichier' as const,
          name: f.name,
          originalPath: f.path,
          deletedAt: f.deletedAt,
          data: f
        }))
      ];

      // Trier par date de suppression (plus récent en premier)
      allItems.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
      
      setTrashItems(allItems);
    } catch (error) {
      console.error('Erreur lors du chargement de la corbeille:', error);
      setError('Impossible de charger la corbeille');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      setIsRestoring(true);
      
      switch (item.type) {
        case 'classeur':
          await window.electronAPI.restoreClasseur(item.id);
          break;
        case 'dossier':
          await window.electronAPI.restoreDossier(item.id);
          break;
        case 'fichier':
          await window.electronAPI.restoreFichier(item.id);
          break;
      }
      
      // Recharger la liste
      await loadTrashItems();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsRestoring(true);
      
      for (const itemId of selectedItems) {
        const item = trashItems.find(i => i.id === itemId);
        if (item) {
          await handleRestore(item);
        }
      }
      
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Erreur lors de la restauration multiple:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider définitivement la corbeille ? Cette action est irréversible.')) {
      return;
    }

    try {
      setIsEmptying(true);
      
      // Supprimer définitivement tous les éléments
      await window.electronAPI.emptyTrash();
      
      // Recharger la liste
      await loadTrashItems();
    } catch (error) {
      console.error('Erreur lors du vidage de la corbeille:', error);
    } finally {
      setIsEmptying(false);
    }
  };

  const handleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const filteredItems = trashItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.originalPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemIcon = (item: TrashItem) => {
    switch (item.type) {
      case 'classeur':
        return <Archive className="w-6 h-6 text-blue-600" />;
      case 'dossier':
        return <Folder className="w-6 h-6 text-yellow-600" />;
      case 'fichier':
        return <File className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la corbeille...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Corbeille</h1>
            <p className="text-gray-600 mt-1">
              {trashItems.length} élément{trashItems.length > 1 ? 's' : ''} supprimé{trashItems.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedItems.size > 0 && (
              <button
                onClick={handleRestoreSelected}
                disabled={isRestoring}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurer ({selectedItems.size})</span>
              </button>
            )}
            
            {trashItems.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptying}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isEmptying ? 'Vidage...' : 'Vider la corbeille'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher dans la corbeille..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Aucun résultat trouvé' : 'Corbeille vide'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Essayez avec d\'autres mots-clés'
                : 'Les éléments supprimés apparaîtront ici'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Sélection multiple */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedItems.size > 0 
                    ? `${selectedItems.size} élément${selectedItems.size > 1 ? 's' : ''} sélectionné${selectedItems.size > 1 ? 's' : ''}`
                    : 'Sélectionner tout'
                  }
                </span>
              </div>
              
              <span className="text-sm text-gray-500">
                {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Liste des éléments */}
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                    selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-shrink-0">
                      {getItemIcon(item)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {item.originalPath}
                      </p>
                      <p className="text-xs text-gray-400">
                        Supprimé le {formatDate(item.deletedAt)}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={isRestoring}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Restaurer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trash;
