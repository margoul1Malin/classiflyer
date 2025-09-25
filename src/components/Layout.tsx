import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Trash2, 
  Settings, 
  Archive,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import ArchiveFolderTree from './ArchiveFolderTree';
import { ArchiveFolder } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isArchivesExpanded, setIsArchivesExpanded] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/');
  };

  const handleFolderSelect = (folder: ArchiveFolder) => {
    navigate(`/archive-folder/${folder.id}`);
  };

  const sidebarItems = [
    { icon: FolderOpen, label: 'Tous les classeurs', path: '/' },
    { icon: Archive, label: 'Archives', path: '/archives' },
    { icon: Trash2, label: 'Corbeille', path: '/trash' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Classiflyer</h1>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <GlobalSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            placeholder="Rechercher dans tous vos documents..."
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/archives' && location.pathname.startsWith('/archive-folder/'));
              
              // Gestion spéciale pour les Archives
              if (item.path === '/archives') {
                return (
                  <li key={item.path}>
                    <div>
                      <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                        <Icon className="w-5 h-5" />
                        <Link
                          to={item.path}
                          className="font-medium flex-1 text-left hover:underline"
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={() => setIsArchivesExpanded(!isArchivesExpanded)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={isArchivesExpanded ? 'Réduire' : 'Développer'}
                        >
                          {isArchivesExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      {isArchivesExpanded && (
                        <div className="ml-4 mt-1">
                          <ArchiveFolderTree
                            onFolderSelect={handleFolderSelect}
                            selectedFolderId={
                              location.pathname.startsWith('/archive-folder/') 
                                ? parseInt(location.pathname.split('/')[2])
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              }
              
              // Items normaux
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => navigate('/create-classeur')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un classeur</span>
          </button>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Paramètres</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;
