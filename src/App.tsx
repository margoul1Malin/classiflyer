import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClasseurView from './pages/ClasseurView';
import Settings from './pages/Settings';
import Archives from './pages/Archives';
import ArchiveFolderContent from './pages/ArchiveFolderContent';
import SearchResults from './pages/SearchResults';
import CreateClasseur from './pages/CreateClasseur';
import Trash from './pages/Trash';

const App: React.FC = () => {
  return (
    <Router>
      <div className="h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classeur/:id" element={<ClasseurView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/archive-folder/:folderId" element={<ArchiveFolderContent />} />
            <Route path="/search" element={<SearchResults query={new URLSearchParams(window.location.search).get('q') || ''} />} />
            <Route path="/create-classeur" element={<CreateClasseur />} />
            <Route path="/trash" element={<Trash />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
};

export default App;
