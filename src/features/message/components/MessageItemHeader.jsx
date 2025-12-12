import React from "react";

const MessageItemHeader = ({ user }) => {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="mb-2">
        <img
          src={user?.avatar || "/default-avatar.png"}
          alt={user?.fullname}
          className="w-24 h-24 rounded-full object-cover"
        />
      </div>

      <span className="mb-1 text-xl font-medium text-gray-800">
        {user?.fullname}
      </span>
      <span className="text-sm font-medium text-gray-600">
        {user?.username}
      </span>

      <div className="h-full py-4">
        <a
          href={`/profile/${user?.username}`}
          className="h-4 w-30 py-2 px-4 bg-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          Xem trang cá nhân
        </a>
      </div>
    </div>
  );
};

export default MessageItemHeader;
