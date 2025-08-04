// src/components/AlertModal.tsx
import React from 'react';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionText?: string;
  onAction?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  actionText,
  onAction,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  const getHeaderClasses = () => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-emerald-50';
      case 'warning':
        return 'from-orange-50 to-yellow-50';
      case 'error':
        return 'from-red-50 to-pink-50';
      case 'info':
      default:
        return 'from-blue-50 to-indigo-50';
    }
  };

  const getButtonClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${getHeaderClasses()} p-6 border-b border-gray-200`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 min-w-[44px] min-h-[44px]"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              {getIcon()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-700 mb-6">{message}</p>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl ${getButtonClasses()}`}
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
