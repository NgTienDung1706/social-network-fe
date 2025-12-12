import React, { useState } from "react";
import { CiCircleRemove } from "react-icons/ci";

const NewMessageModal = ({ isOpen, onClose, onSelectUsers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const users = [
    {
      id: 1,
      name: "Thế Dũng",
      username: "chet2004",
      avatar: "https://via.placeholder.com/40x40?text=TD",
    },
    {
      id: 2,
      name: "Nguyễn Xuân Đạt",
      username: "dat14",
      avatar: "https://via.placeholder.com/40x40?text=ND",
    },
    {
      id: 3,
      name: "Thùy Tiên",
      username: "tien0419",
      avatar: "https://via.placeholder.com/40x40?text=TT",
    },
    {
      id: 4,
      name: "Trần Xuân Quang",
      username: "xuanguang10",
      avatar: "https://via.placeholder.com/40x40?text=TQ",
    },
    {
      id: 5,
      name: "Nguyễn Lê Yên Nhi",
      username: "yennhi",
      avatar: "https://via.placeholder.com/40x40?text=YN",
    },
    {
      id: 6,
      name: "Lê Minh Hoàng",
      username: "hoangle",
      avatar: "https://via.placeholder.com/40x40?text=LH",
    },
    {
      id: 7,
      name: "New User",
      username: "newuser",
      avatar: "https://via.placeholder.com/40x40?text=NU",
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleChat = () => {
    if (selectedUsers.length > 0) {
      onSelectUsers(selectedUsers);
      console.log("Selected users:", selectedUsers); // Thay bằng logic gửi tin nhắn
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedUsers([]); // Reset selection
    setSearchTerm(""); // Bonus: Reset search term nếu muốn
    onClose(); // Gọi prop onClose từ parent
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-3xl w-full max-w-xl mx-4 h-[80vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex relative items-center justify-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-md font-bold text-gray-900">Tin nhắn mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-900 text-xl font-bold absolute right-4 top-1/2 transform -translate-y-1/2"
          >
            <CiCircleRemove size={25} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-2 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Danh sách người dùng được chọn */}
        {selectedUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-2 flex-shrink-0">
            <p className="w-full text-md font-semibold text-black">Tới:</p>
            {selectedUsers.map((userId) => {
              const user = users.find((u) => u.id === userId);
              return (
                <div
                  key={userId}
                  className="flex relative items-center py-1 px-3 w-auto rounded-full bg-blue-50"
                >
                  <p className="mr-5 pr-1 text-sm text-blue-700 font-semibold truncate max-w-full text-center hover:underline cursor-pointer">
                    {user.name}
                  </p>

                  <button
                    onClick={() => toggleUser(userId)}
                    className="text-gray-400 hover:text-red-900 text-xl font-bold absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <CiCircleRemove />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* User List - flex-1 để chiếm hết không gian còn lại, tránh nhảy layout */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full mr-3 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{user.username}
                  </p>
                </div>
              </label>
            ))
          ) : (
            // Empty state để UX tốt hơn khi không có kết quả
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mb-2 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm">Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleChat}
            disabled={selectedUsers.length === 0}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
