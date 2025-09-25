import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { JsonDatabaseService } from './services/jsonDatabase';
import { FileService } from './services/fileService';

// Services
let fileService: FileService;
let dbService: JsonDatabaseService;

// Initialiser les services
const initializeServices = async () => {
  // Utiliser un chemin par défaut d'abord
  const defaultPath = path.join(app.getPath('documents'), 'Classiflyer');
  
  try {
    // Initialiser le service de base de données JSON
    dbService = new JsonDatabaseService(defaultPath);
    
    // Essayer de récupérer le chemin depuis les paramètres
    const settings = await dbService.getSettings();
    const rootPath = settings.rootPath || defaultPath;
    
    // Réinitialiser le service de base de données avec le bon chemin
    if (settings.rootPath && settings.rootPath !== defaultPath) {
      dbService = new JsonDatabaseService(settings.rootPath);
    }
    
    // Le service de fichiers pointe vers le dossier Classiflyer
    const classiflyerPath = path.join(rootPath, 'Classiflyer');
    fileService = new FileService(classiflyerPath);
    await fileService.initializeRootPath();
    
    // Si aucun chemin n'était sauvegardé, le sauvegarder maintenant
    if (!settings.rootPath) {
      await dbService.updateSettings({ rootPath });
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des services:', error);
    // Fallback vers le chemin par défaut
    dbService = new JsonDatabaseService(defaultPath);
    const classiflyerPath = path.join(defaultPath, 'Classiflyer');
    fileService = new FileService(classiflyerPath);
    await fileService.initializeRootPath();
  }
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  // En mode développement, charger depuis le serveur Vite
  // En mode production, charger depuis les fichiers locaux
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // En mode production, charger le fichier HTML depuis l'ASAR
    mainWindow.loadFile(path.join(__dirname, '../.vite/renderer/main_window/index.html'));
  }

  // Open the DevTools only in development mode.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers pour la communication avec le renderer
ipcMain.handle('get-classeurs', async () => {
  try {
    return await dbService.getClasseurs();
  } catch (error) {
    console.error('Erreur lors de la récupération des classeurs:', error);
    return [];
  }
});

ipcMain.handle('get-classeur', async (event, id) => {
  try {
    return await dbService.getClasseur(id);
  } catch (error) {
    console.error('Erreur lors de la récupération du classeur:', error);
    return null;
  }
});

ipcMain.handle('create-classeur', async (event, classeur) => {
  try {
    // Récupérer le chemin racine depuis les paramètres
    const settings = await dbService.getSettings();
    const rootPath = settings.rootPath;
    
    // Créer le dossier physique dans All_Classeurs
    const classeurPath = path.join(rootPath, 'Classiflyer', 'All_Classeurs', classeur.name);
    
    // Créer le dossier physique directement (plus de fileService.createClasseur)
    const fs = await import('fs');
    await fs.promises.mkdir(classeurPath, { recursive: true });

    // Créer l'enregistrement dans la base de données
    return await dbService.createClasseur({
      ...classeur,
      path: classeurPath
    });
  } catch (error) {
    console.error('Erreur lors de la création du classeur:', error);
    throw error;
  }
});

ipcMain.handle('update-classeur', async (event, id, updates) => {
  try {
    return await dbService.updateClasseur(id, updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du classeur:', error);
    throw error;
  }
});

// Handlers pour les dossiers
ipcMain.handle('create-dossier', async (event, dossier) => {
  try {
    // Créer l'enregistrement dans la DB
    const result = await dbService.createDossier(dossier);
    
    // Créer le dossier physique
    const fs = await import('fs');
    await fs.promises.mkdir(result.path, { recursive: true });
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    throw error;
  }
});

ipcMain.handle('get-dossiers-by-classeur', async (event, classeurId, parentId) => {
  try {
    return await dbService.getDossiersByClasseur(classeurId, parentId);
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    throw error;
  }
});

ipcMain.handle('delete-dossier', async (event, id) => {
  try {
    // Récupérer le dossier avant suppression
    const dossier = await dbService.getDossier(id);
    
    if (dossier) {
      const settings = await dbService.getSettings();
      const rootPath = settings.rootPath;
      const junkPath = path.join(rootPath, 'Classiflyer', 'Junk', 'Dossiers', dossier.name);
      
      const fs = await import('fs');
      
      // Créer le dossier de destination dans la corbeille
      await fs.promises.mkdir(path.dirname(junkPath), { recursive: true });
      
      // Vérifier si le dossier existe avant de le déplacer
      let sourcePath = dossier.path;
      
      // Vérifier que le dossier source existe
      try {
        await fs.promises.access(sourcePath);
        
        // Déplacer le dossier vers la corbeille
        try {
          await fs.promises.rename(sourcePath, junkPath);
        } catch (renameError) {
          // Si le déplacement échoue, copier puis supprimer
          await fs.promises.cp(sourcePath, junkPath, { recursive: true });
          await fs.promises.rm(sourcePath, { recursive: true, force: true });
        }
      } catch (accessError) {
        console.log('Le dossier source n\'existe pas, suppression de la DB uniquement:', sourcePath);
        // Le dossier physique n'existe pas, on supprime juste de la DB
      }
    }
    
    return await dbService.deleteDossier(id);
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    throw error;
  }
});

ipcMain.handle('get-dossiers-by-archive-folder', async (event, archiveFolderId) => {
  try {
    return await dbService.getDossiersByArchiveFolder(archiveFolderId);
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-dossiers:', error);
    throw error;
  }
});

ipcMain.handle('get-all-dossiers', async () => {
  try {
    return await dbService.getAllDossiers();
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les dossiers:', error);
    throw error;
  }
});

ipcMain.handle('get-sub-dossiers', async (event, parentId) => {
  try {
    return await dbService.getSubDossiers(parentId);
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-dossiers:', error);
    throw error;
  }
});

ipcMain.handle('get-fichiers-by-archive-folder', async (event, archiveFolderId) => {
  try {
    return await dbService.getFichiersByArchiveFolder(archiveFolderId);
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    throw error;
  }
});

ipcMain.handle('get-classeur-stats', async (event, classeurId) => {
  try {
    return await dbService.getClasseurStats(classeurId);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du classeur:', error);
    throw error;
  }
});

// Handlers pour les fichiers
ipcMain.handle('create-fichier', async (event, fichier) => {
  try {
    // Créer l'enregistrement dans la DB
    const result = await dbService.createFichier(fichier);
    
    // Note: Le fichier physique sera créé par l'upload-file handler
    // Ici on ne fait que créer l'enregistrement dans la base de données
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la création du fichier:', error);
    throw error;
  }
});

ipcMain.handle('get-fichiers-by-dossier', async (event, dossierId) => {
  try {
    return await dbService.getFichiersByDossier(dossierId);
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    throw error;
  }
});

ipcMain.handle('get-fichiers-by-classeur', async (event, classeurId) => {
  try {
    return await dbService.getFichiersByClasseur(classeurId);
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers du classeur:', error);
    throw error;
  }
});

ipcMain.handle('delete-fichier', async (event, id) => {
  try {
    // Récupérer le fichier avant suppression
    const fichier = await dbService.getFichier(id);
    
    if (fichier) {
      const settings = await dbService.getSettings();
      const rootPath = settings.rootPath;
      const junkPath = path.join(rootPath, 'Classiflyer', 'Junk', 'Fichiers', fichier.name);
      
      const fs = await import('fs');
      
      // Créer le dossier de destination dans la corbeille
      await fs.promises.mkdir(path.dirname(junkPath), { recursive: true });
      
      // Construire le chemin absolu si c'est un chemin relatif
      let sourcePath = fichier.path;
      if (!path.isAbsolute(sourcePath)) {
        sourcePath = path.join(rootPath, 'Classiflyer', sourcePath);
      }
      
      // Vérifier que le fichier source existe
      try {
        await fs.promises.access(sourcePath);
        
        // Déplacer le fichier vers la corbeille
        try {
          await fs.promises.rename(sourcePath, junkPath);
        } catch (renameError) {
          // Si le déplacement échoue, copier puis supprimer
          await fs.promises.copyFile(sourcePath, junkPath);
          await fs.promises.unlink(sourcePath);
        }
      } catch (accessError) {
        console.log('Le fichier source n\'existe pas, suppression de la DB uniquement:', sourcePath);
        // Le fichier physique n'existe pas, on supprime juste de la DB
      }
    }
    
    return await dbService.deleteFichier(id);
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    throw error;
  }
});

// Handlers pour la corbeille
ipcMain.handle('get-trash-classeurs', async () => {
  try {
    return await dbService.getTrashClasseurs();
  } catch (error) {
    console.error('Erreur lors de la récupération des classeurs de la corbeille:', error);
    throw error;
  }
});

ipcMain.handle('get-trash-dossiers', async () => {
  try {
    return await dbService.getTrashDossiers();
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers de la corbeille:', error);
    throw error;
  }
});

ipcMain.handle('get-trash-fichiers', async () => {
  try {
    return await dbService.getTrashFichiers();
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers de la corbeille:', error);
    throw error;
  }
});

ipcMain.handle('restore-classeur', async (event, id) => {
  try {
    return await dbService.restoreClasseur(id);
  } catch (error) {
    console.error('Erreur lors de la restauration du classeur:', error);
    throw error;
  }
});

ipcMain.handle('restore-dossier', async (event, id) => {
  try {
    return await dbService.restoreDossier(id);
  } catch (error) {
    console.error('Erreur lors de la restauration du dossier:', error);
    throw error;
  }
});

ipcMain.handle('restore-fichier', async (event, id) => {
  try {
    return await dbService.restoreFichier(id);
  } catch (error) {
    console.error('Erreur lors de la restauration du fichier:', error);
    throw error;
  }
});

ipcMain.handle('empty-trash', async () => {
  try {
    await dbService.emptyTrash(fileService);
  } catch (error) {
    console.error('Erreur lors du vidage de la corbeille:', error);
    throw error;
  }
});

ipcMain.handle('archive-classeur', async (event, id, archiveFolder?: string) => {
  try {
    const classeur = await dbService.getClasseur(id);
    
    if (classeur) {
      // Déplacer physiquement vers les archives
      const settings = await dbService.getSettings();
      const rootPath = settings.rootPath;
      
      let archivePath: string;
      if (archiveFolder) {
        // Créer le chemin dans le dossier d'archive spécifique
        archivePath = path.join(rootPath, 'Classiflyer', 'Archives', archiveFolder, classeur.name);
      } else {
        // Créer le chemin dans le dossier d'archives général
        archivePath = path.join(rootPath, 'Classiflyer', 'Archives', 'General', classeur.name);
      }
      
      const fs = await import('fs');
      
      // Créer le dossier de destination dans les archives
      await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });
      
      // Déplacer le classeur vers les archives
      try {
        await fs.promises.rename(classeur.path, archivePath);
      } catch (renameError) {
        // Si le déplacement échoue, copier puis supprimer
        await fs.promises.cp(classeur.path, archivePath, { recursive: true });
        await fs.promises.rm(classeur.path, { recursive: true, force: true });
      }
      
      // Mettre à jour le chemin dans la DB
      await dbService.updateClasseur(id, {
        name: classeur.name,
        primaryColor: classeur.primaryColor,
        secondaryColor: classeur.secondaryColor
      });
    }
    
    return await dbService.archiveClasseur(id, archiveFolder);
  } catch (error) {
    console.error('Erreur lors de l\'archivage du classeur:', error);
    throw error;
  }
});

ipcMain.handle('delete-classeur', async (event, id) => {
  try {
    const classeur = await dbService.getClasseur(id);
    if (classeur) {
      const settings = await dbService.getSettings();
      const rootPath = settings.rootPath;
      const junkPath = path.join(rootPath, 'Classiflyer', 'Junk', 'Classeurs', classeur.name);
      
      const fs = await import('fs');
      
      // Créer le dossier de destination dans la corbeille
      await fs.promises.mkdir(path.dirname(junkPath), { recursive: true });
      
      // Vérifier si le dossier existe avant de le déplacer
      let sourcePath = classeur.path;
      
      // Si le chemin dans la DB est l'ancien chemin, essayer le nouveau chemin
      if (!sourcePath.includes('All_Classeurs')) {
        const newPath = path.join(rootPath, 'Classiflyer', 'All_Classeurs', classeur.name);
        try {
          await fs.promises.access(newPath);
          sourcePath = newPath;
          console.log('Utilisation du nouveau chemin:', newPath);
        } catch {
          // Le nouveau chemin n'existe pas, utiliser l'ancien
          console.log('Utilisation de l\'ancien chemin:', sourcePath);
        }
      }
      
      // Vérifier que le dossier source existe
      try {
        await fs.promises.access(sourcePath);
        
        // Déplacer le dossier vers la corbeille
        try {
          await fs.promises.rename(sourcePath, junkPath);
        } catch (renameError) {
          // Si le déplacement échoue, copier puis supprimer
          await fs.promises.cp(sourcePath, junkPath, { recursive: true });
          await fs.promises.rm(sourcePath, { recursive: true, force: true });
        }
      } catch (accessError) {
        console.log('Le dossier source n\'existe pas, suppression de la DB uniquement:', sourcePath);
        // Le dossier physique n'existe pas, on supprime juste de la DB
      }
    }
    return await dbService.deleteClasseur(id);
  } catch (error) {
    console.error('Erreur lors de la suppression du classeur:', error);
    throw error;
  }
});

ipcMain.handle('get-archived-classeurs', async () => {
  try {
    return await dbService.getArchivedClasseurs();
  } catch (error) {
    console.error('Erreur lors de la récupération des classeurs archivés:', error);
    throw error;
  }
});

ipcMain.handle('unarchive-classeur', async (event, id) => {
  try {
    return await dbService.unarchiveClasseur(id);
  } catch (error) {
    console.error('Erreur lors du désarchivage du classeur:', error);
    throw error;
  }
});

ipcMain.handle('get-archive-folders', async () => {
  try {
    return await dbService.getArchiveFolders();
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers d\'archives:', error);
    throw error;
  }
});

ipcMain.handle('create-archive-folder', async (event, archiveFolder) => {
  try {
    // Créer l'enregistrement dans la DB
    const result = await dbService.createArchiveFolder(archiveFolder);
    
    // Créer le dossier physique
    const fs = await import('fs');
    await fs.promises.mkdir(result.path, { recursive: true });
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la création du dossier d\'archive:', error);
    throw error;
  }
});

ipcMain.handle('delete-archive-folder', async (event, id) => {
  try {
    return await dbService.deleteArchiveFolder(id);
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier d\'archive:', error);
    throw error;
  }
});

// Paramètres
ipcMain.handle('get-settings', async () => {
  try {
    return await dbService.getSettings();
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return null;
  }
});

ipcMain.handle('update-settings', async (event, settings) => {
  try {
    const success = await dbService.updateSettings(settings);
    
    // Si c'est le chemin racine qui change, réinitialiser les services
    if (settings.rootPath) {
      dbService = new JsonDatabaseService(settings.rootPath);
      const classiflyerPath = path.join(settings.rootPath, 'Classiflyer');
      fileService = new FileService(classiflyerPath);
      await fileService.initializeRootPath();
    }
    
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
});

// Recherche
ipcMain.handle('search-all', async (event, query) => {
  try {
    return await dbService.searchAll(query);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw error;
  }
});

// Sélection de dossier
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Sélectionner le dossier racine'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la sélection du dossier:', error);
    return null;
  }
});

// Informations système
ipcMain.handle('get-system-info', async () => {
  try {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations système:', error);
    return null;
  }
});

// Chemin racine
ipcMain.handle('get-root-path', async () => {
  try {
    return fileService.getRootPath();
  } catch (error) {
    console.error('Erreur lors de la récupération du chemin racine:', error);
    return null;
  }
});

// Servir un fichier (pour les images, etc.)
ipcMain.handle('serve-file', async (event, filePath) => {
  try {
    const fs = await import('fs');
    
    // Récupérer le chemin racine depuis les paramètres
    const settings = await dbService.getSettings();
    const rootPath = settings.rootPath;
    
    // Construire le chemin absolu si le chemin fourni est relatif
    let absolutePath = filePath;
    if (!path.isAbsolute(filePath)) {
      // Si c'est un chemin relatif, l'ajouter au chemin racine configuré par l'utilisateur
      absolutePath = path.join(rootPath, 'Classiflyer', filePath);
    }
    
    console.log('Tentative de lecture du fichier:', absolutePath);
    
    // Vérifier si le fichier existe
    try {
      await fs.promises.access(absolutePath);
    } catch (accessError) {
      console.error('Fichier non accessible:', absolutePath, accessError);
      return null;
    }
    
    const fileData = await fs.promises.readFile(absolutePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    return {
      data: fileData.toString('base64'),
      mimeType: mimeType
    };
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    console.error('Chemin demandé:', filePath);
    console.error('Chemin absolu construit:', absolutePath);
    return null;
  }
});

// Upload d'un fichier physique
ipcMain.handle('upload-file', async (event, fileData: { name: string; data: string; type: string; size: number }, destinationPath: string) => {
  try {
    const fs = await import('fs');
    
    // Construire le chemin absolu complet
    let absolutePath = destinationPath;
    if (!path.isAbsolute(destinationPath)) {
      // Si c'est un chemin relatif, l'ajouter au chemin racine configuré par l'utilisateur
      const settings = await dbService.getSettings();
      const rootPath = settings.rootPath;
      absolutePath = path.join(rootPath, 'Classiflyer', destinationPath);
    }
    
    // Créer le dossier de destination s'il n'existe pas
    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    
    // Convertir les données base64 en buffer et écrire le fichier
    const buffer = Buffer.from(fileData.data, 'base64');
    await fs.promises.writeFile(absolutePath, buffer);
    
    // Retourner le chemin relatif pour la DB (pour que serve-file puisse le retrouver)
    const settings = await dbService.getSettings();
    const rootPath = settings.rootPath;
    const classiflyerPath = path.join(rootPath, 'Classiflyer');
    const relativePath = path.relative(classiflyerPath, absolutePath);
    
    return {
      success: true,
      path: relativePath, // Retourner le chemin relatif pour la DB
      size: buffer.length
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Gestion de la fermeture de l'application
app.on('before-quit', async () => {
  await dbService.close();
});