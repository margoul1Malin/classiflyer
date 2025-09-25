import { promises as fs } from 'fs';
import path from 'path';
import { Classeur, Dossier, Fichier } from '../types';

export class FileService {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  // Initialiser le chemin racine
  async initializeRootPath(): Promise<void> {
    try {
      await fs.access(this.rootPath);
    } catch {
      await fs.mkdir(this.rootPath, { recursive: true });
    }
  }

  // Créer un nouveau classeur
  async createClasseur(classeur: Omit<Classeur, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const classeurPath = path.join(this.rootPath, classeur.name);
    await fs.mkdir(classeurPath, { recursive: true });
  }

  // Supprimer un classeur
  async deleteClasseur(classeurPath: string): Promise<void> {
    try {
      // Vérifier si le dossier existe avant de le supprimer
      await fs.access(classeurPath);
      await fs.rm(classeurPath, { recursive: true, force: true });
    } catch (error) {
      // Ignorer l'erreur si le dossier n'existe pas
      console.log(`Dossier ${classeurPath} n'existe pas ou déjà supprimé`);
    }
  }

  // Créer un dossier dans un classeur
  async createDossier(classeurPath: string, dossierName: string, parentPath?: string): Promise<void> {
    const dossierPath = parentPath 
      ? path.join(classeurPath, parentPath, dossierName)
      : path.join(classeurPath, dossierName);
    
    await fs.mkdir(dossierPath, { recursive: true });
  }

  // Supprimer un dossier
  async deleteDossier(dossierPath: string): Promise<void> {
    try {
      await fs.access(dossierPath);
      await fs.rm(dossierPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`Dossier ${dossierPath} n'existe pas ou déjà supprimé`);
    }
  }

  // Copier un fichier dans un dossier
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    await fs.copyFile(sourcePath, destinationPath);
  }

  // Supprimer un fichier
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.log(`Fichier ${filePath} n'existe pas ou déjà supprimé`);
    }
  }

  // Obtenir les statistiques d'un dossier
  async getFolderStats(folderPath: string): Promise<{ files: number; folders: number }> {
    try {
      const items = await fs.readdir(folderPath);
      let files = 0;
      let folders = 0;

      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          folders++;
        } else {
          files++;
        }
      }

      return { files, folders };
    } catch {
      return { files: 0, folders: 0 };
    }
  }

  // Scanner un classeur pour obtenir tous les fichiers et dossiers
  async scanClasseur(classeurPath: string): Promise<{ dossiers: Dossier[]; fichiers: Fichier[] }> {
    const dossiers: Dossier[] = [];
    const fichiers: Fichier[] = [];

    try {
      const items = await fs.readdir(classeurPath);
      
      for (const item of items) {
        const itemPath = path.join(classeurPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          dossiers.push({
            id: 0, // Sera assigné par la DB
            classeurId: 0, // Sera assigné par la DB
            name: item,
            path: itemPath,
            createdAt: stats.birthtime.toISOString(),
          });
        } else {
          const extension = path.extname(item).toLowerCase();
          const type = this.getFileType(extension);
          
          fichiers.push({
            id: 0, // Sera assigné par la DB
            dossierId: 0, // Sera assigné par la DB
            name: item,
            path: itemPath,
            type,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du scan du classeur:', error);
    }

    return { dossiers, fichiers };
  }

  private getFileType(extension: string): string {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.avif', '.webp'];
    const documentExtensions = ['.pdf', '.docx', '.xlsx'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (documentExtensions.includes(extension)) {
      return 'document';
    } else {
      return 'other';
    }
  }

  // Obtenir le chemin racine
  getRootPath(): string {
    return this.rootPath;
  }

  // Changer le chemin racine
  setRootPath(newRootPath: string): void {
    this.rootPath = newRootPath;
  }
}
