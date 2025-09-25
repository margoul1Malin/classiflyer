import { useState, useEffect } from 'react';
import { SearchResult } from '../types';

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult>({
    classeurs: [],
    dossiers: [],
    fichiers: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ classeurs: [], dossiers: [], fichiers: [] });
      setQuery('');
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    try {
      const searchResults = await window.electronAPI.searchAll(searchQuery);
      setResults(searchResults);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error('Erreur:', err);
      setResults({ classeurs: [], dossiers: [], fichiers: [] });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setResults({ classeurs: [], dossiers: [], fichiers: [] });
    setQuery('');
    setError(null);
  };

  const totalResults = results.classeurs.length + results.dossiers.length + results.fichiers.length;

  return {
    results,
    loading,
    error,
    query,
    totalResults,
    search,
    clearSearch,
  };
};
