// client/src/components/FormField.jsx
import React from 'react';
/**
 * Reusable form field component supporting input and textarea.
 * Props:
 *  - label: field label text
 *  - subLabel: optional secondary label (e.g., description)
 *  - placeholder: placeholder text for input/textarea
 *  - value: controlled value
 *  - onChange: callback receiving the new value
 *  - error: error message string (shown below the field)
 *  - isTextarea: boolean to render a textarea instead of input
 *  - rows: number of rows for textarea
 *  - extraLabel: optional JSX element displayed next to the label (e.g., a template link)
 */
function FormField({
  label,
  subLabel,
  placeholder = '',
  value,
  onChange,
  error,
  isTextarea = false,
  rows = 3,
  extraLabel,
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {extraLabel && <span className="extra-label">{extraLabel}</span>}
      </label>
      {subLabel && <p className="form-sub-label">{subLabel}</p>}
      {isTextarea ? (
        <textarea
          rows={rows}
          className={`input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={`input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default FormField;
