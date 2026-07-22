import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Image,
  Trash2,
  Download,
  Package,
  Layers,
  Upload,
  Droplet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  bulkUploadMediaFiles,
  getMediaItemsWithProcessedImages,
  deleteMediaFile,
} from "../services/adminApiService";
import { showSuccessToast, showErrorToast } from "../utils/toast";
import { SkeletonCards } from "../components/common/Skeleton";
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

  // Delete states
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProcessedMediaItems();
  }, []); // Empty dependency array to run only once

  const loadProcessedMediaItems = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);

      const token = localStorage.getItem("admin_token");
      const response = await getMediaItemsWithProcessedImages(token);

      // Check if response has items array (regardless of success field)
      if (response && Array.isArray(response.items)) {
        setProcessedMediaItems(response.items);
      } else if (response && Array.isArray(response.data)) {
        setProcessedMediaItems(response.data);
      } else {
        setProcessedMediaItems([]);
      }
    } catch (error) {
      setProcessedMediaItems([]);
      showErrorToast("Failed to load media items");
    } finally {
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

      const response = await bulkUploadMediaFiles(formData, token);

      // Backend returns { message, summary: { total, assigned, rejected }, results: [...] }
      // where each result is { file, success, productName, productId, image, matchedBy }
      // or { file, success: false, reason }.
      const results = response?.results || [];
      const summary = response?.summary || null;

      if (!Array.isArray(results)) {
        showErrorToast("Upload returned an unexpected response format");
        return;
      }

      const uiResults = results.map((r) => ({
        success: !!r?.success,
        filename: r?.file || "unknown",
        message: r?.success
          ? `Assigned to ${r.productName || `product #${r.productId}`}${
              r.matchedBy ? ` · matched by ${r.matchedBy}` : ""
            }`
          : `Skipped: ${r?.reason || "no matching product for the file name"}`,
      }));

      setBulkUploadResults(uiResults);

      const assigned = summary ? summary.assigned : uiResults.filter((r) => r.success).length;
      const total = summary ? summary.total : uiResults.length;
      const rejected = summary ? summary.rejected : total - assigned;
      const summaryMsg = `Assigned ${assigned}/${total} image(s)${
        rejected ? `, ${rejected} skipped` : ""
      }`;
      if (assigned > 0) {
        showSuccessToast(response?.message || summaryMsg);
      } else {
        showErrorToast(response?.message || summaryMsg);
      }

      // Refresh the grid after upload (no hard reload)
      setShowBulkUploadModal(false);
      setBulkUploadFiles([]);
      loadProcessedMediaItems();
    } catch (error) {
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
      showErrorToast("Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const resetBulkUploadForm = () => {
    setBulkUploadFiles([]);
    setBulkUploadResults([]);
  };

  const getFileUrl = useCallback((type, filename) => {
    if (!filename) {
      return null;
    }

    // Use environment variable for image base URL
    const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://api.amrutkumargovinddasllp.com/uploads';

    // Check if filename already contains the full path
    if (filename.startsWith("/uploads/")) {
      // If it already has the full path, use it directly
      return `${imageBaseUrl}${filename.replace('/uploads', '')}`;
    } else {
      // If it's just the filename, construct the path
      const directory = type === "category" ? "categories" : "products";
      return `${imageBaseUrl}/${directory}/${filename}`;
    }
  }, []);

  const renderProcessedMediaCard = useCallback((item) => {
    // Use processed_image field from API response
    const imagePath = item.processed_image || item.image;
    const fileUrl = getFileUrl(item.type, imagePath);
    return (
      <div key={item.id} className="media-card">
        <div className="media-card-header">
          <div className="media-type-badge">
            {item.type === "category" && <Layers size={16} />}
            {item.type === "product" && <Package size={16} />}
            <span>{item.type?.replace("_", " ")}</span>
          </div>
          <div className="media-actions">
            <a href={fileUrl} download className="action-btn" aria-label="Download" title="Download">
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
              loading="lazy"
              decoding="async"
              key={`${item.id}-${imagePath}`}
              onError={(e) => {
                // Try fallback URL with direct file access
                const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://api.amrutkumargovinddasllp.com/uploads';
                let fallbackUrl;
                if (imagePath.startsWith("/uploads/")) {
                  fallbackUrl = `${imageBaseUrl}${imagePath.replace('/uploads', '')}`;
                } else {
                  fallbackUrl = `${imageBaseUrl}/${
                    item.type === "category" ? "categories" : "products"
                  }/${imagePath}`;
                }
                e.target.src = fallbackUrl;
              }}
            />
          ) : (
            <div className="no-preview">
              <Image size={32} />
              <span>No Preview</span>
            </div>
          )}
          <span className="wm-overlay">
            <Droplet size={11} /> Watermarked
          </span>
        </div>

        <div className="media-info">
          <h4>{item.name}</h4>
          <p className="media-ref">
            {item.type === "category" ? "Category" : "SKU"}:{" "}
            <strong>{item.name}</strong>
          </p>
        </div>
      </div>
    );
  }, [getFileUrl]);

  // Memoize rendered media cards to prevent unnecessary re-renders
  const renderedMediaCards = useMemo(() => {
    return processedMediaItems.map((item) => renderProcessedMediaCard(item));
  }, [processedMediaItems, renderProcessedMediaCard]);

  if (loading) {
    return (
      <div className="media-gallery-page">
        <div className="loading-state">
          <SkeletonCards count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="media-gallery-page">
      {/* Header Section */}
      <div className="media-header-section">
        <div className="table-controls">
          <div className="controls-left">
            <h2 className="page-title">Media Gallery</h2>
          </div>
          <div className="controls-right">
            <button
              className="upload-btn"
              onClick={() => setShowBulkUploadModal(true)}
            >
              <Upload size={16} />
              Upload Images
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="media-grid">
        {processedMediaItems.length > 0 ? (
          renderedMediaCards
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
                        <li key={`${file.name}-${index}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="upload-info">
                <p>
                  <strong>How it works:</strong>
                </p>
                <ul>
                  <li>
                    Each image is assigned to a product by its <strong>file name</strong>{" "}
                    (matched to the product SKU or name)
                  </li>
                  <li>Files whose name matches no product are skipped</li>
                  <li>Assigned images are watermarked and converted to WebP</li>
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
                key={`${result.filename}-${index}`}
                className={`result-item ${
                  result.success ? "success" : "error"
                }`}
              >
                <div className="result-header">
                  <span className="result-status">
                    {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </span>
                  <span className="filename">{result.filename}</span>
                </div>
                <p className="result-message">{result.message}</p>
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
