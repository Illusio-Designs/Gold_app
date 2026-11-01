import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import "../../styles/common/SearchBar.css";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <form className="search-form" onSubmit={(e) => e.preventDefault()}>
      <div className="search-group">
        <span className="search-icon">
          <HugeiconsIcon icon={Search01Icon} size={20} />
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
