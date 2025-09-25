import React, { useEffect } from 'react';
import { Search, Folder, File, Archive } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

interface SearchResultsProps {
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query }) => {
  const { results, loading, error, totalResults, search } = useSearch();

  useEffect(() => {
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Résultats de recherche</h1>
            <p className="text-gray-600 mt-1">
              {loading 
                ? 'Recherche en cours...' 
                : `"${query}" - ${totalResults} résultat${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Recherche en cours...</span>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600">
              Essayez avec d'autres mots-clés ou vérifiez l'orthographe
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Classeurs */}
            {results.classeurs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Archive className="w-5 h-5 mr-2" />
                  Classeurs ({results.classeurs.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {results.classeurs.map((classeur) => (
                    <div
                      key={classeur.id}
                      className="relative rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      style={{ backgroundColor: classeur.primaryColor }}
                    >
                      <div 
                        className="h-32 w-32 rounded-lg relative overflow-hidden p-3 flex flex-col justify-between"
                        style={{ backgroundColor: classeur.primaryColor }}
                      >
                        <div
                          className="absolute top-0 bottom-0 w-1 right-0"
                          style={{ backgroundColor: classeur.secondaryColor }}
                        />
                        <h3 className="text-white font-semibold text-sm leading-tight">
                          {classeur.name}
                        </h3>
                        <div className="text-white/80 text-xs">
                          {classeur.isArchived ? 'Archivé' : 'Actif'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dossiers */}
            {results.dossiers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Folder className="w-5 h-5 mr-2" />
                  Dossiers ({results.dossiers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.dossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Folder className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {dossier.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fichiers */}
            {results.fichiers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <File className="w-5 h-5 mr-2" />
                  Fichiers ({results.fichiers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.fichiers.map((fichier) => (
                    <div
                      key={fichier.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
