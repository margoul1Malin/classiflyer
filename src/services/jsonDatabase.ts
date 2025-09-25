import { promises as fs } from 'fs';
import path from 'path';
import { Classeur, Dossier, Fichier, ArchiveFolder, Settings } from '../types';

export interface DatabaseData {
  classeurs: Classeur[];
  dossiers: Dossier[];
  fichiers: Fichier[];
  archiveFolders: ArchiveFolder[];
  settings: Settings;
  nextId: {
    classeurs: number;
    dossiers: number;
    fichiers: number;
    archiveFolders: number;
  };
}

export class JsonDatabaseService {
  private configPath: string;
  private rootPath: string;
  private data: DatabaseData | null = null;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.configPath = path.join(rootPath, 'db.json');
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.access(this.rootPath);
    } catch {
      await fs.mkdir(this.rootPath, { recursive: true });
    }
    
    // Créer aussi le dossier Classiflyer pour les classeurs
    const classiflyerPath = path.join(this.rootPath, 'Classiflyer');
    try {
      await fs.access(classiflyerPath);
    } catch {
      await fs.mkdir(classiflyerPath, { recursive: true });
    }
  }

  private async loadDatabase(): Promise<DatabaseData> {
    if (this.data) {
      return this.data;
    }

    await this.ensureDirectory();

    try {
      const fileContent = await fs.readFile(this.configPath, 'utf-8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      // Fichier n'existe pas ou est corrompu, créer une nouvelle base
      console.log('Création d\'une nouvelle base de données JSON');
      this.data = {
        classeurs: [],
        dossiers: [],
        fichiers: [],
        archiveFolders: [],
        settings: {
          rootPath: this.rootPath,
          viewMode: 'grid'
        },
        nextId: {
          classeurs: 1,
          dossiers: 1,
          fichiers: 1,
          archiveFolders: 1
        }
      };
      await this.saveDatabase();
    }

    return this.data!;
  }

  private async saveDatabase(): Promise<void> {
    if (!this.data) return;

    await this.ensureDirectory();
    await fs.writeFile(this.configPath, JSON.stringify(this.data, null, 2));
  }

  private getNextId(type: keyof DatabaseData['nextId']): number {
    if (!this.data) throw new Error('Database not loaded');
    return this.data.nextId[type]++;
  }

  // Méthodes pour les classeurs
  async getClasseurs(): Promise<Classeur[]> {
    const data = await this.loadDatabase();
    return data.classeurs.filter(c => !c.isDeleted && !c.isArchived);
  }

  async getClasseur(id: number): Promise<Classeur | null> {
    const data = await this.loadDatabase();
    return data.classeurs.find(c => c.id === id) || null;
  }

  async createClasseur(classeur: Omit<Classeur, 'id' | 'createdAt' | 'updatedAt'>): Promise<Classeur> {
    const data = await this.loadDatabase();
    
    // Utiliser le chemin fourni (déjà construit dans main.ts)
    const classeurPath = classeur.path;
    
    const newClasseur: Classeur = {
      ...classeur,
      id: this.getNextId('classeurs'),
      path: classeurPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      archiveFolder: undefined,
      isDeleted: false,
      deletedAt: undefined
    };

    data.classeurs.push(newClasseur);
    await this.saveDatabase();

    // Créer physiquement le dossier du classeur
    try {
      await fs.mkdir(classeurPath, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du dossier physique:', error);
    }

    return newClasseur;
  }

  async updateClasseur(id: number, updates: Partial<Classeur>): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.classeurs.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    data.classeurs[index] = {
      ...data.classeurs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveDatabase();
    return true;
  }

  async deleteClasseur(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.classeurs.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    // Soft delete
    data.classeurs[index].isDeleted = true;
    data.classeurs[index].deletedAt = new Date().toISOString();

    await this.saveDatabase();
    return true;
  }

  async archiveClasseur(id: number, archiveFolder?: string): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.classeurs.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    data.classeurs[index].isArchived = true;
    data.classeurs[index].archiveFolder = archiveFolder || null;
    data.classeurs[index].updatedAt = new Date().toISOString();

    await this.saveDatabase();
    return true;
  }

  async unarchiveClasseur(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.classeurs.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    data.classeurs[index].isArchived = false;
    data.classeurs[index].archiveFolder = undefined;
    data.classeurs[index].updatedAt = new Date().toISOString();

    await this.saveDatabase();
    return true;
  }

  async getArchivedClasseurs(): Promise<Classeur[]> {
    const data = await this.loadDatabase();
    return data.classeurs.filter(c => c.isArchived && !c.isDeleted);
  }

  // Méthodes pour les dossiers
  async getDossiersByClasseur(classeurId: number, parentId: number | null): Promise<Dossier[]> {
    const data = await this.loadDatabase();
    return data.dossiers.filter(d => 
      d.classeurId === classeurId && 
      d.parentId === parentId && 
      !d.isDeleted
    );
  }

  async getDossier(id: number): Promise<Dossier | null> {
    const data = await this.loadDatabase();
    return data.dossiers.find(d => d.id === id) || null;
  }

  async getAllDossiers(): Promise<Dossier[]> {
    const data = await this.loadDatabase();
    return data.dossiers.filter(d => !d.isDeleted);
  }

  async createDossier(dossier: Omit<Dossier, 'id' | 'createdAt'>): Promise<Dossier> {
    const data = await this.loadDatabase();
    
    // Construire le chemin physique
    let dossierPath: string;
    
    if (dossier.classeurId) {
      // C'est un dossier dans un classeur
      const classeur = data.classeurs.find(c => c.id === dossier.classeurId);
      if (!classeur) {
        throw new Error('Classeur parent introuvable');
      }
      
      if (dossier.parentId) {
        // C'est un sous-dossier dans un classeur
        const parentDossier = data.dossiers.find(d => d.id === dossier.parentId);
        if (!parentDossier) {
          throw new Error('Dossier parent introuvable');
        }
        dossierPath = path.join(parentDossier.path, dossier.name);
      } else {
        // C'est un dossier racine du classeur - FORCER le nouveau chemin All_Classeurs
        const settings = await this.getSettings();
        const rootPath = settings.rootPath;
        const correctClasseurPath = path.join(rootPath, 'Classiflyer', 'All_Classeurs', classeur.name);
        dossierPath = path.join(correctClasseurPath, dossier.name);
      }
    } else {
      // C'est un dossier dans un dossier d'archive (pas de classeur)
      if (dossier.parentId) {
        // Vérifier d'abord si c'est un dossier d'archive
        const parentArchiveFolder = data.archiveFolders.find(af => af.id === dossier.parentId);
        if (parentArchiveFolder) {
          // C'est un sous-dossier direct d'un dossier d'archive
          dossierPath = path.join(parentArchiveFolder.path, dossier.name);
        } else {
          // C'est un sous-dossier d'un autre dossier
          const parentDossier = data.dossiers.find(d => d.id === dossier.parentId);
          if (!parentDossier) {
            throw new Error('Dossier parent introuvable');
          }
          dossierPath = path.join(parentDossier.path, dossier.name);
        }
      } else {
        // C'est un dossier racine d'archive (ne devrait pas arriver normalement)
        throw new Error('Impossible de créer un dossier racine sans classeur');
      }
    }
    
    const newDossier: Dossier = {
      ...dossier,
      id: this.getNextId('dossiers'),
      path: dossierPath,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: undefined
    };

    data.dossiers.push(newDossier);
    await this.saveDatabase();

    // Créer physiquement le dossier
    try {
      await fs.mkdir(dossierPath, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du dossier physique:', error);
    }

    return newDossier;
  }

  async deleteDossier(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.dossiers.findIndex(d => d.id === id);
    
    if (index === -1) return false;

    // Suppression en cascade récursive
    await this.deleteDossierRecursive(id, data);

    await this.saveDatabase();
    return true;
  }

  private async deleteDossierRecursive(dossierId: number, data: DatabaseData): Promise<void> {
    // Marquer le dossier comme supprimé
    const dossierIndex = data.dossiers.findIndex(d => d.id === dossierId);
    if (dossierIndex !== -1) {
      data.dossiers[dossierIndex].isDeleted = true;
      data.dossiers[dossierIndex].deletedAt = new Date().toISOString();
    }

    // Trouver et supprimer tous les sous-dossiers
    const subDossiers = data.dossiers.filter(d => d.parentId === dossierId && !d.isDeleted);
    for (const subDossier of subDossiers) {
      await this.deleteDossierRecursive(subDossier.id, data);
    }

    // Trouver et supprimer tous les fichiers du dossier
    const fichiers = data.fichiers.filter(f => f.dossierId === dossierId && !f.isDeleted);
    for (const fichier of fichiers) {
      const fichierIndex = data.fichiers.findIndex(f => f.id === fichier.id);
      if (fichierIndex !== -1) {
        data.fichiers[fichierIndex].isDeleted = true;
        data.fichiers[fichierIndex].deletedAt = new Date().toISOString();
      }
    }
  }

  // Méthodes pour les fichiers
  async getFichiersByDossier(dossierId: number): Promise<Fichier[]> {
    const data = await this.loadDatabase();
    return data.fichiers.filter(f => f.dossierId === dossierId && !f.isDeleted);
  }

  async getFichiersByClasseur(classeurId: number): Promise<Fichier[]> {
    const data = await this.loadDatabase();
    return data.fichiers.filter(f => f.classeurId === classeurId && !f.dossierId && !f.isDeleted);
  }

  async getFichier(id: number): Promise<Fichier | null> {
    const data = await this.loadDatabase();
    return data.fichiers.find(f => f.id === id) || null;
  }

  async createFichier(fichier: Omit<Fichier, 'id' | 'createdAt'>): Promise<Fichier> {
    const data = await this.loadDatabase();
    
    let fichierPath: string;
    
    // Si c'est un fichier directement dans le classeur
    if (fichier.classeurId && !fichier.dossierId) {
      const classeur = data.classeurs.find(c => c.id === fichier.classeurId);
      if (!classeur) {
        throw new Error('Classeur parent introuvable');
      }
      // FORCER le nouveau chemin All_Classeurs pour les fichiers dans les classeurs
      const settings = await this.getSettings();
      const rootPath = settings.rootPath;
      const correctClasseurPath = path.join(rootPath, 'Classiflyer', 'All_Classeurs', classeur.name);
      fichierPath = path.join(correctClasseurPath, fichier.name);
    } else if (fichier.dossierId) {
      // Si c'est un fichier dans un dossier (classeur ou archive)
      const dossier = data.dossiers.find(d => d.id === fichier.dossierId);
      if (!dossier) {
        throw new Error('Dossier parent introuvable');
      }
      fichierPath = path.join(dossier.path, fichier.name);
    } else {
      throw new Error('Fichier doit être dans un classeur ou un dossier');
    }
    
    const newFichier: Fichier = {
      ...fichier,
      id: this.getNextId('fichiers'),
      path: fichierPath,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: undefined
    };

    data.fichiers.push(newFichier);
    await this.saveDatabase();

    // Note: Le fichier physique sera créé par le service de fichiers lors de l'upload
    // Ici on ne fait que créer l'enregistrement dans la base de données

    return newFichier;
  }

  async deleteFichier(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.fichiers.findIndex(f => f.id === id);
    
    if (index === -1) return false;

    // Soft delete
    data.fichiers[index].isDeleted = true;
    data.fichiers[index].deletedAt = new Date().toISOString();

    await this.saveDatabase();
    return true;
  }

  // Méthodes pour les dossiers d'archives
  async getArchiveFolders(): Promise<ArchiveFolder[]> {
    const data = await this.loadDatabase();
    return data.archiveFolders;
  }

  async createArchiveFolder(archiveFolder: Omit<ArchiveFolder, 'id' | 'createdAt'>): Promise<ArchiveFolder> {
    const data = await this.loadDatabase();
    
    // Construire le chemin physique dans rootPath/Archives/
    const settings = await this.getSettings();
    const archivePath = path.join(settings.rootPath, 'Classiflyer', 'Archives', archiveFolder.name);
    
    const newArchiveFolder: ArchiveFolder = {
      ...archiveFolder,
      id: this.getNextId('archiveFolders'),
      path: archivePath, // Chemin physique absolu
      createdAt: new Date().toISOString()
    };

    data.archiveFolders.push(newArchiveFolder);
    await this.saveDatabase();
    return newArchiveFolder;
  }

  async deleteArchiveFolder(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.archiveFolders.findIndex(af => af.id === id);
    
    if (index === -1) return false;

    data.archiveFolders.splice(index, 1);
    await this.saveDatabase();
    return true;
  }

  // Méthodes pour les paramètres
  async getSettings(): Promise<Settings> {
    const data = await this.loadDatabase();
    return data.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<boolean> {
    const data = await this.loadDatabase();
    data.settings = { ...data.settings, ...settings };
    await this.saveDatabase();
    return true;
  }

  // Méthodes pour la corbeille
  async getTrashClasseurs(): Promise<Classeur[]> {
    const data = await this.loadDatabase();
    return data.classeurs.filter(c => c.isDeleted);
  }

  async getTrashDossiers(): Promise<Dossier[]> {
    const data = await this.loadDatabase();
    return data.dossiers.filter(d => d.isDeleted);
  }

  async getTrashFichiers(): Promise<Fichier[]> {
    const data = await this.loadDatabase();
    return data.fichiers.filter(f => f.isDeleted);
  }

  async restoreClasseur(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.classeurs.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    data.classeurs[index].isDeleted = false;
    data.classeurs[index].deletedAt = undefined;

    await this.saveDatabase();
    return true;
  }

  async restoreDossier(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.dossiers.findIndex(d => d.id === id);
    
    if (index === -1) return false;

    data.dossiers[index].isDeleted = false;
    data.dossiers[index].deletedAt = undefined;

    await this.saveDatabase();
    return true;
  }

  async restoreFichier(id: number): Promise<boolean> {
    const data = await this.loadDatabase();
    const index = data.fichiers.findIndex(f => f.id === id);
    
    if (index === -1) return false;

    data.fichiers[index].isDeleted = false;
    data.fichiers[index].deletedAt = undefined;

    await this.saveDatabase();
    return true;
  }

  async emptyTrash(fileService?: any): Promise<void> {
    const data = await this.loadDatabase();
    
    // Supprimer physiquement les fichiers
    const fichiersSupprimes = data.fichiers.filter(f => f.isDeleted);
    for (const fichier of fichiersSupprimes) {
      try {
        if (fileService) {
          await fileService.deleteFile(fichier.path);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression physique du fichier ${fichier.path}:`, error);
      }
    }

    // Supprimer physiquement les dossiers
    const dossiersSupprimes = data.dossiers.filter(d => d.isDeleted);
    for (const dossier of dossiersSupprimes) {
      try {
        if (fileService) {
          await fileService.deleteDossier(dossier.path);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression physique du dossier ${dossier.path}:`, error);
      }
    }

    // Supprimer physiquement les classeurs
    const classeursSupprimes = data.classeurs.filter(c => c.isDeleted);
    for (const classeur of classeursSupprimes) {
      try {
        if (fileService) {
          await fileService.deleteClasseur(classeur.path);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression physique du classeur ${classeur.path}:`, error);
      }
    }

    // Supprimer de la base de données
    data.fichiers = data.fichiers.filter(f => !f.isDeleted);
    data.dossiers = data.dossiers.filter(d => !d.isDeleted);
    data.classeurs = data.classeurs.filter(c => !c.isDeleted);

    await this.saveDatabase();
  }

  // Méthode de recherche
  async searchAll(query: string): Promise<{ classeurs: Classeur[]; dossiers: Dossier[]; fichiers: Fichier[] }> {
    const data = await this.loadDatabase();
    const searchLower = query.toLowerCase();

    return {
      classeurs: data.classeurs.filter(c => 
        !c.isDeleted && !c.isArchived && c.name.toLowerCase().includes(searchLower)
      ),
      dossiers: data.dossiers.filter(d => 
        !d.isDeleted && d.name.toLowerCase().includes(searchLower)
      ),
      fichiers: data.fichiers.filter(f => 
        !f.isDeleted && f.name.toLowerCase().includes(searchLower)
      )
    };
  }

  // Méthodes pour les dossiers d'archives
  async getDossiersByArchiveFolder(archiveFolderId: number): Promise<Dossier[]> {
    const data = await this.loadDatabase();
    return data.dossiers.filter(d => 
      d.parentId === archiveFolderId && !d.classeurId && !d.isDeleted
    );
  }

  // Méthode générique pour récupérer tous les sous-dossiers d'un dossier (hiérarchie infinie)
  async getSubDossiers(parentId: number): Promise<Dossier[]> {
    const data = await this.loadDatabase();
    return data.dossiers.filter(d => 
      d.parentId === parentId && !d.isDeleted
    );
  }

  async getFichiersByArchiveFolder(archiveFolderId: number): Promise<Fichier[]> {
    const data = await this.loadDatabase();
    return data.fichiers.filter(f => 
      f.dossierId === archiveFolderId && !f.classeurId && !f.isDeleted
    );
  }


  // Méthodes pour compter les fichiers et dossiers par classeur
  async getClasseurStats(classeurId: number): Promise<{ files: number; folders: number }> {
    const data = await this.loadDatabase();
    
    // Compter les fichiers directement dans le classeur
    const filesInClasseur = data.fichiers.filter(f => 
      f.classeurId === classeurId && !f.dossierId && !f.isDeleted
    ).length;
    
    // Compter les dossiers racines du classeur
    const foldersInClasseur = data.dossiers.filter(d => 
      d.classeurId === classeurId && !d.parentId && !d.isDeleted
    ).length;
    
    return {
      files: filesInClasseur,
      folders: foldersInClasseur
    };
  }

  async close(): Promise<void> {
    this.data = null;
  }
}
