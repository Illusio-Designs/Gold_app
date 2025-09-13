import React from "react";
import { Search } from "lucide-react";
import "../../styles/common/SearchBar.css";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <form className="search-form" onSubmit={(e) => e.preventDefault()}>
      <div className="search-group">
        <span className="search-icon">
          <Search size={20} />
        </span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </form>
  );
};

export default SearchBar;
