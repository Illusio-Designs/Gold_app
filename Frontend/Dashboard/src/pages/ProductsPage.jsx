import React, { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Image as ImageIcon,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import TableWithControls from "../components/common/TableWithControls";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import InputField from "../components/common/InputField";
import DropdownSelect from "../components/common/DropdownSelect";
import ExcelImport from "../components/ExcelImport";
import { getProductImageUrl } from "../utils/imageUtils";
import "../styles/pages/ProductsPage.css";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getProductImages,
  deleteProductImage,
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
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
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
    { header: "Name", accessor: "name" },
    {
      header: "Image",
      accessor: "image",
      cell: (row) =>
        row.image ? (
          <img
            src={getProductImageUrl(row.image)}
            alt={row.name}
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        ) : (
          "-"
        ),
    },
    { header: "Net Wt.", accessor: "net_weight" },
    { header: "SKU", accessor: "sku" },
    { header: "Pieces", accessor: "pieces" },
    { header: "Purity", accessor: "purity" },
    { header: "MRP", accessor: "mark_amount" },
    {
      header: "Stock Status",
      accessor: "stock_status",
      cell: (row) => {
        const statusColors = {
          available: "bg-green-100 text-green-800",
          out_of_stock: "bg-red-100 text-red-800",
          reserved: "bg-yellow-100 text-yellow-800",
        };
        const statusLabels = {
          available: "Available",
          out_of_stock: "Out of Stock",
          reserved: "Reserved",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[row.stock_status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {statusLabels[row.stock_status] || row.stock_status || "N/A"}
          </span>
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
            <Edit size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteProduct(row)}
            tooltip="Delete"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProduct(row);
              setImageModalOpen(true);
            }}
            tooltip="Manage Images"
          >
            <ImageIcon size={16} />
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
            📦
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
      console.log("🔍 [ProductsPage] handleDelete called for:", deleteProduct);
      setLoading(true);
      setError("");
      const token = localStorage.getItem("admin_token");
      console.log(
        "🔍 [ProductsPage] Admin token:",
        token ? "Present" : "Missing"
      );

      await deleteProduct(deleteProduct.id, token);
      console.log("✅ [ProductsPage] Product deleted successfully");

      setDeleteProduct(null);

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

  return (
    <div className="products-page">
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
              <Plus size={16} />
              Add Product
            </Button>
            <Button
              onClick={() => setExcelImportModalOpen(true)}
              variant="outline"
              className="excel-import-btn"
            >
              <FileSpreadsheet size={16} />
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
      <Modal
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
          style={inputStyle}
        />
        <InputField
          label="Name"
          name="name"
          placeholder="Enter product name"
          value={form.name}
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
        <InputField
          label="Net Weight"
          name="net_weight"
          placeholder="Enter net weight"
          value={form.net_weight}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Gross Weight"
          name="gross_weight"
          placeholder="Enter gross weight"
          value={form.gross_weight}
          onChange={handleInputChange}
          style={inputStyle}
        />

        <InputField
          label="Size"
          name="size"
          placeholder="Enter size"
          value={form.size}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Attributes"
          name="attributes"
          placeholder="Enter attributes"
          value={form.attributes}
          onChange={handleInputChange}
          style={inputStyle}
        />

        <InputField
          label="SKU"
          name="sku"
          placeholder="Enter SKU"
          value={form.sku}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <InputField
          label="Pieces"
          name="pieces"
          placeholder="Enter number of pieces"
          value={form.pieces}
          onChange={handleInputChange}
          style={inputStyle}
        />
        <DropdownSelect
          label="Purity"
          name="purity"
          options={purityOptions.slice(1)}
          value={
            form.purity ? { value: form.purity, label: form.purity } : null
          }
          onChange={handleDropdownChange}
          style={inputStyle}
        />
        <InputField
          label="MRP"
          name="mark_amount"
          placeholder="Enter Maximum Retail Price"
          value={form.mark_amount}
          onChange={handleInputChange}
          style={inputStyle}
        />

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
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title="Manage Product Images"
      >
        <p>Product image management UI goes here.</p>
        <div className="modal-actions">
          <Button onClick={() => setImageModalOpen(false)} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
      >
        <p>
          Are you sure you want to delete product <b>{deleteProduct?.name}</b>?
        </p>
        <div className="modal-actions">
          <Button onClick={handleDelete} variant="danger" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={() => setDeleteProduct(null)} variant="secondary">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal
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
      </Modal>

      {/* Stock Management Modal */}
      <Modal
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
      </Modal>
    </div>
  );
};

export default ProductsPage;
