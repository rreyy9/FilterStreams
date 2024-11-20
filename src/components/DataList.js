import React, { useState, useEffect } from 'react';

const DataList = () => {
  const [streams, setStreams] = useState([]);
  const [displayedStreams, setDisplayedStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bearerToken, setBearerToken] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCategory, setSelectedCategory] = useState('18122');

  // Popular Twitch categories with their IDs
  const categories = [
    { id: '18122', name: 'World of Warcraft' },
    { id: '21779', name: 'League of Legends' },
    { id: '27471', name: 'Minecraft' },
    { id: '516575', name: 'VALORANT' },
    { id: '33214', name: 'Fortnite' },
    { id: '509658', name: 'Just Chatting' },
    { id: '32982', name: 'Grand Theft Auto V' },
    { id: '511224', name: 'Apex Legends' }
  ];

  const getOAuthToken = async () => {
    try {
      const params = new URLSearchParams({
        client_id: '4scexyqd6nhgn4ewulcsegxdt2xgtt',
        client_secret: 'z1tk94dzm4z52r3ji29fjm5vnd5m9v',
        grant_type: 'client_credentials'
      });

      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: params
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const result = await response.json();
      setBearerToken(result.access_token);
      return result.access_token;
    } catch (err) {
      setError('Failed to get authentication token: ' + err.message);
      return null;
    }
  };

  const fetchStreamPage = async (token, cursor = null) => {
    try {
      const params = new URLSearchParams({
        game_id: selectedCategory,
        first: '100'
      });

      if (cursor) {
        params.append('after', cursor);
      }

      const url = `https://api.twitch.tv/helix/streams?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': '4scexyqd6nhgn4ewulcsegxdt2xgtt'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch streams');
      }

      return await response.json();
    } catch (err) {
      throw new Error(`Failed to fetch page: ${err.message}`);
    }
  };

  const fetchAllStreams = async (token) => {
    try {
      setIsLoading(true);
      setLoadingProgress(0);
      setStreams([]);
      setDisplayedStreams([]);
      
      let allStreams = [];
      let cursor = null;
      let currentPage = 0;

      let response = await fetchStreamPage(token);
      allStreams = [...response.data];
      cursor = response.pagination.cursor;

      while (cursor) {
        setLoadingProgress((currentPage + 1) * 100);

        response = await fetchStreamPage(token, cursor);
        allStreams = [...allStreams, ...response.data];

        cursor = response.pagination.cursor;
        currentPage++;

        await new Promise(resolve => setTimeout(resolve, 100));

        if (allStreams.length >= 1000) {
          break;
        }
      }

      const uniqueStreams = Array.from(new Map(allStreams.map(s => [s.id, s])).values());
      setStreams(uniqueStreams);
      setDisplayedStreams(uniqueStreams);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const token = bearerToken || await getOAuthToken();
      if (token) {
        await fetchAllStreams(token);
      }
    };

    initializeData();
  }, [selectedCategory]);

  useEffect(() => {
    let filtered = [...streams];

    if (searchTerm) {
      filtered = filtered.filter(stream => 
        stream.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.viewer_count - a.viewer_count;
      }
      return a.viewer_count - b.viewer_count;
    });

    setDisplayedStreams(filtered);
  }, [streams, searchTerm, sortOrder]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="text-xl font-semibold">Loading streams...</div>
            <div className="text-gray-600">Streams loaded: {streams.length}</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(loadingProgress / 1000) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Live Streams (Total: {displayedStreams.length})
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={toggleSort}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                Sort by Viewers ({sortOrder === 'desc' ? '↓' : '↑'})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedStreams.map((stream) => (
            <div
              key={`${stream.id}-${stream.user_name}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative">
                <img 
                  src={stream.thumbnail_url.replace('{width}', '300').replace('{height}', '168')} 
                  alt={stream.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white text-sm">
                  {stream.viewer_count.toLocaleString()} viewers
                </div>
              </div>
              <div className="p-4">
                <a 
                  href={`https://www.twitch.tv/${stream.user_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-purple-600 hover:text-purple-700"
                >
                  {stream.user_name}
                </a>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {stream.title}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Game: {stream.game_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataList;