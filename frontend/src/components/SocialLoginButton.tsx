import React from 'react';

interface SocialLoginButtonProps {
  provider: 'google' | 'github' | 'twitter' | 'line';
  onLogin: (provider: string) => void;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: '🔍',
    bgColor: 'bg-red-500 hover:bg-red-600',
    textColor: 'text-white'
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    bgColor: 'bg-gray-800 hover:bg-gray-900',
    textColor: 'text-white'
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    bgColor: 'bg-black hover:bg-gray-800',
    textColor: 'text-white'
  },
  line: {
    name: 'LINE',
    icon: '💬',
    bgColor: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white'
  }
};

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ 
  provider, 
  onLogin, 
  disabled = false 
}) => {
  const config = providerConfig[provider];

  return (
    <button
      onClick={() => onLogin(provider)}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center space-x-3 px-4 py-2 rounded-lg
        ${config.bgColor} ${config.textColor}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        font-medium
      `}
    >
      <span className="text-lg">{config.icon}</span>
      <span>{config.name}でログイン</span>
    </button>
  );
};