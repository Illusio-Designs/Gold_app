import React, { useState, useEffect } from "react";
import Table from "./Table";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import DropdownSelect from "./DropdownSelect";
import "../../styles/common/TableWithControls.css";

const TableWithControls = ({
  columns,
  data,
  itemsPerPage = 10,
  searchFields = [],
  pageTitle,
  actions,
  filters = [],
  onRowClick,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (!Array.isArray(data)) {
      setFilteredData([]);
      return;
    }
    let result = [...data];
    if (searchTerm && Array.isArray(searchFields) && searchFields.length > 0) {
      result = result.filter((item) =>
        searchFields.some(
          (field) =>
            item[field] &&
            String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(
          (item) => String(item[key] || "") === String(value)
        );
      }
    });
    setFilteredData(result);
    setCurrentPage(1);
  }, [data, searchTerm, selectedFilters]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (key, value) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`table-with-controls ${className}`}>
      <div className="table-controls">
        <div className="controls-left">
          {pageTitle && <h2 className="page-title">{pageTitle}</h2>}
        </div>
        <div className="controls-right">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search..."
          />
          {filters.map((filter) => (
            <DropdownSelect
              key={filter.key}
              options={filter.options}
              value={selectedFilters[filter.key] || ""}
              onChange={(option) =>
                handleFilterChange(filter.key, option.value)
              }
              placeholder={filter.placeholder}
            />
          ))}
          {actions}
        </div>
      </div>

      <div className="table-entries-scroll">
        <Table columns={columns} data={paginatedData} onRowClick={onRowClick} />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TableWithControls;
