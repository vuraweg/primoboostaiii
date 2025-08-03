// src/components/navigation/Navigation.tsx
import React, { useState } from 'react';
import { Home, Info, Phone, BookOpen, MessageCircle, ChevronDown, Target, TrendingUp, PlusCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const { isAuthenticated } = useAuth(); // Destructure isAuthenticated from useAuth()

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
    setShowAIToolsDropdown(false);
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

        {/* AI Tools Dropdown - Conditional Rendering */}
        {isAuthenticated && ( // Add this conditional check
          <div className="relative">
            <button
              onClick={() => setShowAIToolsDropdown(!showAIToolsDropdown)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700 text-gray-700"
            >
              <Zap className="w-4 h-4" />
              <span>PRIMO Tools</span>
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
        )} {/* End conditional check */}
      </nav>
    </>
  );
};
