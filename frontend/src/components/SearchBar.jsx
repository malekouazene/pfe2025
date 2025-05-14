import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';


const SearchBar = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching:', query);
  };

  return (
    <section className="mb-12">
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
            icon={<FaSearch />}
          />
        </div>
        <div className="flex justify-center mt-3 space-x-4">
          <Button variant="link">Filtrer par catégories</Button>
          <Button variant="link">Recherche avancée</Button>
        </div>
      </form>
    </section>
  );
};

export default SearchBar;