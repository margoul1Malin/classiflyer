import React, { useState, useEffect } from 'react';
import { X, Palette, FolderPlus } from 'lucide-react';
import { Classeur } from '../types';

interface EditClasseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
  }) => Promise<void>;
  classeur: Classeur | null;
}

const EditClasseurModal: React.FC<EditClasseurModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  classeur,
}) => {
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [isUpdating, setIsUpdating] = useState(false);

  // Charger les données du classeur quand le modal s'ouvre
  useEffect(() => {
    if (classeur && isOpen) {
      setName(classeur.name);
      setPrimaryColor(classeur.primaryColor);
      setSecondaryColor(classeur.secondaryColor);
    }
  }, [classeur, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !classeur) return;

    setIsUpdating(true);
    try {
      await onUpdate(classeur.id, {
        name: name.trim(),
        primaryColor,
        secondaryColor,
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !classeur) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Modifier le classeur</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Formulaire */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom du classeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nom du classeur
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Documents de travail"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                  required
                />
              </div>

              {/* Couleurs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Couleur principale
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-16 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-base"
                      />
                      <p className="text-sm text-gray-500 mt-1">Couleur de fond du classeur</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Couleur secondaire
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-16 h-16 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-base"
                      />
                      <p className="text-sm text-gray-500 mt-1">Couleur de la barre de marqueur</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !name.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Modification...</span>
                    </>
                  ) : (
                    <>
                      <Palette className="w-5 h-5" />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="lg:w-80 bg-gray-50 p-6 flex flex-col items-center justify-center border-l border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
            <div className="relative">
              <div 
                className="h-96 w-64 rounded-lg relative overflow-hidden shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {/* Barre de marqueur */}
                <div
                  className="absolute top-0 bottom-0 w-1 right-0"
                  style={{ backgroundColor: secondaryColor }}
                />
                
                {/* Contenu de la carte */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-semibold text-xl leading-tight">
                      {name || 'Nouveau classeur'}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-white/80 text-sm">
                      Créé le {new Date(classeur.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center space-x-2 text-white/80 text-sm">
                      <span>0 fichiers</span>
                      <span>•</span>
                      <span>0 dossiers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Les modifications seront appliquées immédiatement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClasseurModal;
