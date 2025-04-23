import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { ExcelHandler } from '../ExcelHandler';
import { FiUser, FiMapPin, FiClock, FiUpload, FiDownload, FiLogOut, FiCheck, FiLoader, FiAlertTriangle, FiInfo } from 'react-icons/fi';

// API URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const CheckinPage = ({ user }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if current time is within allowed check-in times
  const [isWithinCheckinHours, setIsWithinCheckinHours] = useState(false);
  
  // Update check-in time validity every minute
  useEffect(() => {
    const checkValidTime = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
      const hour = now.getHours();
      
      // CCA is on Friday 6pm-9pm only
      setIsWithinCheckinHours(dayOfWeek === 5 && hour >= 18 && hour < 21);
    };
    
    // Check immediately
    checkValidTime();
    
    // Then check every minute
    const interval = setInterval(checkValidTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // TP Campus location - updated with precise coordinates
  const tpLocation = { 
    lat: 1.34498,   // latitude
    lng: 103.9317  // longitude
  };

  // TP Campus boundaries (bounding box)
  const tpBoundary = {
    minLat: 1.3425,
    maxLat: 1.3474,
    minLng: 103.9292,
    maxLng: 103.9342
  };

  // Distance calculation (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Check if location is within or near campus boundaries
  const isWithinCampusArea = (lat, lng) => {
    // First check if directly within boundary box
    const withinBoundary = 
      lat >= tpBoundary.minLat && 
      lat <= tpBoundary.maxLat && 
      lng >= tpBoundary.minLng && 
      lng <= tpBoundary.maxLng;
    
    if (withinBoundary) return true;
    
    // If not directly within boundary, check distance from campus center
    const distance = calculateDistance(lat, lng, tpLocation.lat, tpLocation.lng);
    return distance <= 1.5; // Within 1.5km of campus center
  };

  // Get user's current location
  const getLocation = () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocation(userLocation);
        
        // Calculate distance from TP center
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          tpLocation.lat, 
          tpLocation.lng
        );
        
        // Check if within campus area
        if (isWithinCampusArea(userLocation.lat, userLocation.lng)) {
          setLocationStatus('success');
        } else {
          setLocationStatus('warning');
        }
      },
      (error) => {
        setLocationStatus('error');
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Please allow location access to check in');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setError('The request to get user location timed out');
            break;
          default:
            setError('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,  // Enable high accuracy (GPS if available)
        timeout: 10000,           // 10 seconds timeout
        maximumAge: 0              // Don't use cached position
      }
    );
  };

  const handleCheckIn = async () => {
    if (!user) {
      setError('You must be logged in to check in');
      return;
    }
    
    if (!location) {
      setError('Please share your location first');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Call the attendance API
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          locationLat: location.lat,
          locationLng: location.lng
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to record attendance');
      }
      
      // Success
      setIsCheckedIn(true);
      setSuccessMessage('Attendance recorded successfully! Thank you for checking in.');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setIsCheckedIn(false);
        setLocation(null);
        setLocationStatus('idle');
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Check-in error:', error);
      setError(error.message || 'Failed to record attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CCA Attendance Check-in</h1>
          <p className="text-gray-600">
            Record your attendance at TP Mindsport Club activities
          </p>
          <div className={`mt-2 text-sm font-medium ${isWithinCheckinHours ? 'text-green-600' : 'text-amber-600'}`}>
            <span className="font-semibold">Check-in time:</span> Only on Fridays 18:00-21:00
            {!isWithinCheckinHours && (
              <div className="mt-1 text-amber-600">
                <FiAlertTriangle className="inline mr-1" />
                <span>Currently outside check-in hours</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* User Information */}
          <div className="bg-primary-50 p-6 border-b border-primary-100">
            <h2 className="text-xl font-semibold text-primary-800 mb-3">Student Information</h2>
            {user ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium text-gray-800">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Student ID:</span>
                  <span className="font-medium text-gray-800">{user.index_number}</span>
                </div>
                {user.course && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Course:</span>
                    <span className="font-medium text-gray-800">{user.course}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FiInfo className="mx-auto h-8 w-8 mb-2" />
                <p>Please log in to check in</p>
              </div>
            )}
          </div>

          {/* Location and Check-in */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start rounded-md">
                <FiAlertTriangle className="mr-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start rounded-md">
                <FiCheck className="mr-3 mt-0.5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            
            {!isCheckedIn && !successMessage && (
              <div className="space-y-6">
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">Your Location</h3>
                    <span className={`text-sm ${
                      locationStatus === 'success' ? 'text-green-600' : 
                      locationStatus === 'warning' ? 'text-amber-600' : 
                      locationStatus === 'error' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {locationStatus === 'success' && 'Location found'}
                      {locationStatus === 'warning' && 'Far from campus'}
                      {locationStatus === 'error' && 'Location error'}
                      {locationStatus === 'loading' && 'Getting location...'}
                      {locationStatus === 'idle' && 'Location not shared'}
                    </span>
                  </div>
                  
                  {location ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Latitude:</span>
                        <span className="font-mono">{location.lat.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Longitude:</span>
                        <span className="font-mono">{location.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
                        <span className="text-gray-500">Distance from campus:</span>
                        <span className="font-mono">{calculateDistance(
                          location.lat,
                          location.lng,
                          tpLocation.lat,
                          tpLocation.lng
                        ).toFixed(2)} km</span>
                      </div>
                      
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Location status:</span>
                        <span className={`font-mono ${isWithinCampusArea(location.lat, location.lng) ? 'text-green-600' : 'text-amber-600'}`}>
                          {isWithinCampusArea(location.lat, location.lng) ? 'Within campus area' : 'Outside campus area'}
                        </span>
                      </div>
                      
                      {locationStatus === 'warning' && (
                        <div className="mt-2 text-amber-600 text-xs flex items-start">
                          <FiAlertTriangle className="mr-1 flex-shrink-0 mt-0.5" />
                          <span>You appear to be far from campus. Check-in may be rejected.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={getLocation}
                      disabled={locationStatus === 'loading' || !user}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white ${
                        !user ? 'bg-gray-400 cursor-not-allowed' :
                        locationStatus === 'loading' ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                    >
                      {locationStatus === 'loading' ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <FiMapPin className="mr-2" />
                          Share My Location
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleCheckIn}
                  disabled={isLoading || locationStatus !== 'success' || !user || !isWithinCheckinHours}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white ${
                    !user || locationStatus !== 'success' || !isWithinCheckinHours ? 'bg-gray-400 cursor-not-allowed' :
                    isLoading ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Recording attendance...
                    </>
                  ) : !isWithinCheckinHours ? (
                    <>
                      <FiClock className="mr-2" />
                      Outside check-in hours
                    </>
                  ) : (
                    <>
                      <FiCheck className="mr-2" />
                      Check In Now
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            Note: Your location is only used to verify you are at the CCA venue.
            <br />
            You must be within campus boundaries or within 1.5 kilometers of the campus center to check in.
            <br />
            CCA sessions are only on Fridays from 6:00 PM to 9:00 PM.
          </p>
        </div>
      </motion.div>
    </div>
  );
}; 