import { useState, useEffect } from 'react';
import { Classeur, ArchiveFolder } from '../types';

export const useArchives = () => {
  const [classeurs, setClasseurs] = useState<Classeur[]>([]);
  const [archiveFolders, setArchiveFolders] = useState<ArchiveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchivedClasseurs = async () => {
    try {
      setLoading(true);
      setError(null);
      const archivedClasseurs = await window.electronAPI.getArchivedClasseurs();
      setClasseurs(archivedClasseurs);
    } catch (err) {
      setError('Erreur lors du chargement des classeurs archivés');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArchiveFolders = async () => {
    try {
      setError(null);
      const folders = await window.electronAPI.getArchiveFolders();
      setArchiveFolders(folders);
    } catch (err) {
      setError('Erreur lors du chargement des dossiers d\'archives');
      console.error('Erreur:', err);
    }
  };

  const createArchiveFolder = async (archiveFolder: { name: string; path: string }): Promise<boolean> => {
    try {
      setError(null);
      await window.electronAPI.createArchiveFolder(archiveFolder);
      await loadArchiveFolders();
      return true;
    } catch (err) {
      setError('Erreur lors de la création du dossier d\'archive');
      console.error('Erreur:', err);
      return false;
    }
  };

  const deleteArchiveFolder = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      const success = await window.electronAPI.deleteArchiveFolder(id);
      if (success) {
        await loadArchiveFolders();
      }
      return success;
    } catch (err) {
      setError('Erreur lors de la suppression du dossier d\'archive');
      console.error('Erreur:', err);
      return false;
    }
  };

  const unarchiveClasseur = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      const success = await window.electronAPI.unarchiveClasseur(id);
      if (success) {
        await loadArchivedClasseurs();
      }
      return success;
    } catch (err) {
      setError('Erreur lors du désarchivage du classeur');
      console.error('Erreur:', err);
      return false;
    }
  };

  useEffect(() => {
    loadArchivedClasseurs();
    loadArchiveFolders();
  }, []);

  return {
    classeurs,
    archiveFolders,
    loading,
    error,
    loadArchivedClasseurs,
    loadArchiveFolders,
    createArchiveFolder,
    deleteArchiveFolder,
    unarchiveClasseur,
  };
};
