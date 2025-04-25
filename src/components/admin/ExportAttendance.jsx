import React, { useState } from 'react';
import { FiDownload, FiCalendar, FiUser } from 'react-icons/fi';

const ExportAttendance = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle export operation
  const handleExport = () => {
    setLoading(true);
    setError('');
    
    // 构建URL，包含过滤条件
    let url = '/api/attendance/export';
    const queryParams = [];
    
    if (startDate) queryParams.push(`startDate=${startDate}`);
    if (endDate) queryParams.push(`endDate=${endDate}`);
    if (studentId) queryParams.push(`studentId=${studentId}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    // 使用 window.open 触发下载
    try {
      window.open(url, '_blank');
      setLoading(false);
    } catch (err) {
      setError('Error occurred during export, please try again later');
      setLoading(false);
      console.error('Export error:', err);
    }
  };

  // Clear all filter conditions
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setStudentId('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <FiDownload className="mr-2" />
        Export Attendance Data
      </h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiCalendar className="mr-1" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiCalendar className="mr-1" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <FiUser className="mr-1" />
          Student ID (Optional)
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter student ID to filter specific student"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={loading || (!startDate && !endDate && !studentId)}
          className={`flex items-center px-4 py-2 rounded-md text-white transition-colors ${
            loading || (!startDate && !endDate && !studentId)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <FiDownload className="mr-2" />
          {loading ? 'Processing...' : 'Export to Excel'}
        </button>
        
        <button
          onClick={handleClear}
          className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear Filters
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Tips: </p>
        <ul className="list-disc pl-5 mt-1">
          <li>Leave date range empty to export all attendance records</li>
          <li>Set only start date to export records from that date to today</li>
          <li>Set only end date to export records up to that date</li>
          <li>Enter student ID to filter records for a specific student</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportAttendance;
