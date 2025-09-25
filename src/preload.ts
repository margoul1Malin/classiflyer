import { contextBridge, ipcRenderer } from 'electron';
import { Classeur } from './types';

// Expose les APIs Electron de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
  // Classeurs
  getClasseurs: () => ipcRenderer.invoke('get-classeurs'),
  getClasseur: (id: number) => ipcRenderer.invoke('get-classeur', id),
  createClasseur: (classeur: Omit<Classeur, 'id' | 'createdAt' | 'updatedAt'>) => 
    ipcRenderer.invoke('create-classeur', classeur),
  updateClasseur: (id: number, updates: { name: string; primaryColor: string; secondaryColor: string }) => 
    ipcRenderer.invoke('update-classeur', id, updates),
  archiveClasseur: (id: number, archiveFolder?: string) => ipcRenderer.invoke('archive-classeur', id, archiveFolder),
  deleteClasseur: (id: number) => ipcRenderer.invoke('delete-classeur', id),
  
  // Archives
  getArchivedClasseurs: () => ipcRenderer.invoke('get-archived-classeurs'),
  unarchiveClasseur: (id: number) => ipcRenderer.invoke('unarchive-classeur', id),
  
  // Dossiers d'archives
  getArchiveFolders: () => ipcRenderer.invoke('get-archive-folders'),
  createArchiveFolder: (archiveFolder: { name: string; path: string }) => ipcRenderer.invoke('create-archive-folder', archiveFolder),
  deleteArchiveFolder: (id: number) => ipcRenderer.invoke('delete-archive-folder', id),
  
  // Recherche
  searchAll: (query: string) => ipcRenderer.invoke('search-all', query),

  // Dossiers
  createDossier: (dossier: { classeurId: number | null; name: string; path: string; parentId?: number | null }) =>
    ipcRenderer.invoke('create-dossier', dossier),
  getDossiersByClasseur: (classeurId: number, parentId?: number) =>
    ipcRenderer.invoke('get-dossiers-by-classeur', classeurId, parentId),
  getDossiersByArchiveFolder: (archiveFolderId: number) =>
    ipcRenderer.invoke('get-dossiers-by-archive-folder', archiveFolderId),
  getAllDossiers: () => ipcRenderer.invoke('get-all-dossiers'),
  getSubDossiers: (parentId: number) => ipcRenderer.invoke('get-sub-dossiers', parentId),

  // Fichiers
  createFichier: (fichier: { classeurId?: number; dossierId?: number; name: string; path: string; type: string; size: number }) =>
    ipcRenderer.invoke('create-fichier', fichier),
  getFichiersByDossier: (dossierId: number) =>
    ipcRenderer.invoke('get-fichiers-by-dossier', dossierId),
  getFichiersByClasseur: (classeurId: number) =>
    ipcRenderer.invoke('get-fichiers-by-classeur', classeurId),
  getFichiersByArchiveFolder: (archiveFolderId: number) =>
    ipcRenderer.invoke('get-fichiers-by-archive-folder', archiveFolderId),
  getClasseurStats: (classeurId: number) =>
    ipcRenderer.invoke('get-classeur-stats', classeurId),
  deleteDossier: (id: number) => ipcRenderer.invoke('delete-dossier', id),
  deleteFichier: (id: number) => ipcRenderer.invoke('delete-fichier', id),

  // Paramètres
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: { rootPath?: string; viewMode?: string }) => ipcRenderer.invoke('update-settings', settings),
  
  // Sélection de dossier
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Chemin racine
  getRootPath: () => ipcRenderer.invoke('get-root-path'),
  
  // Servir un fichier
  serveFile: (filePath: string) => ipcRenderer.invoke('serve-file', filePath),
  
  // Upload d'un fichier physique
  uploadFile: (fileData: { name: string; data: string; type: string; size: number }, destinationPath: string) => 
    ipcRenderer.invoke('upload-file', fileData, destinationPath),
  
  // Informations système
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Corbeille
  getTrashClasseurs: () => ipcRenderer.invoke('get-trash-classeurs'),
  getTrashDossiers: () => ipcRenderer.invoke('get-trash-dossiers'),
  getTrashFichiers: () => ipcRenderer.invoke('get-trash-fichiers'),
  restoreClasseur: (id: number) => ipcRenderer.invoke('restore-classeur', id),
  restoreDossier: (id: number) => ipcRenderer.invoke('restore-dossier', id),
  restoreFichier: (id: number) => ipcRenderer.invoke('restore-fichier', id),
  emptyTrash: () => ipcRenderer.invoke('empty-trash'),
});

// Types pour TypeScript
declare global {
  interface Window {
    electronAPI: {
      getClasseurs: () => Promise<Classeur[]>;
      getClasseur: (id: number) => Promise<Classeur | null>;
      createClasseur: (classeur: Omit<Classeur, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Classeur>;
      updateClasseur: (id: number, updates: { name: string; primaryColor: string; secondaryColor: string }) => Promise<boolean>;
      archiveClasseur: (id: number, archiveFolder?: string) => Promise<boolean>;
      deleteClasseur: (id: number) => Promise<boolean>;
      
      // Archives
      getArchivedClasseurs: () => Promise<Classeur[]>;
      unarchiveClasseur: (id: number) => Promise<boolean>;
      
      // Dossiers d'archives
      getArchiveFolders: () => Promise<{ id: number; name: string; path: string; createdAt: string }[]>;
      createArchiveFolder: (archiveFolder: { name: string; path: string }) => Promise<{ id: number; name: string; path: string; createdAt: string }>;
      deleteArchiveFolder: (id: number) => Promise<boolean>;
      
      // Recherche
      searchAll: (query: string) => Promise<{ classeurs: Classeur[]; dossiers: any[]; fichiers: any[] }>;

      // Dossiers
      createDossier: (dossier: { classeurId: number | null; name: string; path: string; parentId?: number | null }) => Promise<Dossier>;
      getDossiersByClasseur: (classeurId: number, parentId?: number) => Promise<Dossier[]>;
      getDossiersByArchiveFolder: (archiveFolderId: number) => Promise<Dossier[]>;

      // Fichiers
      createFichier: (fichier: { classeurId?: number; dossierId?: number; name: string; path: string; type: string; size: number }) => Promise<Fichier>;
      getFichiersByDossier: (dossierId: number) => Promise<Fichier[]>;
      getFichiersByClasseur: (classeurId: number) => Promise<Fichier[]>;
      getFichiersByArchiveFolder: (archiveFolderId: number) => Promise<Fichier[]>;
      deleteDossier: (id: number) => Promise<boolean>;
      deleteFichier: (id: number) => Promise<boolean>;

      getSettings: () => Promise<{ rootPath: string; viewMode: string }>;
      updateSettings: (settings: { rootPath?: string; viewMode?: string }) => Promise<boolean>;
      selectFolder: () => Promise<string | null>;
      getRootPath: () => Promise<string>;
      serveFile: (filePath: string) => Promise<{ data: string; mimeType: string } | null>;
      uploadFile: (fileData: { name: string; data: string; type: string; size: number }, destinationPath: string) => Promise<{ success: boolean; path?: string; size?: number; error?: string }>;
      getSystemInfo: () => Promise<{ platform: string; arch: string; nodeVersion: string }>;
      
      // Corbeille
      getTrashClasseurs: () => Promise<Classeur[]>;
      getTrashDossiers: () => Promise<Dossier[]>;
      getTrashFichiers: () => Promise<Fichier[]>;
      restoreClasseur: (id: number) => Promise<boolean>;
      restoreDossier: (id: number) => Promise<boolean>;
      restoreFichier: (id: number) => Promise<boolean>;
      emptyTrash: () => Promise<void>;
    };
  }
}
