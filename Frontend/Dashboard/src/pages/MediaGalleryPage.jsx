import React, { useState, useEffect } from "react";
import {
  Image,
  Trash2,
  Download,
  AlertTriangle,
  FileImage,
  Package,
  Layers,
  Upload,
} from "lucide-react";
import {
  bulkUploadMediaFiles,
  getMediaItemsWithProcessedImages,
  deleteMediaFile,
  debugDatabaseContents,
} from "../services/adminApiService";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import "../styles/pages/MediaGalleryPage.css";

const MediaGalleryPage = () => {
  const [processedMediaItems, setProcessedMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Bulk upload states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState([]);

  // Auto-detection states
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Delete states
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log("🔍 [FRONTEND] useEffect triggered - loading media items");
    loadProcessedMediaItems();
  }, []); // Empty dependency array to run only once

  const loadProcessedMediaItems = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log("🔍 [FRONTEND] Already loading, skipping duplicate call");
      return;
    }

    try {
      console.log("🔍 [FRONTEND] Starting to load processed media items...");
      setIsLoading(true);
      setLoading(true);

      const token = localStorage.getItem("admin_token");
      console.log("🔍 [FRONTEND] Token exists:", !!token);
      console.log(
        "🔍 [FRONTEND] Token preview:",
        token ? token.substring(0, 20) + "..." : "No token"
      );

      console.log(
        "🔍 [FRONTEND] Making API call to getMediaItemsWithProcessedImages..."
      );
      console.log(
        "🔍 [FRONTEND] Current environment:",
        import.meta.env.DEV ? "development" : "production"
      );
      console.log(
        "🔍 [FRONTEND] API Base URL:",
        import.meta.env.VITE_API_BASE_URL
      );

      const response = await getMediaItemsWithProcessedImages(token);

      console.log("🔍 [FRONTEND] Raw API response:", response);
      console.log("🔍 [FRONTEND] Response type:", typeof response);
      console.log(
        "🔍 [FRONTEND] Response keys:",
        response ? Object.keys(response) : "No response"
      );
      console.log("🔍 [FRONTEND] Response items:", response?.items);
      console.log("🔍 [FRONTEND] Response data:", response?.data);
      console.log("🔍 [FRONTEND] Response success:", response?.success);
      console.log("🔍 [FRONTEND] Response message:", response?.message);
      console.log("🔍 [FRONTEND] Response count:", response?.count);

      // Check if response has items array (regardless of success field)
      if (response && Array.isArray(response.items)) {
        console.log(
          `✅ [FRONTEND] Found ${response.items.length} items in response.items`
        );
        console.log("🔍 [FRONTEND] Items details:", response.items);
        setProcessedMediaItems(response.items);
      } else if (response && Array.isArray(response.data)) {
        console.log(
          `✅ [FRONTEND] Found ${response.data.length} items in response.data`
        );
        console.log("🔍 [FRONTEND] Data details:", response.data);
        setProcessedMediaItems(response.data);
      } else {
        console.log(
          "⚠️ [FRONTEND] No items found in response, setting empty array"
        );
        console.log(
          "🔍 [FRONTEND] Full response structure:",
          JSON.stringify(response, null, 2)
        );
        setProcessedMediaItems([]);
      }
    } catch (error) {
      console.error(
        "❌ [FRONTEND] Error loading processed media items:",
        error
      );
      console.error("❌ [FRONTEND] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setProcessedMediaItems([]);
    } finally {
      console.log("🔍 [FRONTEND] Finished loading processed media items");
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleBulkFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setBulkUploadFiles(files);
  };

  const handleBulkUpload = async () => {
    if (bulkUploadFiles.length === 0) {
      showErrorToast("Please select files to upload");
      return;
    }

    try {
      setBulkUploading(true);
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();

      bulkUploadFiles.forEach((file) => {
        formData.append("images", file);
      });

      formData.append("autoDetect", autoDetectEnabled.toString());

      const response = await bulkUploadMediaFiles(formData, token);

      if (response.success) {
        setBulkUploadResults(response.data);
        showSuccessToast(response.message);
        
        // Close modal and reload page after successful upload
        setShowBulkUploadModal(false);
        setBulkUploadFiles([]);
        setBulkUploadResults([]);
        
        // Reload the page to show updated media gallery
        window.location.reload();
      }
    } catch (error) {
      console.error("Error in bulk upload:", error);
      showErrorToast("Error uploading files");
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem("admin_token");

      // Send filename and type instead of file path
      const deleteData = {
        filename: deleteItem.image,
        type: deleteItem.type,
      };

      await deleteMediaFile(deleteData, token);

      showSuccessToast("File deleted successfully");

      // Remove the item from the local state
      setProcessedMediaItems((prev) =>
        prev.filter((item) => item.id !== deleteItem.id)
      );

      // Close the delete modal
      setDeleteItem(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      showErrorToast("Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const resetBulkUploadForm = () => {
    setBulkUploadFiles([]);
    setBulkUploadResults([]);
    setAutoDetectEnabled(true);
  };

  const handleDebugDatabase = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      console.log("🔍 [FRONTEND] Debugging database contents...");
      const debugInfo = await debugDatabaseContents(token);
      console.log("🔍 [FRONTEND] Database debug info:", debugInfo);
      showSuccessToast("Database debug info logged to console");
    } catch (error) {
      console.error("❌ [FRONTEND] Debug error:", error);
      showErrorToast("Failed to debug database");
    }
  };

  const renderProcessedMediaCard = (item) => {
    // Use processed_image field from API response
    const imagePath = item.processed_image || item.image;
    const fileUrl = getFileUrl(item.type, imagePath);
    return (
      <div key={item.id} className="media-card">
        <div className="media-card-header">
          <div className="media-type-badge">
            {item.type === "category" && <Layers size={16} />}
            {item.type === "product" && <Package size={16} />}
            <span>{item.type.replace("_", " ")}</span>
            <span className="watermark-badge">💧 Watermarked</span>
          </div>
          <div className="media-actions">
            <a href={fileUrl} download className="action-btn">
              <Download size={16} />
            </a>
            <button
              className="action-btn delete-btn"
              onClick={() => setDeleteItem(item)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="media-preview">
          {fileUrl && imagePath ? (
            <img
              src={fileUrl}
              alt={item.name}
              onLoad={() =>
                console.log(`[Dashboard] Processed image loaded:`, fileUrl)
              }
              onError={(e) => {
                console.error(
                  `[Dashboard] Processed image failed to load:`,
                  fileUrl,
                  e
                );
                // Try fallback URL with direct file access
                const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://172.20.10.10:3001';
                let fallbackUrl;
                if (imagePath.startsWith("/uploads/")) {
                  fallbackUrl = `${baseUrl}${imagePath}`;
                } else {
                  fallbackUrl = `${baseUrl}/uploads/${
                    item.type === "category" ? "categories" : "products"
                  }/${imagePath}`;
                }
                console.log(`[Dashboard] Trying fallback URL:`, fallbackUrl);
                e.target.src = fallbackUrl;
              }}
            />
          ) : (
            <div className="no-preview">
              <Image size={32} />
              <span>No Preview</span>
            </div>
          )}
        </div>

        <div className="media-info">
          <h4>{item.name}</h4>
          {item.type === "product" && <p className="sku">SKU: {item.name}</p>}
          {item.type === "category" && (
            <p className="category">Category: {item.name}</p>
          )}
          <p className="status">✅ Watermarked</p>
        </div>
      </div>
    );
  };

  const getFileUrl = (type, filename) => {
    if (!filename) {
      return null;
    }

    // Use environment variable for base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://172.20.10.10:3001';

    // Check if filename already contains the full path
    if (filename.startsWith("/uploads/")) {
      // If it already has the full path, use it directly
      const fullUrl = `${baseUrl}${filename}`;
      console.log(`[Dashboard] Using full path URL: ${fullUrl}`);
      return fullUrl;
    } else {
      // If it's just the filename, construct the path
      const directory = type === "category" ? "categories" : "products";
      const fullUrl = `${baseUrl}/uploads/${directory}/${filename}`;
      console.log(`[Dashboard] Constructed URL: ${fullUrl}`);
      return fullUrl;
    }
  };

  if (loading) {
    return (
      <div className="media-gallery-page">
        <div className="loading-state">
          <Image size={48} />
          <h3>Loading Processed Images...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="media-gallery-page">
      <div className="page-header">
        <h1>Media Gallery</h1>
        <p>View your processed and watermarked product images</p>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-info">
          <p>Showing {processedMediaItems.length} processed images</p>
        </div>

        <div className="action-buttons">
          <button
            className="bulk-upload-btn"
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Upload size={16} />
            Upload Images
          </button>
          <button
            className="bulk-upload-btn"
            onClick={handleDebugDatabase}
            style={{ marginLeft: "10px", backgroundColor: "#ff6b6b" }}
          >
            🔍 Debug Database
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="media-grid">
        {processedMediaItems.length > 0 ? (
          processedMediaItems.map((item) => renderProcessedMediaCard(item))
        ) : (
          <div className="empty-state">
            <Image size={48} />
            <h3>No Processed Images Found</h3>
            <p>Upload some images to see them here with watermarks applied.</p>
            <button
              className="bulk-upload-btn"
              onClick={() => setShowBulkUploadModal(true)}
            >
              <Upload size={16} />
              Upload Your First Image
            </button>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="modal-overlay">
          <div className="modal bulk-upload-modal">
            <div className="modal-header">
              <h3>Upload Images</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowBulkUploadModal(false);
                  resetBulkUploadForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={autoDetectEnabled}
                    onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                  />
                  Enable Auto-Detection
                </label>
                <small>
                  Automatically detect image type and association based on
                  filename
                </small>
              </div>

              <div className="form-group">
                <label>Select Images (Max 20 files)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkFileSelect}
                />
                {bulkUploadFiles.length > 0 && (
                  <div className="file-list">
                    <p>
                      <strong>
                        Selected Files ({bulkUploadFiles.length}):
                      </strong>
                    </p>
                    <ul>
                      {bulkUploadFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="upload-info">
                <p>
                  <strong>Processing:</strong>
                </p>
                <ul>
                  <li>Product images will be automatically watermarked</li>
                  <li>All images will be converted to WebP format</li>
                  <li>Images will be optimized for web use</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBulkUploadModal(false);
                  resetBulkUploadForm();
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleBulkUpload}
                disabled={bulkUploading || bulkUploadFiles.length === 0}
              >
                {bulkUploading ? "Uploading..." : "Upload Images"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {bulkUploadResults.length > 0 && (
        <div className="upload-results">
          <h3>Upload Results</h3>
          <div className="results-grid">
            {bulkUploadResults.map((result, index) => (
              <div
                key={index}
                className={`result-item ${
                  result.success ? "success" : "error"
                }`}
              >
                <div className="result-header">
                  <span className="result-status">
                    {result.success ? "✅" : "❌"}
                  </span>
                  <span className="filename">{result.filename}</span>
                </div>
                <p className="result-message">{result.message}</p>
                {result.details && (
                  <div className="result-details">
                    <strong>Details:</strong> {result.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="modal-overlay">
          <div className="modal delete-confirmation-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteItem(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete "{deleteItem.name}"? This action
                cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDeleteItem(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGalleryPage;
