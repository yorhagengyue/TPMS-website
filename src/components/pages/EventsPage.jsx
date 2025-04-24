import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiExternalLink, FiSearch, FiLoader } from 'react-icons/fi';
import PageTransition from '../ui/PageTransition';

export const EventsPage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/chess-ratings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user ratings');
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.chess_username && user.chess_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Chess Rankings</h1>
          <div className="w-16 h-1 bg-blue-500 mb-10"></div>
          
          {users.length > 0 ? (
            <>
              {/* Search input */}
              <div className="relative max-w-md mb-8">
                <input
                  type="text"
                  placeholder="Search by name or Chess.com username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Rankings table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chess.com Username
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <FiLoader className="animate-spin text-blue-500" size={24} />
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers
                        .sort((a, b) => (b.chess_rating || 0) - (a.chess_rating || 0))
                        .map((user, index) => (
                          <tr key={user.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FiUser className="text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.student_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.chess_username ? (
                                <a 
                                  href={`https://www.chess.com/member/${user.chess_username}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  {user.chess_username}
                                  <FiExternalLink className="ml-1" size={14} />
                                </a>
                              ) : (
                                <span className="text-gray-400">Not connected</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.chess_rating ? (
                                <div className="text-sm font-semibold text-gray-900">
                                  {user.chess_rating}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No matching players found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Chess.com profile binding promotion */}
              {user && !user.chess_username && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md"
                >
                  <p className="text-blue-700">
                    Want to appear on the leaderboard? <a href="/profile" className="font-medium underline">Connect your Chess.com account</a> to display your rating!
                  </p>
                </motion.div>
              )}
            </>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <FiLoader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl text-gray-600 mb-8">No chess ratings available yet</p>
              {user && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md inline-block text-left">
                  <p className="text-blue-700">
                    Be the first! <a href="/profile" className="font-medium underline">Connect your Chess.com account</a> to display your rating.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}; 