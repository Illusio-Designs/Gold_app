import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import { getCategoryImageUrl } from "../utils/imageUtils";
import "../styles/pages/CategoriesPage.css";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/adminApiService";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", image: null });
  const [imagePreview, setImagePreview] = useState("");

  // Table shows summary fields only
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Description", accessor: "description" },
    {
      header: "Image",
      accessor: "image",
      cell: (row) => {
        if (!row.image) {
          return (
            <span style={{ color: "#999", fontSize: "12px" }}>No image</span>
          );
        }

        return (
          <img
            src={getCategoryImageUrl(row.image)}
            alt={row.name}
            style={{ width: 40, height: 40, objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => {
        return (
          <div
            className="action-buttons"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditCategory(row);
                setForm({
                  name: row.name || "",
                  description: row.description || "",
                  image: null,
                });
                setImagePreview(
                  row.image ? getCategoryImageUrl(row.image) : ""
                );
                setModalOpen(true);
              }}
              tooltip="Edit"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteCategory(row);
              }}
              tooltip="Delete"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("admin_token");
        const response = await getAllCategories(token);

        // Extract the data array from the response
        const data = response.data || response;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const inputStyle = {
    background: "#f9f2e7",
    borderColor: "#c09e83",
    color: "#5d0829",
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : "");
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!form.name || form.name.trim() === "") {
        setError("Category name is required");
        return;
      }

      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      const data = new FormData();
      data.append("name", form.name.trim());
      data.append("description", form.description || "");
      if (form.image) data.append("image", form.image);

      if (editCategory) {
        await updateCategory(editCategory.id, data, token);
      } else {
        await createCategory(data, token);
      }

      setModalOpen(false);
      setEditCategory(null);
      setForm({ name: "", description: "", image: null });
      setImagePreview("");

      // Refresh
      const response = await getAllCategories(token);
      const cats = response.data || response;
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      await deleteCategory(deleteCategory.id, token);
      setDeleteCategory(null);
      // Refresh
      const response = await getAllCategories(token);
      const cats = response.data || response;
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditCategory(null);
    setForm({ name: "", description: "", image: null });
    setImagePreview("");
  };

  return (
    <div className="categories-page">
      <TableWithControls
        columns={columns}
        data={categories}
        searchFields={["name"]}
        pageTitle="Category Management"
        loading={loading}
        actions={
          <Button
            onClick={() => {
              setEditCategory(null);
              setForm({ name: "", description: "", image: null });
              setImagePreview("");
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Category
          </Button>
        }
        itemsPerPage={10}
        errorMessage={error}
      />
      <Modal
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editCategory ? "Edit Category" : "Add Category"}
      >
        <InputField
          label="Name"
          name="name"
          placeholder="Enter category name"
          value={form.name}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Description"
          name="description"
          placeholder="Enter description"
          value={form.description}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={inputStyle}
        />
        {imagePreview && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          </div>
        )}
        <div className="modal-actions">
          <Button onClick={handleSave} variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        title="Delete Category"
      >
        <p>
          Are you sure you want to delete category <b>{deleteCategory?.name}</b>
          ?
        </p>
        <div className="modal-actions">
          <Button onClick={handleDelete} variant="danger" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={() => setDeleteCategory(null)} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
