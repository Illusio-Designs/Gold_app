import React, { useState, useEffect } from "react";
import { Edit, Trash2, Upload, Plus, Image as ImageIcon } from "lucide-react";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import SidePanel from "../components/common/SidePanel";
import { SkeletonCards, SkeletonStats } from "../components/common/Skeleton";
import StatCards from "../components/common/StatCards";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import {
  getAllSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  getAllCategories,
} from "../services/adminApiService";
import { getSliderImageUrl } from "../utils/imageUtils";
import "../styles/pages/SliderPage.css";

const SliderPage = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSlider, setEditSlider] = useState(null);
  const [deleteSliderItem, setDeleteSliderItem] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category_id: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadSliders();
    loadCategories();
  }, []);

  const loadSliders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      const data = await getAllSliders(token);
      setSliders(data || []);
    } catch (err) {
      setError("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await getAllCategories(token);
      setCategories(response.data || response || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    setForm((prev) => {
      const newForm = {
        ...prev,
        [name]: selectedOption ? selectedOption.value : "",
      };
      return newForm;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError(""); // Clear any previous errors
    }
  };

  const handleCreate = () => {
    setEditSlider(null);
    setForm({
      title: "",
      category_id: "",
    });
    setSelectedFile(null);
    setFilePreview("");
    setModalOpen(true);
  };

  const handleEdit = (slider) => {
    setEditSlider(slider);
    setForm({
      title: slider.title || "",
      category_id: slider.category_id || "",
    });
    setSelectedFile(null);
    setFilePreview(slider.image_url ? getSliderImageUrl(slider.image_url) : "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category_id", form.category_id || "");

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (editSlider) {
        await updateSlider(editSlider.id, formData, token);
      } else {
        await createSlider(formData, token);
      }

      setModalOpen(false);
      setEditSlider(null);
      setForm({
        title: "",
        category_id: "",
      });
      setSelectedFile(null);
      setFilePreview("");
      loadSliders();
    } catch (err) {
      if (err.response) {
        // Server responded with error
        const errorMessage =
          err.response.data?.error || err.response.statusText || "Server error";
        setError(`Failed to save slider: ${errorMessage}`);
      } else if (err.request) {
        // Network error
        setError("Network error: Please check your connection");
      } else {
        // Other error
        setError(`Error: ${err.message || "Unknown error occurred"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (slider) => {
    setDeleteSliderItem(slider);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      await deleteSlider(deleteSliderItem.id, token);
      setDeleteSliderItem(null);
      loadSliders();
    } catch (err) {
      setError("Failed to delete slider");
    } finally {
      setLoading(false);
    }
  };

  const sliderCategories = new Set(
    sliders.map((s) => s.category_name).filter(Boolean)
  ).size;
  const sliderStats = [
    { label: "Total Slides", value: sliders.length, tone: "brand" },
    { label: "Categories", value: sliderCategories, tone: "info" },
  ];

  return (
    <div className="slider-page">
      {loading ? (
        <>
          <SkeletonStats count={2} />
          <SkeletonCards count={6} />
        </>
      ) : (
      <>
      <StatCards stats={sliderStats} />

      <div className="au-sechead">
        <h2>Slider Management</h2>
        <span className="au-muted">{sliders.length} banners</span>
        <div className="au-spacer" />
        <Button onClick={handleCreate}>
          <Plus size={16} />
          Create New Slider
        </Button>
      </div>

      {error && <div className="au-notice">{error}</div>}

      {sliders.length === 0 ? (
        <div className="au-card au-empty">
          <div className="au-empty-title">No slides yet</div>
          <p>Create a home banner to feature on the storefront.</p>
        </div>
      ) : (
        <div className="au-pgrid slider-grid">
          {sliders.map((row) => (
            <div className="au-pcard" key={row.id}>
              <div className="au-ph slider-ph" style={{ aspectRatio: "16/7" }}>
                {row.image_url ? (
                  <img
                    src={getSliderImageUrl(row.image_url)}
                    alt={row.title}
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="slider-noimg">
                    <ImageIcon size={26} />
                    <span>No Image</span>
                  </div>
                )}
                <span className="au-stk">
                  <Badge tone={row.category_name ? "brand" : "neutral"}>
                    {row.category_name || "No category"}
                  </Badge>
                </span>
              </div>
              <div className="au-pb">
                <div className="au-pn">{row.title}</div>
                <div className="au-pr">
                  <span className="au-sub">
                    Added {new Date(row.created_at).toLocaleDateString()}
                  </span>
                  <div className="slider-actions">
                    <button
                      type="button"
                      className="au-rowbtn"
                      onClick={() => handleEdit(row)}
                      title="Edit"
                      aria-label="Edit slider"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      className="au-rowbtn slider-del"
                      onClick={() => handleDelete(row)}
                      title="Delete"
                      aria-label="Delete slider"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Create/Edit Panel */}
      <SidePanel
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSlider ? "Edit Slider" : "Create New Slider"}
        size="large"
      >
        <div className="form-grid">
          <div className="form-row">
            <InputField
              label="Title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Enter slider title"
              required
              className="form-control"
            />
          </div>

          <div className="form-row">
            <DropdownSelect
              label="Category"
              name="category_id"
              value={form.category_id}
              onChange={handleDropdownChange}
              options={[
                { value: "", label: "Select a category" },
                ...(Array.isArray(categories) ? categories : []).map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
              placeholder="Select a category"
              required
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="file-upload">
              <label
                className={`file-label ${selectedFile ? "has-file" : ""}`}
                htmlFor="slider-image-upload"
                onClick={() => {
                  document.getElementById("slider-image-upload").click();
                }}
              >
                <Upload className="icon" />
                {selectedFile ? (
                  <>
                    <strong>File Selected: {selectedFile.name}</strong>
                    <br />
                    <small style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Click to change file
                    </small>
                  </>
                ) : (
                  <>
                    {editSlider ? "Change Image" : "Upload Image"}
                    <br />
                    <small style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Click here to browse files
                    </small>
                  </>
                )}
              </label>
              <input
                id="slider-image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                required={!editSlider}
                style={{ display: "none" }}
              />
            </div>
            <div className="file-help-text">
              <small>
                Click the upload area to select an image. Supported formats:
                JPG, PNG, GIF. Recommended: <strong>1200 × 600 px</strong> (2:1
                wide banner) for a proper full-width look in the app.
              </small>
            </div>
          </div>

          {filePreview && (
            <div className="form-row">
              <div className="image-preview">
                <img src={filePreview} alt="Preview" className="preview-img" />
              </div>
            </div>
          )}

          <div className="form-actions">
            <Button onClick={handleSave} className="save-btn">
              {editSlider ? "Update Slider" : "Create Slider"}
            </Button>
            <Button
              onClick={() => setModalOpen(false)}
              className="cancel-btn"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SidePanel>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteSliderItem}
        onClose={() => setDeleteSliderItem(null)}
        title="Delete Slider"
        size="md"
      >
        <div className="delete-confirmation">
          <p>
            Are you sure you want to delete the slider "
            {deleteSliderItem?.title}"?
          </p>
          <p>This action cannot be undone.</p>

          <div className="delete-actions">
            <Button onClick={confirmDelete} className="confirm-delete-btn">
              Delete Slider
            </Button>
            <Button
              onClick={() => setDeleteSliderItem(null)}
              className="cancel-btn"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SliderPage;


