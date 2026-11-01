import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import "../../styles/common/FileUpload.css";

/**
 * Dropzone with drag-and-drop + click-to-open and selected-file chips.
 * onFiles(File[]) is called whenever the selection changes.
 */
const FileUpload = ({
  onFiles,
  accept,
  multiple = false,
  hint = "PNG or JPG, up to 5 MB",
  label,
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const emit = (next) => {
    setFiles(next);
    onFiles(next);
  };

  const addFiles = (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;
    const next = multiple ? [...files, ...list] : list.slice(0, 1);
    emit(next);
  };

  const removeAt = (index) => {
    const next = files.filter((_, i) => i !== index);
    emit(next);
  };

  const openPicker = () => inputRef.current && inputRef.current.click();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return (
    <div className="fu-root">
      {label && <span className="fu-label">{label}</span>}

      <div
        className={`fu-zone${dragging ? " fu-zone--active" : ""}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <span className="fu-icon">
          <HugeiconsIcon icon={Upload01Icon} size={28} />
        </span>
        <span className="fu-primary">Drop files or click to upload</span>
        <span className="fu-hint">{hint}</span>
        <input
          ref={inputRef}
          type="file"
          className="fu-input"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="fu-chips">
          {files.map((file, index) => (
            <li className="fu-chip" key={`${file.name}-${index}`}>
              <span className="fu-chip-name" title={file.name}>
                {file.name}
              </span>
              <span className="fu-chip-size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="fu-chip-remove"
                aria-label={`Remove ${file.name}`}
                onClick={() => removeAt(index)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFiles: PropTypes.func.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  hint: PropTypes.string,
  label: PropTypes.string,
};

export default FileUpload;
