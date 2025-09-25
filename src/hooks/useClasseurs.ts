import { useState, useEffect } from 'react';
import { Classeur } from '../types';

export const useClasseurs = () => {
  const [classeurs, setClasseurs] = useState<Classeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les classeurs depuis la base de données
  const loadClasseurs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await window.electronAPI.getClasseurs();
      setClasseurs(result);
    } catch (err) {
      setError('Erreur lors du chargement des classeurs');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau classeur
  const createClasseur = async (classeurData: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    path: string;
  }): Promise<Classeur | null> => {
    try {
      setError(null);
      console.log('=== HOOK useClasseurs - Création ===');
      console.log('Données envoyées:', classeurData);
      
      const newClasseur = await window.electronAPI.createClasseur(classeurData);
      console.log('Classeur créé via API:', newClasseur);
      
      // Recharger la liste
      await loadClasseurs();
      
      return newClasseur;
    } catch (err) {
      setError('Erreur lors de la création du classeur');
      console.error('Erreur dans useClasseurs:', err);
      return null;
    }
  };

  // Mettre à jour un classeur
  const updateClasseur = async (id: number, updates: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
  }): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await window.electronAPI.updateClasseur(id, updates);
      
      if (success) {
        // Recharger la liste
        await loadClasseurs();
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Erreur lors de la modification du classeur');
      console.error('Erreur:', err);
      return false;
    }
  };

  // Supprimer un classeur
  const deleteClasseur = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      
      // TODO: Implémenter la suppression via IPC
      // await window.electronAPI.deleteClasseur(id);
      
      // Recharger la liste
      await loadClasseurs();
      
      return true;
    } catch (err) {
      setError('Erreur lors de la suppression du classeur');
      console.error('Erreur:', err);
      return false;
    }
  };

  // Charger les classeurs au montage du composant
  useEffect(() => {
    loadClasseurs();
  }, []);

  return {
    classeurs,
    loading,
    error,
    loadClasseurs,
    createClasseur,
    updateClasseur,
    deleteClasseur,
  };
};
