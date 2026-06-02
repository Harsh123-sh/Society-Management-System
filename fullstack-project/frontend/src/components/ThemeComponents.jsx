/**
 * Comprehensive theme-aware components that use CSS variables
 * for automatic dark/light mode support
 */

import React from 'react';

/**
 * ThemeSection - wraps page sections with proper theming
 */
export const ThemeSection = ({ 
  className = '', 
  children,
  background = 'var(--background)',
  ...props 
}) => (
  <section 
    className={`transition-colors duration-300 ${className}`}
    style={{ background }}
    {...props}
  >
    {children}
  </section>
);

/**
 * ThemeCard - wraps card content with proper contrast
 */
export const ThemeCard = ({ 
  className = '', 
  children,
  elevated = false,
  ...props 
}) => (
  <div 
    className={`p-4 rounded-lg border transition-colors duration-300 ${className}`}
    style={{
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      boxShadow: elevated ? 'var(--shadow-elevated)' : 'var(--shadow-sm)',
    }}
    {...props}
  >
    {children}
  </div>
);

/**
 * ThemeHeading - semantic headings with proper contrast
 */
export const ThemeHeading = ({ 
  level = 1, 
  className = '', 
  children,
  muted = false,
  ...props 
}) => {
  const Tag = `h${level}`;
  return (
    <Tag 
      className={`${className}`}
      style={{ 
        color: muted ? 'var(--text-muted)' : 'var(--text)',
        transition: 'color 200ms ease',
      }}
      {...props}
    >
      {children}
    </Tag>
  );
};

/**
 * ThemeText - paragraph text with proper contrast
 */
export const ThemeText = ({ 
  className = '', 
  children,
  muted = false,
  ...props 
}) => (
  <p 
    className={`${className}`}
    style={{ 
      color: muted ? 'var(--text-muted)' : 'var(--text)',
      transition: 'color 200ms ease',
    }}
    {...props}
  >
    {children}
  </p>
);

/**
 * ThemeMutedText - smaller, muted text
 */
export const ThemeMutedText = ({ 
  className = '', 
  children,
  ...props 
}) => (
  <span 
    className={`text-sm ${className}`}
    style={{ 
      color: 'var(--text-muted)',
      transition: 'color 200ms ease',
    }}
    {...props}
  >
    {children}
  </span>
);

/**
 * ThemeInput - form input with theme support
 */
export const ThemeInput = ({ 
  className = '', 
  placeholder = '',
  ...props 
}) => (
  <input 
    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${className}`}
    placeholder={placeholder}
    style={{
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text)',
    }}
    {...props}
  />
);

/**
 * ThemeSelect - form select with theme support
 */
export const ThemeSelect = ({ 
  className = '', 
  children,
  ...props 
}) => (
  <select 
    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${className}`}
    style={{
      backgroundColor: 'var(--input-bg)',
      borderColor: 'var(--input-border)',
      color: 'var(--text)',
    }}
    {...props}
  >
    {children}
  </select>
);

/**
 * ThemeButton - button with theme-aware colors
 */
export const ThemeButton = ({ 
  className = '', 
  children,
  variant = 'primary', // primary, secondary, ghost, danger, success
  disabled = false,
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--secondary)',
          color: '#ffffff',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--error)',
          color: '#ffffff',
        };
      case 'success':
        return {
          backgroundColor: 'var(--success)',
          color: '#ffffff',
        };
      default:
        return {};
    }
  };

  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${className}`}
      style={{
        ...getVariantStyles(),
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * FeatureCard - landing page feature card with proper contrast
 */
export const FeatureCard = ({ 
  title = '',
  description = '',
  icon = null,
  className = '',
  ...props 
}) => (
  <ThemeCard className={`flex flex-col gap-3 ${className}`} {...props}>
    {icon && <div className="text-2xl">{icon}</div>}
    <ThemeHeading level={3} className="text-lg font-semibold">
      {title}
    </ThemeHeading>
    <ThemeText muted className="text-sm leading-relaxed">
      {description}
    </ThemeText>
  </ThemeCard>
);

/**
 * DashboardCard - dashboard metrics card
 */
export const DashboardCard = ({ 
  label = '',
  value = '',
  icon = null,
  trend = null,
  className = '',
  ...props 
}) => (
  <ThemeCard className={`p-6 ${className}`} {...props}>
    <div className="flex items-center justify-between">
      <div>
        <ThemeMutedText>{label}</ThemeMutedText>
        <div 
          className="text-2xl font-bold mt-2"
          style={{ color: 'var(--text)' }}
        >
          {value}
        </div>
      </div>
      {icon && <div className="text-4xl opacity-20">{icon}</div>}
    </div>
    {trend && (
      <div 
        className="text-xs mt-3 font-medium"
        style={{ color: trend > 0 ? 'var(--success)' : 'var(--error)' }}
      >
        {trend > 0 ? '+' : ''}{trend}%
      </div>
    )}
  </ThemeCard>
);

/**
 * ThemeAlert - alert message with theme support
 */
export const ThemeAlert = ({ 
  type = 'info', // info, success, warning, error
  title = '',
  message = '',
  className = '',
  ...props 
}) => {
  const getAlertColors = () => {
    switch (type) {
      case 'success':
        return { bg: 'var(--success)', text: '#ffffff' };
      case 'error':
        return { bg: 'var(--error)', text: '#ffffff' };
      case 'warning':
        return { bg: 'var(--warning)', text: '#000000' };
      case 'info':
      default:
        return { bg: 'var(--info)', text: '#ffffff' };
    }
  };

  const colors = getAlertColors();

  return (
    <div 
      className={`p-4 rounded-lg ${className}`}
      style={{
        backgroundColor: `${colors.bg}20`,
        borderColor: colors.bg,
        borderWidth: '1px',
        color: colors.bg,
      }}
      {...props}
    >
      {title && <div className="font-semibold">{title}</div>}
      {message && <div className="text-sm mt-1">{message}</div>}
    </div>
  );
};

/**
 * ThemeLabel - form label with proper styling
 */
export const ThemeLabel = ({ 
  children,
  className = '',
  required = false,
  ...props 
}) => (
  <label 
    className={`block text-sm font-medium ${className}`}
    style={{ color: 'var(--text-muted)' }}
    {...props}
  >
    {children}
    {required && <span style={{ color: 'var(--error)' }}>*</span>}
  </label>
);

/**
 * ThemeTable - table wrapper with theme support
 */
export const ThemeTable = ({ 
  children,
  className = '',
  ...props 
}) => (
  <div className="overflow-x-auto">
    <table 
      className={`w-full text-sm ${className}`}
      style={{
        backgroundColor: 'var(--card)',
        color: 'var(--text)',
      }}
      {...props}
    >
      {children}
    </table>
  </div>
);

/**
 * ThemeTableHeader - table header cell
 */
export const ThemeTableHeader = ({ 
  children,
  className = '',
  ...props 
}) => (
  <th 
    className={`px-4 py-3 text-left font-semibold ${className}`}
    style={{
      backgroundColor: 'var(--surface)',
      color: 'var(--text)',
      borderBottomColor: 'var(--border)',
      borderBottomWidth: '1px',
    }}
    {...props}
  >
    {children}
  </th>
);

/**
 * ThemeTableRow - table row
 */
export const ThemeTableRow = ({ 
  children,
  className = '',
  ...props 
}) => (
  <tr 
    className={`border-b transition-colors hover:bg-opacity-50 ${className}`}
    style={{
      backgroundColor: 'var(--card)',
      borderBottomColor: 'var(--border)',
      borderBottomWidth: '1px',
    }}
    {...props}
  >
    {children}
  </tr>
);

/**
 * ThemeTableCell - table cell
 */
export const ThemeTableCell = ({ 
  children,
  className = '',
  ...props 
}) => (
  <td 
    className={`px-4 py-3 ${className}`}
    style={{ color: 'var(--text)' }}
    {...props}
  >
    {children}
  </td>
);

export default {
  ThemeSection,
  ThemeCard,
  ThemeHeading,
  ThemeText,
  ThemeMutedText,
  ThemeInput,
  ThemeSelect,
  ThemeButton,
  FeatureCard,
  DashboardCard,
  ThemeAlert,
  ThemeLabel,
  ThemeTable,
  ThemeTableHeader,
  ThemeTableRow,
  ThemeTableCell,
};
