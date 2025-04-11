import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button } from './ui/button';
import { FiUpload, FiDownload, FiCheck, FiAlertCircle } from 'react-icons/fi';

export const ExcelHandler = ({ data, onImport }) => {
  const [importStatus, setImportStatus] = useState({ state: 'idle', message: '' });
  const [exportStatus, setExportStatus] = useState({ state: 'idle', message: '' });

  const exportToExcel = () => {
    try {
      setExportStatus({ state: 'loading', message: 'Preparing export...' });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(dataBlob, 'students.xlsx');
      
      setExportStatus({ state: 'success', message: 'Export completed successfully!' });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus({ state: 'idle', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ state: 'error', message: `Export failed: ${error.message}` });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus({ state: 'idle', message: '' });
      }, 3000);
    }
  };

  const importExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImportStatus({ state: 'loading', message: 'Processing file...' });
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: ''
        });

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        const formattedData = jsonData.map(row => ({
          'Name': row['Name'] || '',
          'Course': row['Course'] || '',
          'index number': (row['index number'] || '').toString().trim()
        }));
        
        // Save to localStorage
        localStorage.setItem('studentData', JSON.stringify(formattedData));
        
        onImport(formattedData);
        setImportStatus({ 
          state: 'success', 
          message: `Imported ${formattedData.length} student records successfully!` 
        });
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setImportStatus({ state: 'idle', message: '' });
        }, 3000);
      } catch (error) {
        console.error('Excel import error:', error);
        setImportStatus({ state: 'error', message: `Import failed: ${error.message}` });
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setImportStatus({ state: 'idle', message: '' });
        }, 3000);
      }
    };
    
    reader.onerror = () => {
      setImportStatus({ state: 'error', message: 'Failed to read file' });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setImportStatus({ state: 'idle', message: '' });
      }, 3000);
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset the file input
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Button 
          onClick={exportToExcel}
          disabled={exportStatus.state === 'loading' || !data || data.length === 0}
          variant="default" 
          className={`flex items-center gap-2 px-4 transition-all ${
            exportStatus.state === 'loading' ? 'bg-blue-400' :
            exportStatus.state === 'success' ? 'bg-green-600' :
            exportStatus.state === 'error' ? 'bg-red-600' : ''
          }`}
        >
          {exportStatus.state === 'loading' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : exportStatus.state === 'success' ? (
            <FiCheck className="w-4 h-4" />
          ) : exportStatus.state === 'error' ? (
            <FiAlertCircle className="w-4 h-4" />
          ) : (
            <FiDownload className="w-4 h-4" />
          )}
          {exportStatus.state === 'idle' ? 'Export Student List' : exportStatus.message}
        </Button>
        
        <div className="relative">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('excel-upload').click()} 
            className="flex items-center gap-2 border-dashed"
          >
            <FiUpload className="w-4 h-4" />
            Import Student List
          </Button>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={importExcel}
          />
        </div>
      </div>
      
      {importStatus.state !== 'idle' && (
        <div className={`text-sm px-4 py-2 rounded-md ${
          importStatus.state === 'loading' ? 'bg-blue-50 text-blue-700' :
          importStatus.state === 'success' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {importStatus.state === 'loading' ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : importStatus.state === 'success' ? (
              <FiCheck className="w-3 h-3" />
            ) : (
              <FiAlertCircle className="w-3 h-3" />
            )}
            {importStatus.message}
          </div>
        </div>
      )}
      
      {data && data.length > 0 && (
        <p className="text-sm text-gray-500">
          {data.length} student records loaded
        </p>
      )}
    </div>
  );
}; 