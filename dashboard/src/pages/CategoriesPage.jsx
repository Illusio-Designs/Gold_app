import React, { useState, useEffect } from "react";
import {
  Edit02Icon,
  Delete02Icon,
  Add01Icon,
  FolderLibraryIcon,
} from "@hugeicons/core-free-icons";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import SidePanel from "../components/common/SidePanel";
import { SkeletonCards, SkeletonStats } from "../components/common/Skeleton";
import StatCards from "../components/common/StatCards";
import InputField from "../components/common/InputField";
import IconPicker from "../components/common/IconPicker";
import Tooltip from "../components/common/Tooltip";
import EmptyState from "../components/common/EmptyState";
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

  const startEdit = (row) => {
    setEditCategory(row);
    setForm({
      name: row.name || "",
      description: row.description || "",
      icon: row.icon || "",
    });
    setModalOpen(true);
  };

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
          <SkeletonCards count={8} />
        </>
      ) : (
      <>
      <StatCards stats={categoryStats} />

      <div className="au-sechead">
        <h2>Category Management</h2>
        <span className="au-muted">{categories.length} total</span>
        <div className="au-spacer" />
        <Button
          onClick={() => {
            setEditCategory(null);
            setForm({ name: "", description: "", icon: "" });
            setModalOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add Category
        </Button>
      </div>

      {error && <div className="au-notice">{error}</div>}

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderLibraryIcon}
          title="No categories yet"
          message="Create your first category to organise the catalogue."
        />
      ) : (
        <div className="au-pgrid cat-grid">
          {categories.map((row) => (
            <div className="au-pcard" key={row.id}>
              <div className="au-ph cat-ph">
                {row.icon ? (
                  <HugeiconsIcon
                    icon={resolveCategoryIcon(row.icon)}
                    size={46}
                  />
                ) : (
                  <span className="cat-noicon">No icon</span>
                )}
              </div>
              <div className="au-pb">
                <div className="au-pn">{row.name}</div>
                <div className="au-pm">
                  {row.description || "No description"}
                </div>
                <div className="au-pr">
                  <Badge tone={row.icon ? "success" : "neutral"}>
                    {row.icon ? "Icon set" : "No icon"}
                  </Badge>
                  <div className="cat-actions">
                    <Tooltip text="Edit">
                      <button
                        type="button"
                        className="au-rowbtn"
                        onClick={() => startEdit(row)}
                        aria-label="Edit category"
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={15} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Delete">
                      <button
                        type="button"
                        className="au-rowbtn cat-del"
                        onClick={() => setDeleteCategory(row)}
                        aria-label="Delete category"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
        <small className="cat-hint">
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
