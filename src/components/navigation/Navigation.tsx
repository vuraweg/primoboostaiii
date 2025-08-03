import React, { useState } from 'react';
import { X, Menu, Home, Info, Phone, BookOpen, FileText, LogIn, LogOut, MessageCircle, ChevronDown, Target, TrendingUp, PlusCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="w-4 h-4" /> },
  ];

  const aiTools = [
    { id: 'optimizer', label: 'Resume Optimizer', icon: <Target className="w-4 h-4" /> },
    { id: 'score-checker', label: 'Score Checker', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'guided-builder', label: 'Guided Builder', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'linkedin-generator', label: 'LinkedIn Messages', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
    setShowAIToolsDropdown(false);
  };

  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      onPageChange('signin');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-8">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePageChange(item.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-blue-100 text-blue-700 shadow-md'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        
        {/* AI Tools Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAIToolsDropdown(!showAIToolsDropdown)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700 text-gray-700"
          >
            <Zap className="w-4 h-4" />
            <span>AI Tools</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAIToolsDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showAIToolsDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              {aiTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handlePageChange(tool.id)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-primary-50 transition-colors text-gray-700 hover:text-primary-700"
                >
                  {tool.icon}
                  <span className="font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => {
          setIsMobileMenuOpen(!isMobileMenuOpen);
          setShowAIToolsDropdown(false);
        }}
        className="lg:hidden p-2 text-gray-700 min-w-touch min-h-touch rounded-lg hover:bg-gray-100 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white border-t border-gray-200 shadow-md lg:hidden rounded-b-xl mx-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-6 py-4 text-sm font-medium transition-colors min-h-touch ${
                currentPage === item.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </button>
          ))}
          
          {/* AI Tools Section in Mobile Menu */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-6 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PRIMO Tools</span>
            </div>
            {aiTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handlePageChange(tool.id)}
                className={`w-full flex items-center px-8 py-3 text-sm font-medium transition-colors min-h-touch ${
                  currentPage === tool.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {tool.icon}
                <span className="ml-2">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Sign In / Sign Out Button */}
          <div className="border-t border-gray-200 pt-2">
          <button
            onClick={handleAuthAction}
              className="w-full flex items-center px-6 py-4 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors min-h-touch"
          >
            {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span className="ml-2">{user ? 'Sign Out' : 'Sign In'}</span>
          </button>
          </div>
        </div>
      )}
    </>
  );
};
