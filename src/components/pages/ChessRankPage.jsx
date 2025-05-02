import React, { useState, useEffect } from 'react';
import { FaChess, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChessRankPage = () => {
  const [chessRankings, setChessRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取棋手排名数据
  useEffect(() => {
    const fetchChessRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/chess-rank');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch chess rankings');
        }
        
        if (data.success) {
          setChessRankings(data.users);
        } else {
          throw new Error(data.message || 'Failed to fetch chess rankings');
        }
      } catch (err) {
        console.error('Error fetching chess rankings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChessRankings();
    
    // 设置事件监听器，在窗口获得焦点时刷新数据
    const handleFocus = () => {
      fetchChessRankings();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Helper function to determine medal color based on rank
  const getMedalColor = (index) => {
    switch (index) {
      case 0: return 'text-yellow-500'; // Gold
      case 1: return 'text-gray-400';   // Silver
      case 2: return 'text-amber-700';  // Bronze
      default: return '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-6">
            <FaChess className="text-3xl text-blue-600 mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold">TPMS Chess Rankings</h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Below are the current Chess.com ratings for TPMS members. Rankings are sorted by Rapid rating.
            Connect your Chess.com account in your profile to appear on this leaderboard!
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <FaSpinner className="animate-spin text-3xl text-blue-600" />
            </div>

          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : chessRankings.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>No chess rankings available. Be the first to connect your Chess.com account!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chess.com</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rapid</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Blitz</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bullet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {chessRankings.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'} font-semibold ${getMedalColor(index)}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium">{user.username}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <a 
                          href={`https://chess.com/member/${user.chess_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {user.chess_username}
                          <FaExternalLinkAlt className="ml-1 text-xs" />
                        </a>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-semibold">{user.chess_rapid || '-'}</td>
                      <td className="py-4 px-4 whitespace-nowrap font-semibold">{user.chess_blitz || '-'}</td>
                      <td className="py-4 px-4 whitespace-nowrap font-semibold">{user.chess_bullet || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">About Chess Ratings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chess ratings are a numerical representation of a player's skill level. 
            The higher the rating, the stronger the player. Ratings are calculated based 
            on game outcomes and the rating of opponents. Chess.com provides ratings for 
            different time controls:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-300">
            <li><strong>Rapid:</strong> Games with 10+ minutes per side</li>
            <li><strong>Blitz:</strong> Games with 3-5 minutes per side</li>
            <li><strong>Bullet:</strong> Games with less than 3 minutes per side</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default ChessRankPage;
