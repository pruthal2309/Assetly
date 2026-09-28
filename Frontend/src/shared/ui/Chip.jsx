import React from 'react';
import { getHealthBadgeClass } from '../lib/health';

export const Chip = ({ children, variant, className = '' }) => {
  const badgeClass = variant ? getHealthBadgeClass(variant) : '';
  return <span className={`chip ${badgeClass} ${className}`}>{children}</span>;
};

export const Badge = Chip;
