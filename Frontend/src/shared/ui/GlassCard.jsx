import React from 'react';

export const GlassCard = ({ children, className = '', style = {}, onClick }) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
