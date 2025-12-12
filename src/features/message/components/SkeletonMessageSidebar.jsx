import React from "react";

const SkeletonMessageSidebar = () => {
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-auto space-y-1">
        {[...Array(10)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 px-6 py-2 rounded-lg animate-pulse"
          >
            {/* Avatar skeleton */}
            <div className="w-14 h-14 bg-gray-200 rounded-full" />

            <div className="flex-1 min-w-0">
              {/* Dòng 1: Tên conversation (dài hơn, pb-2 để spacing) */}
              <div className="pb-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>

              {/* Dòng 2: Preview message (ngắn) + time (rất ngắn) */}
              <div className="flex items-center justify-between">
                <div className="h-2 bg-gray-200 rounded w-1/2" />
                <div className="h-2 bg-gray-200 rounded w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonMessageSidebar;
