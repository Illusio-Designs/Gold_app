import React, { useState } from 'react';
import { importExcelFile } from '../services/adminApiService';

const ExcelImport = ({ token, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setMessage('');
      setUploadProgress(0);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select an Excel file first');
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setError('');
    setMessage('');
    setUploadProgress(0);

    try {
      const result = await importExcelFile(file, token, (progress) => {
        setUploadProgress(progress);
      });
      
      setMessage(`Import completed successfully! 
        Categories: ${result.results.categoriesCreated} created, ${result.results.categoriesUpdated} updated
        Products: ${result.results.productsCreated} created, ${result.results.productsUpdated} updated
        ${result.results.errors.length > 0 ? `Errors: ${result.results.errors.length}` : ''}`);
      
      // Clear file input
      setFile(null);
      document.getElementById('excel-file-input').value = '';
      
      // Notify parent component
      if (onImportComplete) {
        onImportComplete(result);
      }
      
    } catch (error) {
      setError(error.message || 'Failed to import Excel file');
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="excel-import-container">
      <h3>Import Products & Categories from Excel</h3>
      
      <div className="import-instructions">
        <h4>Required Excel Format:</h4>
        <p>Your Excel file should have the following columns:</p>
        <ul>
          <li><strong>Tgno</strong> - Product SKU (required)</li>
          <li><strong>Stamp</strong> - Product purity/stamp (any value: MG916, 18K, 20K, 24K, etc.)</li>
          <li><strong>PC</strong> - Number of pieces</li>
          <li><strong>Gwt</strong> - Gross weight</li>
          <li><strong>N.wt</strong> - Net weight</li>
          <li><strong>Size</strong> - Product size</li>
          <li><strong>MRP</strong> - Maximum Retail Price</li>
          <li><strong>Item Name</strong> - Category name (required)</li>
        </ul>
        <p><em>Note: Column names are case-insensitive. All imported products and categories will be created as drafts. All imported products will have 'available' stock status. If a category or product already exists, it will be updated instead of creating duplicates.</em></p>
      </div>

      <div className="file-upload-section">
        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input"
        />
        <label htmlFor="excel-file-input" className="file-input-label">
          {file ? file.name : 'Choose Excel File'}
        </label>
      </div>

      {file && (
        <div className="file-info">
          <p>Selected file: <strong>{file.name}</strong></p>
          <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-header">
            <span>Uploading Excel file...</span>
            <span className="progress-percentage">{uploadProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-status">
            {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
          </div>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="import-button"
      >
        {loading ? 'Importing...' : 'Import Excel'}
      </button>

      {message && (
        <div className="success-message">
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <style jsx>{`
        .excel-import-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .import-instructions {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .import-instructions h4 {
          margin-top: 0;
          color: #333;
        }

        .import-instructions ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .import-instructions li {
          margin-bottom: 5px;
        }

        .file-upload-section {
          margin-bottom: 15px;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          display: inline-block;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .file-input-label:hover {
          background: #0056b3;
        }

        .file-info {
          background: #e9ecef;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .import-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }

        .import-button:hover:not(:disabled) {
          background: #218838;
        }

        .import-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-top: 15px;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-top: 15px;
        }

        .upload-progress {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-weight: 500;
          color: #495057;
        }

        .progress-percentage {
          font-weight: bold;
          color: #007bff;
        }

        .progress-bar-container {
          width: 100%;
          height: 20px;
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          border-radius: 10px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 20px 20px;
          animation: move 2s linear infinite;
        }

        @keyframes move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 20px 20px;
          }
        }

        .progress-status {
          text-align: center;
          color: #6c757d;
          font-size: 14px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ExcelImport;