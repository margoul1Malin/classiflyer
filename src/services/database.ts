import { app } from 'electron';
import path from 'path';

export interface Classeur {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  path: string;
  isArchived: boolean;
  archiveFolder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dossier {
  id: number;
  classeurId: number;
  name: string; 
  path: string;
  parentId?: number;
  createdAt: string;
}

export interface Fichier {
  id: number;
  dossierId: number;
  name: string;
  path: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface ArchiveFolder {
  id: number;
  name: string;
  path: string;
  createdAt: string;
}

class DatabaseService {
  private db: any = null;

  private async getDatabase() {
    if (!this.db) {
      try {
        const Database = (await import('better-sqlite3')).default;
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'classiflyer.db');
        this.db = new Database(dbPath);
        await this.initTables();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
      }
    }
    return this.db;
  }

  private async initTables() {
    const db = await this.getDatabase();
    
    // Table des classeurs
    db.exec(`
      CREATE TABLE IF NOT EXISTS classeurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        primaryColor TEXT NOT NULL,
        secondaryColor TEXT NOT NULL,
        path TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrations pour ajouter les colonnes d'archivage et de suppression
    this.migrateClasseursTable(db);
    this.migrateDossiersTable(db);
    this.migrateFichiersTable(db);

    // Table des dossiers
    db.exec(`
      CREATE TABLE IF NOT EXISTS dossiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classeurId INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        parentId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classeurId) REFERENCES classeurs (id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES dossiers (id) ON DELETE CASCADE
      )
    `);

    // Table des fichiers
    db.exec(`
      CREATE TABLE IF NOT EXISTS fichiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dossierId INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dossierId) REFERENCES dossiers (id) ON DELETE CASCADE
      )
    `);

    // Table des paramètres
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Table des dossiers d'archives
    db.exec(`
      CREATE TABLE IF NOT EXISTS archive_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private migrateClasseursTable(db: any) {
    try {
      // Vérifier si la table existe
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='classeurs'
      `).get();

      if (!tableExists) {
        console.log('Table classeurs n\'existe pas, création...');
        return; // La table sera créée par initTables
      }

      // Vérifier si les colonnes existent
      const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
      const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
      const hasArchiveFolder = tableInfo.some((column: any) => column.name === 'archiveFolder');
      const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
      const hasDeletedAt = tableInfo.some((column: any) => column.name === 'deletedAt');

      // Ajouter la colonne isArchived si elle n'existe pas
      if (!hasIsArchived) {
        db.exec('ALTER TABLE classeurs ADD COLUMN isArchived BOOLEAN DEFAULT FALSE');
        console.log('Migration: Colonne isArchived ajoutée');
      }

      // Ajouter la colonne archiveFolder si elle n'existe pas
      if (!hasArchiveFolder) {
        db.exec('ALTER TABLE classeurs ADD COLUMN archiveFolder TEXT');
        console.log('Migration: Colonne archiveFolder ajoutée');
      }

      // Ajouter la colonne isDeleted si elle n'existe pas
      if (!hasIsDeleted) {
        db.exec('ALTER TABLE classeurs ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE');
        console.log('Migration: Colonne isDeleted ajoutée');
      }

      // Ajouter la colonne deletedAt si elle n'existe pas
      if (!hasDeletedAt) {
        db.exec('ALTER TABLE classeurs ADD COLUMN deletedAt DATETIME');
        console.log('Migration: Colonne deletedAt ajoutée');
      }
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  }

  private migrateDossiersTable(db: any) {
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='dossiers'
      `).get();

      if (!tableExists) return;

      const tableInfo = db.prepare("PRAGMA table_info(dossiers)").all();
      const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
      const hasDeletedAt = tableInfo.some((column: any) => column.name === 'deletedAt');

      if (!hasIsDeleted) {
        db.exec('ALTER TABLE dossiers ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE');
        console.log('Migration: Colonne isDeleted ajoutée à dossiers');
      }

      if (!hasDeletedAt) {
        db.exec('ALTER TABLE dossiers ADD COLUMN deletedAt DATETIME');
        console.log('Migration: Colonne deletedAt ajoutée à dossiers');
      }
    } catch (error) {
      console.error('Erreur lors de la migration des dossiers:', error);
    }
  }

  private migrateFichiersTable(db: any) {
    try {
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='fichiers'
      `).get();

      if (!tableExists) return;

      const tableInfo = db.prepare("PRAGMA table_info(fichiers)").all();
      const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
      const hasDeletedAt = tableInfo.some((column: any) => column.name === 'deletedAt');

      if (!hasIsDeleted) {
        db.exec('ALTER TABLE fichiers ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE');
        console.log('Migration: Colonne isDeleted ajoutée à fichiers');
      }

      if (!hasDeletedAt) {
        db.exec('ALTER TABLE fichiers ADD COLUMN deletedAt DATETIME');
        console.log('Migration: Colonne deletedAt ajoutée à fichiers');
      }
    } catch (error) {
      console.error('Erreur lors de la migration des fichiers:', error);
    }
  }

  // Méthodes pour les classeurs
  async createClasseur(classeur: Omit<Classeur, 'id' | 'createdAt' | 'updatedAt'>): Promise<Classeur> {
    console.log('=== CRÉATION CLASSEUR ===');
    console.log('Données reçues:', JSON.stringify(classeur, null, 2));
    
    const db = await this.getDatabase();
    
    // Générer un path si vide
    const path = classeur.path || `/classeurs/${classeur.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    console.log('Path généré:', path);
    
    // Vérifier si les colonnes d'archivage existent
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    console.log('Structure de la table classeurs:', tableInfo);
    
    const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
    const hasArchiveFolder = tableInfo.some((column: any) => column.name === 'archiveFolder');
    
    console.log('Colonnes d\'archivage:', { hasIsArchived, hasArchiveFolder });
    
    let stmt;
    let result;
    
    if (hasIsArchived && hasArchiveFolder) {
      // Table avec colonnes d'archivage
      console.log('Utilisation du schéma avec colonnes d\'archivage');
      stmt = db.prepare(`
        INSERT INTO classeurs (name, primaryColor, secondaryColor, path, isArchived, archiveFolder)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const values = [
        classeur.name, 
        classeur.primaryColor, 
        classeur.secondaryColor, 
        path,
        classeur.isArchived ? 1 : 0, // Convertir boolean en integer pour SQLite
        classeur.archiveFolder || null
      ];
      
      console.log('Valeurs à insérer:', values);
      console.log('Types des valeurs:', values.map(v => typeof v));
      
      result = stmt.run(...values);
    } else {
      // Table sans colonnes d'archivage (ancienne version)
      console.log('Utilisation du schéma sans colonnes d\'archivage');
      stmt = db.prepare(`
        INSERT INTO classeurs (name, primaryColor, secondaryColor, path)
        VALUES (?, ?, ?, ?)
      `);
      
      const values = [
        classeur.name, 
        classeur.primaryColor, 
        classeur.secondaryColor, 
        path
      ];
      
      console.log('Valeurs à insérer:', values);
      console.log('Types des valeurs:', values.map(v => typeof v));
      
      result = stmt.run(...values);
    }
    
    console.log('Résultat de l\'insertion:', result);
    
    const newClasseur = await this.getClasseur(result.lastInsertRowid as number);
    if (!newClasseur) {
      throw new Error('Erreur lors de la création du classeur');
    }
    
    // Créer automatiquement un dossier racine pour ce classeur
    try {
      await this.createDossier({
        classeurId: newClasseur.id,
        name: 'Racine',
        path: path,
        parentId: null
      });
      console.log('Dossier racine créé pour le classeur:', newClasseur.name);
    } catch (error) {
      console.error('Erreur lors de la création du dossier racine:', error);
      // Ne pas faire échouer la création du classeur si le dossier racine échoue
    }
    
    console.log('Classeur créé avec succès:', newClasseur);
    return newClasseur;
  }

  async getClasseurs(): Promise<Classeur[]> {
    const db = await this.getDatabase();

    // Vérifier si les colonnes existent
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');

    let stmt;
    if (hasIsArchived && hasIsDeleted) {
      stmt = db.prepare('SELECT * FROM classeurs WHERE isArchived = FALSE AND isDeleted = FALSE ORDER BY updatedAt DESC');
    } else if (hasIsArchived) {
      stmt = db.prepare('SELECT * FROM classeurs WHERE isArchived = FALSE ORDER BY updatedAt DESC');
    } else {
      stmt = db.prepare('SELECT *, FALSE as isArchived, NULL as archiveFolder, FALSE as isDeleted, NULL as deletedAt FROM classeurs ORDER BY updatedAt DESC');
    }

    return stmt.all() as Classeur[];
  }

  async getArchivedClasseurs(): Promise<Classeur[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isArchived existe
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
    const hasArchiveFolder = tableInfo.some((column: any) => column.name === 'archiveFolder');
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    if (!hasIsArchived) {
      // Si la colonne n'existe pas, retourner un tableau vide
      console.log('Colonne isArchived n\'existe pas encore');
      return [];
    }
    
    let stmt;
    if (hasIsArchived && hasIsDeleted) {
      stmt = db.prepare('SELECT * FROM classeurs WHERE isArchived = TRUE AND isDeleted = FALSE ORDER BY updatedAt DESC');
    } else {
      stmt = db.prepare('SELECT * FROM classeurs WHERE isArchived = TRUE ORDER BY updatedAt DESC');
    }
    
    const result = stmt.all() as Classeur[];
    
    // Ajouter les colonnes manquantes si nécessaire
    return result.map((classeur: any) => ({
      ...classeur,
      archiveFolder: hasArchiveFolder ? classeur.archiveFolder : undefined,
      isDeleted: hasIsDeleted ? classeur.isDeleted : false
    }));
  }

  async getClasseur(id: number): Promise<Classeur | null> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isArchived existe
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
    
    let stmt;
    if (hasIsArchived) {
      stmt = db.prepare('SELECT * FROM classeurs WHERE id = ?');
    } else {
      stmt = db.prepare('SELECT *, FALSE as isArchived, NULL as archiveFolder FROM classeurs WHERE id = ?');
    }
    
    return stmt.get(id) as Classeur | null;
  }

  async updateClasseur(id: number, updates: Partial<Pick<Classeur, 'name' | 'primaryColor' | 'secondaryColor' | 'updatedAt'>>): Promise<boolean> {
    const db = await this.getDatabase();
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = db.prepare(`UPDATE classeurs SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    
    return result.changes > 0;
  }

  async deleteClasseur(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    let result;
    if (hasIsDeleted) {
      // Suppression logicielle
      const stmt = db.prepare('UPDATE classeurs SET isDeleted = TRUE, deletedAt = CURRENT_TIMESTAMP WHERE id = ?');
      result = stmt.run(id);
    } else {
      // Suppression physique (fallback pour les anciennes tables)
      const stmt = db.prepare('DELETE FROM classeurs WHERE id = ?');
      result = stmt.run(id);
    }
    
    return result.changes > 0;
  }

  // Méthodes pour les dossiers
  async createDossier(dossier: Omit<Dossier, 'id' | 'createdAt'>): Promise<Dossier> {
    const db = await this.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO dossiers (classeurId, name, path, parentId)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(dossier.classeurId, dossier.name, dossier.path, dossier.parentId);
    
    const newDossier = await this.getDossier(result.lastInsertRowid as number);
    if (!newDossier) {
      throw new Error('Erreur lors de la création du dossier');
    }
    return newDossier;
  }

  async getDossiersByClasseur(classeurId: number, parentId: number | null = null): Promise<Dossier[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(dossiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    let stmt;
    if (hasIsDeleted) {
      stmt = db.prepare('SELECT * FROM dossiers WHERE classeurId = ? AND parentId IS ? AND isDeleted = FALSE ORDER BY name');
    } else {
      stmt = db.prepare('SELECT * FROM dossiers WHERE classeurId = ? AND parentId IS ? ORDER BY name');
    }
    
    return stmt.all(classeurId, parentId) as Dossier[];
  }

  async getDossier(id: number): Promise<Dossier | null> {
    const db = await this.getDatabase();
    const stmt = db.prepare('SELECT * FROM dossiers WHERE id = ?');
    return stmt.get(id) as Dossier | null;
  }

  // Méthodes pour les fichiers
  async createFichier(fichier: Omit<Fichier, 'id' | 'createdAt'>): Promise<Fichier> {
    const db = await this.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO fichiers (dossierId, name, path, type, size)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(fichier.dossierId, fichier.name, fichier.path, fichier.type, fichier.size);
    
    const newFichier = await this.getFichier(result.lastInsertRowid as number);
    if (!newFichier) {
      throw new Error('Erreur lors de la création du fichier');
    }
    return newFichier;
  }

  async getFichiersByDossier(dossierId: number): Promise<Fichier[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(fichiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    let stmt;
    if (hasIsDeleted) {
      stmt = db.prepare('SELECT * FROM fichiers WHERE dossierId = ? AND isDeleted = FALSE ORDER BY name');
    } else {
      stmt = db.prepare('SELECT * FROM fichiers WHERE dossierId = ? ORDER BY name');
    }
    
    return stmt.all(dossierId) as Fichier[];
  }

  async getFichier(id: number): Promise<Fichier | null> {
    const db = await this.getDatabase();
    const stmt = db.prepare('SELECT * FROM fichiers WHERE id = ?');
    return stmt.get(id) as Fichier | null;
  }

  async deleteDossier(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(dossiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    let result;
    if (hasIsDeleted) {
      // Suppression logicielle
      const stmt = db.prepare('UPDATE dossiers SET isDeleted = TRUE, deletedAt = CURRENT_TIMESTAMP WHERE id = ?');
      result = stmt.run(id);
    } else {
      // Suppression physique (fallback pour les anciennes tables)
      const stmt = db.prepare('DELETE FROM dossiers WHERE id = ?');
      result = stmt.run(id);
    }
    
    return result.changes > 0;
  }

  async deleteFichier(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(fichiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    let result;
    if (hasIsDeleted) {
      // Suppression logicielle
      const stmt = db.prepare('UPDATE fichiers SET isDeleted = TRUE, deletedAt = CURRENT_TIMESTAMP WHERE id = ?');
      result = stmt.run(id);
    } else {
      // Suppression physique (fallback pour les anciennes tables)
      const stmt = db.prepare('DELETE FROM fichiers WHERE id = ?');
      result = stmt.run(id);
    }
    
    return result.changes > 0;
  }

  // Méthodes pour les paramètres
  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.getDatabase();
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  }

  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDatabase();
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | null;
    return result?.value || null;
  }

  // Méthodes pour l'archivage
  async archiveClasseur(id: number, archiveFolder?: string): Promise<boolean> {
    const db = await this.getDatabase();
    
    // Vérifier si les colonnes existent
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsArchived = tableInfo.some((column: any) => column.name === 'isArchived');
    const hasArchiveFolder = tableInfo.some((column: any) => column.name === 'archiveFolder');
    
    if (!hasIsArchived) {
      console.error('Colonne isArchived n\'existe pas - migration nécessaire');
      return false;
    }
    
    // Si c'est "Archives principales", stocker null au lieu du nom
    const finalArchiveFolder = (archiveFolder === 'Archives principales') ? null : archiveFolder;
    
    let stmt;
    if (hasArchiveFolder) {
      stmt = db.prepare('UPDATE classeurs SET isArchived = TRUE, archiveFolder = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(finalArchiveFolder || null, id);
      return result.changes > 0;
    } else {
      stmt = db.prepare('UPDATE classeurs SET isArchived = TRUE, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    }
  }

  async unarchiveClasseur(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const stmt = db.prepare('UPDATE classeurs SET isArchived = FALSE, archiveFolder = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Méthodes pour les dossiers d'archives
  async createArchiveFolder(archiveFolder: Omit<ArchiveFolder, 'id' | 'createdAt'>): Promise<ArchiveFolder> {
    const db = await this.getDatabase();
    const stmt = db.prepare('INSERT INTO archive_folders (name, path) VALUES (?, ?)');
    const result = stmt.run(archiveFolder.name, archiveFolder.path);
    
    const newArchiveFolder = await this.getArchiveFolder(result.lastInsertRowid as number);
    if (!newArchiveFolder) {
      throw new Error('Erreur lors de la création du dossier d\'archive');
    }
    return newArchiveFolder;
  }

  async getArchiveFolders(): Promise<ArchiveFolder[]> {
    const db = await this.getDatabase();
    const stmt = db.prepare('SELECT * FROM archive_folders ORDER BY name');
    return stmt.all() as ArchiveFolder[];
  }

  async getArchiveFolder(id: number): Promise<ArchiveFolder | null> {
    const db = await this.getDatabase();
    const stmt = db.prepare('SELECT * FROM archive_folders WHERE id = ?');
    return stmt.get(id) as ArchiveFolder | null;
  }

  async deleteArchiveFolder(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const stmt = db.prepare('DELETE FROM archive_folders WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Méthodes de recherche universelle
  async searchAll(query: string): Promise<{
    classeurs: Classeur[];
    dossiers: Dossier[];
    fichiers: Fichier[];
  }> {
    const db = await this.getDatabase();
    const searchTerm = `%${query}%`;

    const classeursStmt = db.prepare('SELECT * FROM classeurs WHERE name LIKE ?');
    const classeurs = classeursStmt.all(searchTerm) as Classeur[];

    const dossiersStmt = db.prepare('SELECT * FROM dossiers WHERE name LIKE ?');
    const dossiers = dossiersStmt.all(searchTerm) as Dossier[];

    const fichiersStmt = db.prepare('SELECT * FROM fichiers WHERE name LIKE ?');
    const fichiers = fichiersStmt.all(searchTerm) as Fichier[];

    return { classeurs, dossiers, fichiers };
  }

  // Méthodes pour la corbeille
  async getTrashClasseurs(): Promise<Classeur[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    if (!hasIsDeleted) {
      return []; // Pas de corbeille si la colonne n'existe pas
    }
    
    const stmt = db.prepare('SELECT * FROM classeurs WHERE isDeleted = TRUE ORDER BY deletedAt DESC');
    return stmt.all() as Classeur[];
  }

  async getTrashDossiers(): Promise<Dossier[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(dossiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    if (!hasIsDeleted) {
      return []; // Pas de corbeille si la colonne n'existe pas
    }
    
    const stmt = db.prepare('SELECT * FROM dossiers WHERE isDeleted = TRUE ORDER BY deletedAt DESC');
    return stmt.all() as Dossier[];
  }

  async getTrashFichiers(): Promise<Fichier[]> {
    const db = await this.getDatabase();
    
    // Vérifier si la colonne isDeleted existe
    const tableInfo = db.prepare("PRAGMA table_info(fichiers)").all();
    const hasIsDeleted = tableInfo.some((column: any) => column.name === 'isDeleted');
    
    if (!hasIsDeleted) {
      return []; // Pas de corbeille si la colonne n'existe pas
    }
    
    const stmt = db.prepare('SELECT * FROM fichiers WHERE isDeleted = TRUE ORDER BY deletedAt DESC');
    return stmt.all() as Fichier[];
  }

  async restoreClasseur(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const stmt = db.prepare('UPDATE classeurs SET isDeleted = FALSE, deletedAt = NULL WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async restoreDossier(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const stmt = db.prepare('UPDATE dossiers SET isDeleted = FALSE, deletedAt = NULL WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async restoreFichier(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const stmt = db.prepare('UPDATE fichiers SET isDeleted = FALSE, deletedAt = NULL WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async emptyTrash(fileService?: any): Promise<void> {
    const db = await this.getDatabase();
    
    // Vérifier si les colonnes existent
    const classeursInfo = db.prepare("PRAGMA table_info(classeurs)").all();
    const dossiersInfo = db.prepare("PRAGMA table_info(dossiers)").all();
    const fichiersInfo = db.prepare("PRAGMA table_info(fichiers)").all();
    
    const hasClasseursDeleted = classeursInfo.some((column: any) => column.name === 'isDeleted');
    const hasDossiersDeleted = dossiersInfo.some((column: any) => column.name === 'isDeleted');
    const hasFichiersDeleted = fichiersInfo.some((column: any) => column.name === 'isDeleted');
    
    // Supprimer physiquement les fichiers avant de supprimer les enregistrements de la DB
    if (hasFichiersDeleted && fileService) {
      const fichiersSupprimes = db.prepare('SELECT path FROM fichiers WHERE isDeleted = TRUE').all() as { path: string }[];
      
      for (const fichier of fichiersSupprimes) {
        try {
          await fileService.deleteFile(fichier.path);
        } catch (error) {
          console.error(`Erreur lors de la suppression physique du fichier ${fichier.path}:`, error);
        }
      }
    }
    
    // Supprimer physiquement les dossiers avant de supprimer les enregistrements de la DB
    if (hasDossiersDeleted && fileService) {
      const dossiersSupprimes = db.prepare('SELECT path FROM dossiers WHERE isDeleted = TRUE').all() as { path: string }[];
      
      for (const dossier of dossiersSupprimes) {
        try {
          await fileService.deleteDossier(dossier.path);
        } catch (error) {
          console.error(`Erreur lors de la suppression physique du dossier ${dossier.path}:`, error);
        }
      }
    }
    
    // Supprimer physiquement les classeurs avant de supprimer les enregistrements de la DB
    if (hasClasseursDeleted && fileService) {
      const classeursSupprimes = db.prepare('SELECT path FROM classeurs WHERE isDeleted = TRUE').all() as { path: string }[];
      
      for (const classeur of classeursSupprimes) {
        try {
          await fileService.deleteClasseur(classeur.path);
        } catch (error) {
          console.error(`Erreur lors de la suppression physique du classeur ${classeur.path}:`, error);
        }
      }
    }
    
    // Supprimer définitivement tous les éléments de la corbeille de la base de données
    if (hasClasseursDeleted) {
      db.prepare('DELETE FROM classeurs WHERE isDeleted = TRUE').run();
    }
    
    if (hasDossiersDeleted) {
      db.prepare('DELETE FROM dossiers WHERE isDeleted = TRUE').run();
    }
    
    if (hasFichiersDeleted) {
      db.prepare('DELETE FROM fichiers WHERE isDeleted = TRUE').run();
    }
  }

  // Méthodes pour les dossiers d'archives
  async getDossiersByArchiveFolder(archiveFolderId: number): Promise<Dossier[]> {
    const db = await this.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM dossiers 
      WHERE parentId = ? AND classeurId IS NULL
      ORDER BY name ASC
    `);
    return stmt.all(archiveFolderId);
  }

  async getFichiersByArchiveFolder(archiveFolderId: number): Promise<Fichier[]> {
    const db = await this.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM fichiers 
      WHERE dossierId = ? AND classeurId IS NULL
      ORDER BY name ASC
    `);
    return stmt.all(archiveFolderId);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const dbService = new DatabaseService();