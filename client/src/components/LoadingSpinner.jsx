import React from 'react';

const LoadingSpinner = ({ size = 40, color = 'var(--accent-color)', minHeight = '300px', inline = false }) => {
  const borderWidth = Math.max(2, Math.round(size / 10));
  
  if (inline) {
    return (
      <div 
        className="animate-spin" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          border: `${borderWidth}px solid #f1f5f9`, 
          borderTopColor: color, 
          borderRadius: '50%', 
          display: 'inline-block',
          verticalAlign: 'middle'
        }}
      ></div>
    );
  }
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        minHeight, 
        width: '100%', 
        padding: '40px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="animate-spin" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          border: `${borderWidth}px solid #f1f5f9`, 
          borderTopColor: color, 
          borderRadius: '50%' 
        }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
