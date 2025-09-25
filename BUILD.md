# Guide de Build - Classiflyer v1.0

## Scripts de Build Disponibles

### Build pour Windows
```bash
npm run build:win
```
Génère :
- `Classiflyer-Setup.exe` (installateur Windows)
- `Classiflyer-win32-x64.zip` (version portable)

### Build pour Linux
```bash
npm run build:lin
```
Génère :
- `classiflyer_1.0.0_amd64.deb` (pour Debian/Ubuntu)
- `classiflyer-1.0.0-1.x86_64.rpm` (pour Red Hat/Fedora)
- `Classiflyer-linux-x64.zip` (version portable)

### Build pour toutes les plateformes
```bash
npm run build:all
```
Génère tous les exécutables ci-dessus.

## Où trouver les builds

Les exécutables générés se trouvent dans :
```
out/make/
├── squirrel.windows/
│   └── Classiflyer-Setup.exe
├── zip.windows/
│   └── Classiflyer-win32-x64.zip
├── deb.x64/
│   └── classiflyer_1.0.0_amd64.deb
├── rpm.x64/
│   └── classiflyer-1.0.0-1.x86_64.rpm
└── zip.linux/
    └── Classiflyer-linux-x64.zip
```

## Installation

### Windows
- **Installateur** : Double-cliquer sur `Classiflyer-Setup.exe`
- **Portable** : Extraire `Classiflyer-win32-x64.zip` et lancer `Classiflyer.exe`

### Linux
- **DEB** : `sudo dpkg -i classiflyer_1.0.0_amd64.deb`
- **RPM** : `sudo rpm -i classiflyer-1.0.0-1.x86_64.rpm`
- **Portable** : Extraire `Classiflyer-linux-x64.zip` et lancer `./Classiflyer`

## Notes

- Les builds sont optimisés pour x64 (64-bit)
- L'application est packagée avec ASAR pour de meilleures performances
- Tous les fichiers nécessaires sont inclus dans les exécutables
- La première exécution peut prendre quelques secondes pour l'initialisation

## Développement

Pour le développement local :
```bash
npm start
```

Pour un build de test :
```bash
npm run package
```
