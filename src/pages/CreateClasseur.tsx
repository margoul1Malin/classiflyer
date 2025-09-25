import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import CreateClasseurModal from '../components/CreateClasseurModal';

const CreateClasseur: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  const handleCreate = async (classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    path: string;
  }) => {
    // La logique de création est gérée par le modal
    // On ferme la page après création
    navigate('/');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau classeur</h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration du classeur
            </h2>
            <p className="text-gray-600 mb-6">
              Remplissez les informations ci-dessous pour créer votre nouveau classeur.
            </p>
            
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Ouvrir le formulaire de création</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de création */}
      <CreateClasseurModal
        isOpen={showModal}
        onClose={handleClose}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default CreateClasseur;
