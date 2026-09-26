import React from 'react';

export const CollegeBanner: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden mb-6 select-none">
      {/* 
        Official institutional banner asset.
        Preserves original aspect ratio without cropping, distortion, or regeneration.
        On mobile, allows horizontal scrolling if needed so all official details remain completely legible.
      */}
      <div className="w-full overflow-x-auto">
        <img
          src="/avn-header-banner.jpeg"
          alt="AVN Institute of Engineering & Technology"
          className="w-full h-auto min-w-[600px] sm:min-w-0 block object-contain"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    </div>
  );
};
