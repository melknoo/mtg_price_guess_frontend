import React from 'react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'btn-primary',
  danger: 'btn-danger',
  warning: 'btn-primary',
};

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: '',
  xl: 'text-xl px-8 py-4',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClass}
        ${sizeClass}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
