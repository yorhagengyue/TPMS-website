import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { ExcelHandler } from '../ExcelHandler';
import { FiUser, FiMapPin, FiClock, FiUpload, FiDownload, FiLogOut } from 'react-icons/fi';

const CheckinPage = ({ studentData, setStudentData }) => {
  const [indexNumber, setIndexNumber] = useState('');
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [lastCheckin, setLastCheckin] = useState(null);

  const handleLoginClick = async () => {
    if (indexNumber.trim().toLowerCase() === 'admin') {
      setIsLoggedIn(true);
      setStudentName('Administrator');
      return;
    }

    if (!studentData || studentData.length === 0) {
      setError('System Error: Student data not imported yet');
      return;
    }

    const student = studentData.find(student => {
      const studentIndex = student['index number'];
      if (!studentIndex) return false;
      
      const match = studentIndex.toString().trim().toLowerCase() === indexNumber.trim().toLowerCase();
      console.log('Comparing:', {
        excel: studentIndex.toString().trim().toLowerCase(),
        input: indexNumber.trim().toLowerCase(),
        match: match
      });
      
      return match;
    });

    if (student) {
      setIsLoggedIn(true);
      setStudentName(student.Name);
      getLocation();
    } else {
      setError('Invalid student ID. Please verify and try again.');
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setError('Location access failed: ' + error.message);
        }
      );
    } else {
      setError('Your browser does not support location services');
    }
  };

  const handleCheckin = () => {
    if (!userLocation) {
      setError('Please enable location services to check in');
      return;
    }

    const tpLocation = { lat: 1.3456, lng: 103.9321 };
    const distance = calculateDistance(userLocation, tpLocation);
    
    if (distance <= 0.5) {
      setLastCheckin(new Date().toLocaleString());
      setError('');
      alert('Check-in successful!');
    } else {
      setError('You must be within TP campus area to check in');
    }
  };

  const calculateDistance = (coord1, coord2) => {
    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Digital Attendance System
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Welcome to TP Mindsport Club's digital attendance system. 
              Members can easily check in for club activities, while administrators have access to comprehensive management tools.
            </p>
          </motion.div>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white shadow-2xl border-0 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="text-xl font-normal flex items-center gap-2">
                  <FiUser className="w-5 h-5" />
                  {isLoggedIn ? 'Check-in Portal' : 'Member Authentication'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Identification
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your student ID"
                        value={indexNumber}
                        onChange={(e) => setIndexNumber(e.target.value)}
                        className="w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        Use 'admin' for administrative access
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20"
                      onClick={handleLoginClick}
                    >
                      Authenticate
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-medium text-blue-900">Welcome back, {studentName}</p>
                      <p className="text-sm text-blue-600">ID: {indexNumber}</p>
                      {lastCheckin && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                          <FiClock className="w-3 h-3" />
                          Last check-in: {lastCheckin}
                        </p>
                      )}
                    </div>
                    {!indexNumber.toLowerCase().includes('admin') && (
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        onClick={handleCheckin}
                      >
                        <FiMapPin className="w-4 h-4" />
                        Check In Now
                      </Button>
                    )}
                    <Button 
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2"
                      onClick={() => {
                        setIsLoggedIn(false);
                        setIndexNumber('');
                        setStudentName('');
                        setError('');
                        setLastCheckin(null);
                      }}
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </motion.div>
                )}

                {error && (
                  <Alert className="mt-4 bg-red-50 border-red-200 animate-shake">
                    <AlertDescription className="text-red-600">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Administrative Panel */}
                {indexNumber === 'admin' && isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-8 border-t border-gray-100"
                  >
                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                      <FiUser className="w-5 h-5" />
                      Admin Dashboard
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-3">Administrator Guide</h4>
                        <ul className="text-sm text-blue-700 space-y-2">
                          <li className="flex items-center gap-2">
                            <FiUpload className="w-4 h-4" />
                            Import student records via Excel
                          </li>
                          <li className="flex items-center gap-2">
                            <FiDownload className="w-4 h-4" />
                            Export data for backup
                          </li>
                          <li className="flex items-center gap-2">
                            <FiUser className="w-4 h-4" />
                            Required fields: Name, Course, Index Number
                          </li>
                        </ul>
                      </div>
                      <ExcelHandler
                        data={studentData}
                        onImport={setStudentData}
                      />
                    </div>
                    
                    {/* Student Records */}
                    {studentData && studentData.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <FiUser className="w-4 h-4" />
                          Student Records
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(studentData[0]).map((header) => (
                                  <th
                                    key={header}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {studentData.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                  {Object.values(row).map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-3 py-2 whitespace-nowrap text-sm text-gray-600"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { CheckinPage }; 