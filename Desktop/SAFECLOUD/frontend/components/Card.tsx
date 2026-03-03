import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  icon,
  description,
  children,
  className = '',
  hoverable = false,
}) => {
  const hoverClass = hoverable
    ? 'hover:shadow-hover hover:border-primary-500 hover:scale-105 cursor-pointer transition-all duration-300'
    : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-card border border-gray-300 p-6 ${hoverClass} ${className}`}
    >
      {/* Header with Icon */}
      {(icon || title) && (
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="text-primary-500">{icon}</div>
            </div>
          )}
          {title && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-gray-600 text-sm leading-relaxed">{children}</div>
    </div>
  );
};

export default Card;
