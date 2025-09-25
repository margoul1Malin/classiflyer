export interface Classeur {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  path: string;
  isArchived: boolean;
  archiveFolder?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dossier {
  id: number;
  classeurId: number;
  name: string;
  path: string;
  parentId?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  children?: Dossier[];
}

export interface Fichier {
  id: number;
  classeurId?: number; // Optionnel, pour les fichiers directement dans le classeur
  dossierId?: number;  // Optionnel, pour les fichiers dans des dossiers
  name: string;
  path: string;
  type: string;
  size: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Settings {
  rootPath: string;
  viewMode: 'grid' | 'list';
}

export interface ArchiveFolder {
  id: number;
  name: string;
  path: string;
  createdAt: string;
}

export interface SearchResult {
  classeurs: Classeur[];
  dossiers: Dossier[];
  fichiers: Fichier[];
}

export type FileType = 'image' | 'document' | 'other';

export const SUPPORTED_IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'avif', 'webp'];
export const SUPPORTED_DOCUMENT_TYPES = ['pdf', 'docx', 'xlsx'];

export const getFileType = (filename: string): FileType => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (extension && SUPPORTED_IMAGE_TYPES.includes(extension)) {
    return 'image';
  }
  
  if (extension && SUPPORTED_DOCUMENT_TYPES.includes(extension)) {
    return 'document';
  }
  
  return 'other';
};
