import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import SidePanel from "../components/common/SidePanel";
import { SkeletonTable, SkeletonStats } from "../components/common/Skeleton";
import StatCards from "../components/common/StatCards";
import InputField from "../components/common/InputField";
import IconPicker from "../components/common/IconPicker";
import { HugeiconsIcon } from "@hugeicons/react";
import { resolveCategoryIcon } from "../utils/categoryIcons";
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
  const [form, setForm] = useState({ name: "", description: "", icon: "" });

  // Table shows summary fields only
  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Description", accessor: "description" },
    {
      header: "Icon",
      accessor: "icon",
      cell: (row) => {
        if (!row.icon) {
          return (
            <span style={{ color: "#999", fontSize: "12px" }}>No icon</span>
          );
        }

        return (
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#fbf3e6",
              color: "#5d0829",
            }}
          >
            <HugeiconsIcon icon={resolveCategoryIcon(row.icon)} size={22} />
          </span>
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
                  icon: row.icon || "",
                });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!form.name || form.name.trim() === "") {
        setError("Category name is required");
        return;
      }
      if (!form.icon) {
        setError("Please pick a category icon");
        return;
      }

      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      const data = {
        name: form.name.trim(),
        description: form.description || "",
        icon: form.icon,
      };

      if (editCategory) {
        await updateCategory(editCategory.id, data, token);
      } else {
        await createCategory(data, token);
      }

      setModalOpen(false);
      setEditCategory(null);
      setForm({ name: "", description: "", icon: "" });

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
    setForm({ name: "", description: "", icon: "" });
  };

  const withIcon = categories.filter((c) => c.icon).length;
  const categoryStats = [
    { label: "Total Categories", value: categories.length, tone: "brand" },
    { label: "With Icon", value: withIcon, tone: "success" },
    { label: "No Icon", value: categories.length - withIcon, tone: "neutral" },
  ];

  return (
    <div className="categories-page">
      {loading ? (
        <>
          <SkeletonStats count={3} />
          <SkeletonTable rows={8} cols={5} />
        </>
      ) : (
      <>
      <StatCards stats={categoryStats} />
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
              setForm({ name: "", description: "", icon: "" });
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
      </>
      )}
      <SidePanel
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
          className="form-control"
        />
        <InputField
          label="Description"
          name="description"
          placeholder="Enter description"
          value={form.description}
          onChange={handleInputChange}
          className="form-control"
        />
        <IconPicker
          label="Icon"
          value={form.icon}
          onChange={(name) => setForm((prev) => ({ ...prev, icon: name }))}
        />
        <small style={{ display: "block", marginTop: -2, marginBottom: 10, color: "#8a7a6d", fontSize: 12 }}>
          Pick an icon — it's shown for this category across the apps.
        </small>
        <div className="modal-actions">
          <Button onClick={handleSave} variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </SidePanel>
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
