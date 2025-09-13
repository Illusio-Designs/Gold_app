import React, { useState, useEffect } from "react";
import { Edit, Trash2, Upload, Plus, Image as ImageIcon } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import {
  getAllSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  getAllCategories,
} from "../services/adminApiService";
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

  const columns = [
    {
      header: "Title",
      accessor: "title",
      cell: (row) => (
        <div className="slider-info">
          <div className="slider-title">{row.title}</div>
        </div>
      ),
    },
    {
      header: "Image",
      accessor: "image_url",
      cell: (row) => (
        <div className="slider-image">
          {row.image_url ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL?.replace(
                "/api",
                ""
              )}/uploads/slider/${row.image_url}`}
              alt={row.title}
              className="preview-image"
            />
          ) : (
            <div className="no-image">
              <ImageIcon className="icon" />
              No Image
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category_name",
      cell: (row) => (
        <div className="slider-category">
          {row.category_name ? (
            <span className="category-tag">{row.category_name}</span>
          ) : (
            <span className="no-category">No Category</span>
          )}
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row) => (
        <div className="slider-date">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="action-buttons">
          <Button
            onClick={() => handleEdit(row)}
            className="edit-btn"
            size="small"
          >
            <Edit className="icon" />
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(row)}
            className="delete-btn"
            size="small"
          >
            <Trash2 className="icon" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
      console.log("Categories response:", response);
      setCategories(response.data || response || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
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
    console.log("Category selection changed:", { selectedOption, name });
    setForm((prev) => {
      const newForm = {
        ...prev,
        [name]: selectedOption ? selectedOption.value : "",
      };
      console.log("Updated form:", newForm);
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
    setFilePreview(
      slider.image_url
        ? `${import.meta.env.VITE_API_BASE_URL?.replace(
            "/api",
            ""
          )}/uploads/slider/${slider.image_url}`
        : ""
    );
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      console.log("Form data before submission:", form);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category_id", form.category_id || "");
      console.log("FormData values:", {
        title: form.title,
        category_id: form.category_id
      });

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
        description: "",
        link: "",
        category_id: "",
      });
      setSelectedFile(null);
      setFilePreview("");
      loadSliders();
    } catch (err) {
      console.error("Slider save error:", err);
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

  const inputStyle = {
    background: "#f9f2e7",
    borderColor: "#c09e83",
    color: "#5d0829",
  };

  return (
    <div className="slider-page">
      <div className="page-header">
        <h1>Slider Management</h1>
        <p>Manage home page sliders and banners</p>
        <Button onClick={handleCreate} className="create-btn">
          <Plus className="icon" />
          Create New Slider
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <TableWithControls
        data={sliders}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search sliders..."
        filterOptions={[
          {
            key: "title",
            label: "Title",
            options: [
              { value: "", label: "All" },
              ...sliders.map((slider) => ({
                value: slider.title,
                label: slider.title,
              })),
            ],
          },
        ]}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSlider ? "Edit Slider" : "Create New Slider"}
        size="lg"
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
              style={inputStyle}
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
              style={inputStyle}
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
                JPG, PNG, GIF
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
      </Modal>

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
