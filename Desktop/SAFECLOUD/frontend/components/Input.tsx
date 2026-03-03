import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 text-gray-900 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-error focus:ring-error'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
        } placeholder-gray-400 ${className}`}
        {...props}
      />
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
