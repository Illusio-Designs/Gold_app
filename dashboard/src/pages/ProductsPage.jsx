import React, { useState, useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete02Icon,
  File01Icon,
  Add01Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import SidePanel from "../components/common/SidePanel";
import FileUpload from "../components/common/FileUpload";
import { SkeletonTable, SkeletonStats } from "../components/common/Skeleton";
import StatCards from "../components/common/StatCards";
import Badge from "../components/common/Badge";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import ExcelImport from "../components/ExcelImport";
import { getProductImageUrl } from "../utils/imageUtils";
import "../styles/pages/ProductsPage.css";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  updateProductStockStatus,
} from "../services/adminApiService";

const purityOptions = [
  { value: "", label: "All Purities" },
  { value: "18K", label: "18K" },
  { value: "22K", label: "22K" },
];

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    stock_status: "available",
    notes: "",
  });
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    image: null,
    net_weight: "",
    gross_weight: "",
    size: "",
    attributes: "",
    sku: "",
    purity: "",
    pieces: "",
    mark_amount: "",
  });
  const [imagePreview, setImagePreview] = useState("");

  const categoryOptions = useMemo(() => {
    return [
      { value: "", label: "All Categories" },
      ...(Array.isArray(categories)
        ? categories.map((cat) => ({ value: cat.id, label: cat.name }))
        : []),
    ];
  }, [categories]);

  const categoryMap = useMemo(() => {
    return Array.isArray(categories)
      ? Object.fromEntries(categories.map((cat) => [cat.id, cat.name]))
      : {};
  }, [categories]);

  const columns = [
    {
      header: "Category",
      accessor: "category_id",
      cell: (row) => categoryMap[row.category_id] || row.category_id,
    },
    {
      header: "Name",
      accessor: "name",
      cell: (row) => <span className="au-ono">{row.name}</span>,
    },
    {
      header: "Image",
      accessor: "image",
      cell: (row) => (
        <div className="au-thumb">
          {row.image && (
            <img
              src={getProductImageUrl(row.image)}
              alt={row.name}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          )}
          <span
            className="au-thumb-ph"
            style={{ display: row.image ? "none" : "flex" }}
          >
            <HugeiconsIcon icon={PackageIcon} size={16} />
          </span>
        </div>
      ),
    },
    {
      header: "Net Wt.",
      accessor: "net_weight",
      cell: (row) => <span className="tnum">{row.net_weight}</span>,
    },
    {
      header: "SKU",
      accessor: "sku",
      cell: (row) => <span className="au-ono">{row.sku}</span>,
    },
    {
      header: "Pieces",
      accessor: "pieces",
      cell: (row) => <span className="tnum">{row.pieces}</span>,
    },
    {
      header: "Purity",
      accessor: "purity",
      cell: (row) =>
        row.purity ? (
          <span className="au-chan au-c-b2c">{row.purity}</span>
        ) : (
          <span className="au-sub">—</span>
        ),
    },
    {
      header: "MRP",
      accessor: "mark_amount",
      cell: (row) => <span className="au-amt tnum">{row.mark_amount}</span>,
    },
    {
      header: "Stock Status",
      accessor: "stock_status",
      cell: (row) => {
        const statusTones = {
          available: "success",
          out_of_stock: "danger",
          reserved: "warning",
        };
        const statusLabels = {
          available: "Available",
          out_of_stock: "Out of Stock",
          reserved: "Reserved",
        };
        return (
          <Badge tone={statusTones[row.stock_status] || "neutral"}>
            {statusLabels[row.stock_status] || row.stock_status || "N/A"}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditProduct(row);
              setForm({
                category_id: row.category_id || "",
                name: row.name || "",
                image: null,
                net_weight: row.net_weight || "",
                gross_weight: row.gross_weight || "",
                size: row.size || "",
                attributes: row.attributes || "",
                sku: row.sku || "",
                purity: row.purity || "",
                pieces: row.pieces || "",
                mark_amount: row.mark_amount || "",
              });
              setImagePreview(row.image ? getProductImageUrl(row.image) : "");
              setModalOpen(true);
            }}
            tooltip="Edit"
          >
            <HugeiconsIcon icon={Edit02Icon} size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setProductToDelete(row)}
            tooltip="Delete"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStockProduct(row);
              setStockForm({
                stock_status: row.stock_status || "available",
                notes: "",
              });
              setStockModalOpen(true);
            }}
            tooltip="Manage Stock"
          >
            <HugeiconsIcon icon={PackageIcon} size={16} />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch functions for refreshing data
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await getAllProducts(token);
      const productsData = response.data || response;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error("Failed to refresh products:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await getAllCategories(token);
      const categoriesData = response.data || response;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Failed to refresh categories:", err);
      setCategories([]); // Set empty array on error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("admin_token");
        const [productsResponse, categoriesResponse] = await Promise.all([
          getAllProducts(token),
          getAllCategories(token),
        ]);
        
        // Extract data from responses
        const productsData = productsResponse.data || productsResponse;
        const categoriesData = categoriesResponse.data || categoriesResponse;
        
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        setError("Failed to load data");
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  // Handle react-select dropdown changes
  const handleDropdownChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : "";
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("category_id", form.category_id);
      formData.append("name", form.name);
      if (form.image) {
        formData.append("image", form.image);
      }
      formData.append("net_weight", form.net_weight || "");
      formData.append("gross_weight", form.gross_weight || "");
      formData.append("size", form.size || "");
      formData.append("attributes", form.attributes || "");
      formData.append("sku", form.sku || "");
      formData.append("purity", form.purity || "");
      formData.append("pieces", form.pieces || "");
      formData.append("mark_amount", form.mark_amount || "");

      if (editProduct) {
        await updateProduct(editProduct.id, formData, token);
      } else {
        await createProduct(formData, token);
      }

      setModalOpen(false);
      setEditProduct(null);
      setForm({
        category_id: "",
        name: "",
        image: null,
        net_weight: "",
        gross_weight: "",
        size: "",
        attributes: "",
        sku: "",
        purity: "",
        pieces: "",
        mark_amount: "",
      });
      setImagePreview("");

      // Refresh products
      const response = await getAllProducts(token);
      const data = response.data || response;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      await deleteProduct(productToDelete.id, token);

      setProductToDelete(null);

      // Refresh products
      const response = await getAllProducts(token);
      const data = response.data || response;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ [ProductsPage] Error deleting product:", err);
      setError("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditProduct(null);
    setForm({
      category_id: "",
      name: "",
      image: null,
      net_weight: "",
      gross_weight: "",
      size: "",
      attributes: "",
      sku: "",
      purity: "",
      pieces: "",
      mark_amount: "",
    });
    setImagePreview("");
  };

  const handleStockUpdate = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");

      await updateProductStockStatus(stockProduct.id, stockForm, token);

      setStockModalOpen(false);
      setStockProduct(null);
      setStockForm({ stock_status: "available", notes: "" });

      // Refresh products
      const response = await getAllProducts(token);
      const data = response.data || response;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error updating stock:", err);
      setError(err.response?.data?.error || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const inStock = products.filter((p) => p.stock_status !== "out_of_stock").length;
  const outOfStock = products.filter((p) => p.stock_status === "out_of_stock").length;
  const productStats = [
    { label: "Total Products", value: products.length, tone: "brand" },
    { label: "In Stock", value: inStock, tone: "success" },
    { label: "Out of Stock", value: outOfStock, tone: "danger" },
    { label: "Categories", value: categories.length, tone: "info" },
  ];

  return (
    <div className="products-page">
      {loading ? (
        <>
          <SkeletonStats count={4} />
          <SkeletonTable rows={8} cols={5} />
        </>
      ) : (
      <>
      <StatCards stats={productStats} />
      <TableWithControls
        columns={columns}
        data={products}
        searchFields={["name", "sku", "category_id", "purity"]}
        pageTitle="Product Management"
        loading={loading}
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={() => {
                setEditProduct(null);
                setForm({
                  category_id: "",
                  name: "",
                  image: null,
                  net_weight: "",
                  gross_weight: "",
                  size: "",
                  attributes: "",
                  sku: "",
                  purity: "",
                  pieces: "",
                  mark_amount: "",
                });
                setImagePreview("");
                setModalOpen(true);
              }}
            >
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Add Product
            </Button>
            <Button
              onClick={() => setExcelImportModalOpen(true)}
              variant="outline"
              className="excel-import-btn"
            >
              <HugeiconsIcon icon={File01Icon} size={16} />
              Import Excel
            </Button>
          </div>
        }
        filters={[
          {
            key: "category_id",
            options: categoryOptions,
            placeholder: "Filter by category",
          },
          {
            key: "purity",
            options: purityOptions,
            placeholder: "Filter by purity",
          },
        ]}
        errorMessage={error}
      />
      </>
      )}
      <SidePanel
        isOpen={modalOpen}
        onClose={handleCancel}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <DropdownSelect
          label="Category"
          name="category_id"
          options={categoryOptions.slice(1)}
          value={
            form.category_id
              ? {
                  value: form.category_id,
                  label: categoryMap[form.category_id] || form.category_id,
                }
              : null
          }
          onChange={handleDropdownChange}
          className="form-control"
        />
        <InputField
          label="Name"
          name="name"
          placeholder="Enter product name"
          value={form.name}
          onChange={handleInputChange}
          className="form-control"
        />
        <FileUpload
          label="Image"
          accept="image/*"
          hint="PNG or JPG — square 1080 × 1080 px (1:1) recommended; the app crops to a square."
          onFiles={(files) => {
            const file = files[0] || null;
            setForm((prev) => ({ ...prev, image: file }));
            setImagePreview(file ? URL.createObjectURL(file) : "");
          }}
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
        <InputField
          label="Net Weight"
          name="net_weight"
          placeholder="Enter net weight"
          value={form.net_weight}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Gross Weight"
          name="gross_weight"
          placeholder="Enter gross weight"
          value={form.gross_weight}
          onChange={handleInputChange}
          className="form-control"
        />

        <InputField
          label="Size"
          name="size"
          placeholder="Enter size"
          value={form.size}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Attributes"
          name="attributes"
          placeholder="Enter attributes"
          value={form.attributes}
          onChange={handleInputChange}
          className="form-control"
        />

        <InputField
          label="SKU"
          name="sku"
          placeholder="Enter SKU"
          value={form.sku}
          onChange={handleInputChange}
          className="form-control"
        />
        <InputField
          label="Pieces"
          name="pieces"
          placeholder="Enter number of pieces"
          value={form.pieces}
          onChange={handleInputChange}
          className="form-control"
        />
        <DropdownSelect
          label="Purity"
          name="purity"
          options={purityOptions.slice(1)}
          value={
            form.purity ? { value: form.purity, label: form.purity } : null
          }
          onChange={handleDropdownChange}
          className="form-control"
        />
        <InputField
          label="MRP"
          name="mark_amount"
          placeholder="Enter Maximum Retail Price"
          value={form.mark_amount}
          onChange={handleInputChange}
          className="form-control"
        />

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
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Delete Product"
      >
        <p>
          Are you sure you want to delete product <b>{productToDelete?.name}</b>?
        </p>
        <div className="modal-actions">
          <Button onClick={handleDelete} variant="danger" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={() => setProductToDelete(null)} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Excel Import side panel */}
      <SidePanel
        isOpen={excelImportModalOpen}
        onClose={() => setExcelImportModalOpen(false)}
        title="Import Products & Categories from Excel"
        size="large"
      >
        <ExcelImport
          token={localStorage.getItem("admin_token")}
          onImportComplete={(result) => {
            console.log("Excel import completed:", result);
            setExcelImportModalOpen(false);
            // Show success message
            setError(""); // Clear any existing errors
            // Refresh products and categories after import
            fetchProducts();
            fetchCategories();
          }}
        />
        <div className="modal-actions">
          <Button
            onClick={() => setExcelImportModalOpen(false)}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </SidePanel>

      {/* Stock Management side panel */}
      <SidePanel
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="Manage Product Stock"
      >
        {stockProduct && (
          <div className="stock-management-form">
            <div className="product-info">
              <h4>Product: {stockProduct.name}</h4>
              <p>SKU: {stockProduct.sku}</p>
              <p>
                Current Status:{" "}
                <span className={`status-badge ${stockProduct.stock_status}`}>
                  {stockProduct.stock_status === "available"
                    ? "Available"
                    : stockProduct.stock_status === "out_of_stock"
                    ? "Out of Stock"
                    : stockProduct.stock_status === "reserved"
                    ? "Reserved"
                    : "N/A"}
                </span>
              </p>
            </div>

            <div className="form-group">
              <label>New Stock Status:</label>
              <select
                value={stockForm.stock_status}
                onChange={(e) =>
                  setStockForm((prev) => ({
                    ...prev,
                    stock_status: e.target.value,
                  }))
                }
                className="form-select"
              >
                <option value="available">Available</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={stockForm.notes}
                onChange={(e) =>
                  setStockForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add notes about this stock status change..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <Button
                onClick={handleStockUpdate}
                variant="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Stock"}
              </Button>
              <Button
                onClick={() => setStockModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
};

export default ProductsPage;
