import React, { useState, useEffect } from 'react';
import { ArrowLeft, Folder, Palette, Eye, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [rootPath, setRootPath] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [defaultPrimaryColor, setDefaultPrimaryColor] = useState('#3B82F6');
  const [defaultSecondaryColor, setDefaultSecondaryColor] = useState('#1E40AF');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<{ platform: string; arch: string; nodeVersion: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Charger le chemin racine
      const currentRootPath = await window.electronAPI.getRootPath();
      setRootPath(currentRootPath);
      
      // Charger les paramètres depuis la base de données
      const savedViewMode = await window.electronAPI.getSetting('viewMode');
      if (savedViewMode) {
        setViewMode(savedViewMode as 'grid' | 'list');
      }
      
      const savedPrimaryColor = await window.electronAPI.getSetting('defaultPrimaryColor');
      if (savedPrimaryColor) {
        setDefaultPrimaryColor(savedPrimaryColor);
      }
      
      const savedSecondaryColor = await window.electronAPI.getSetting('defaultSecondaryColor');
      if (savedSecondaryColor) {
        setDefaultSecondaryColor(savedSecondaryColor);
      }
      
      // Charger les informations système
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder tous les paramètres dans la base de données
      await window.electronAPI.setSetting('viewMode', viewMode);
      await window.electronAPI.setSetting('defaultPrimaryColor', defaultPrimaryColor);
      await window.electronAPI.setSetting('defaultSecondaryColor', defaultSecondaryColor);
      
      // Mettre à jour le chemin racine si nécessaire
      if (rootPath) {
        await window.electronAPI.setSetting('rootPath', rootPath);
      }
      
      console.log('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectRootPath = async () => {
    try {
      const selectedPath = await window.electronAPI.selectFolder();
      if (selectedPath) {
        setRootPath(selectedPath);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du dossier:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des paramètres...</span>
          </div>
        ) : (
          <>
        {/* Dossier racine */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Dossier racine</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Définissez le dossier où seront stockés tous vos classeurs et documents.
          </p>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Chemin du dossier racine"
            />
            <button
              onClick={handleSelectRootPath}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Parcourir
            </button>
          </div>
        </div>

        {/* Préférences d'affichage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Préférences d'affichage</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode d'affichage par défaut
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="grid"
                    checked={viewMode === 'grid'}
                    onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                    className="mr-2"
                  />
                  <span>Grille</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="list"
                    checked={viewMode === 'list'}
                    onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                    className="mr-2"
                  />
                  <span>Liste</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Couleurs par défaut */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Couleurs par défaut</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Définissez les couleurs par défaut pour les nouveaux classeurs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={defaultPrimaryColor}
                  onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={defaultPrimaryColor}
                  onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={defaultSecondaryColor}
                  onChange={(e) => setDefaultSecondaryColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={defaultSecondaryColor}
                  onChange={(e) => setDefaultSecondaryColor(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aperçu
            </label>
            <div className="w-64 h-20 rounded-lg relative overflow-hidden border border-gray-200">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: defaultPrimaryColor }}
              >
                <div
                  className="absolute top-0 bottom-0 w-2 right-8"
                  style={{ backgroundColor: defaultSecondaryColor }}
                />
                <div className="absolute inset-0 p-4 flex items-center justify-between">
                  <span className="text-white font-semibold">Nouveau classeur</span>
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations système */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Version de l'application:</span>
              <span className="ml-2 font-mono">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-600">Plateforme:</span>
              <span className="ml-2 font-mono">{systemInfo?.platform || 'Inconnue'}</span>
            </div>
            <div>
              <span className="text-gray-600">Architecture:</span>
              <span className="ml-2 font-mono">{systemInfo?.arch || 'Inconnue'}</span>
            </div>
            <div>
              <span className="text-gray-600">Version Node.js:</span>
              <span className="ml-2 font-mono">{systemInfo?.nodeVersion || 'Inconnue'}</span>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
