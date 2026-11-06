import React from 'react';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo container matching Image 2 */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-sm flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(145deg, #fff3e0 0%, #ffe0b2 100%)',
          border: '1px solid #fbd295',
        }}
      >
        <Image
          src="/logo.png"
          alt="Productivity System Logo"
          width={size}
          height={size}
          className="object-contain p-0.5"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
            MySpace
          </span>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold tracking-wide">
            Productivity Hub
          </span>
        </div>
      )}
    </div>
  );
};

