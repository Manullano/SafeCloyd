import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-hover active:scale-95',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 active:scale-95',
    success:
      'bg-success text-white hover:brightness-110 active:scale-95',
    danger: 'bg-error text-white hover:brightness-110 active:scale-95',
    warning:
      'bg-warning text-white hover:brightness-110 active:scale-95',
    outline:
      'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:scale-95',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
