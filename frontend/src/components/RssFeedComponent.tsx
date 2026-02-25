import React, { useState, useEffect } from 'react';

interface RSSItem {
  title: string;
  pubDate: string;
  link: string;
}

interface RSSFeed {
  title: string;
  description: string;
  items: RSSItem[];
}

const RssFeedComponent = () => {
  const [feedData, setFeedData] = useState<RSSFeed | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseRssFeed = async () => {
      try {
        // Mock data for demonstration (rss-parser se usa ahora solo en el backend)
        setFeedData({
          title: 'Example Feed',
          description: 'This is an example RSS feed rendered in the frontend',
          items: [
            { title: 'Example Article 1', pubDate: new Date().toString(), link: '#' },
            { title: 'Example Article 2', pubDate: new Date().toString(), link: '#' },
          ]
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error parsing RSS feed:', err);
        setError('Failed to load RSS feed example');
        setLoading(false);
      }
    };

    parseRssFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">RSS Feed Reader</h1>
      
      {feedData && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{feedData.title}</h2>
          <p className="text-gray-600 mb-6">{feedData.description}</p>
          
          <div className="space-y-4">
            {feedData.items.map((item: any, index: number) => (
              <div 
                key={index} 
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition duration-200 ease-in-out"
              >
                <h3 className="text-lg font-medium text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{new Date(item.pubDate).toLocaleDateString()}</p>
                <a 
                  href={item.link} 
                  className="text-blue-600 hover:text-blue-800 text-sm inline-block mt-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read more
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RssFeedComponent;