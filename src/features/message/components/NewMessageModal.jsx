import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CiCircleRemove } from "react-icons/ci";
import { getFollowingList } from "@/features/profile/profileAPI";
import useFollowList from "@/hooks/useFollowList";
import { authSelector } from "@/redux/authSlice";
import {
  createConversationThunk,
  chatSelector,
  setActiveConversationId,
} from "@/redux/chatSlice";

// Component riêng cho ô nhập tên nhóm (Modal overlay)
const GroupNameModal = ({ isOpen, onClose, onCreate, selectedUsers }) => {
  const [groupName, setGroupName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 p-6 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex relative items-center justify-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Tạo nhóm chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-900 text-xl font-bold absolute right-0 top-1/2 transform -translate-y-1/2"
          >
            <CiCircleRemove size={25} />
          </button>
        </div>

        {/* Hiển thị danh sách thành viên đã chọn */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-black mb-2">
            Thành viên ({selectedUsers.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((userId) => {
              // Giả sử users được pass từ parent, nhưng ở đây cần pass users nếu muốn hiển thị tên
              // Để đơn giản, chỉ hiển thị số lượng hoặc pass users nếu cần
              return (
                <div
                  key={userId}
                  className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                >
                  {userId} {/* Thay bằng tên nếu pass users */}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input tên nhóm */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-black mb-2">
            Tên nhóm:
          </label>
          <input
            type="text"
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none"
          >
            Hủy
          </button>
          <button
            onClick={() =>
              onCreate(
                groupName.trim() ||
                  `Nhóm chat với ${selectedUsers.length} người`
              )
            }
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  );
};

const NewMessageModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGroupNameInput, setShowGroupNameInput] = useState(false); // State mới để kiểm soát hiển thị input tên nhóm
  const dispatch = useDispatch();

  // Lấy username của user hiện tại
  const authSlice = useSelector(authSelector);
  const chatSlice = useSelector(chatSelector);

  const currentUsername = authSlice.currentUser?.username;
  const conversations = chatSlice.conversations;

  // Sử dụng hook để lấy danh sách following với phân trang
  const {
    items: users,
    loading,
    lastItemRef,
  } = useFollowList(getFollowingList, currentUsername, 10);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.lastname} ${user.firstname}`.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase())
    );
  });

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleChat = () => {
    if (selectedUsers.length === 1) {
      let existingConversation = null;
      // Kiểm tra xem đã có conversation direct với user này chưa
      for (const conv of conversations) {
        if (
          conv.type === "direct" &&
          conv.participants.some((p) => p._id === selectedUsers[0])
        ) {
          existingConversation = conv;
          break;
        }
      }
      if (existingConversation) {
        //onCompletedCreateConversation(existingConversation);
        dispatch(setActiveConversationId(existingConversation._id));
        setSelectedUsers([]);
        onClose();
        return;
      }

      // Tạo conversation mới direct
      const newConvData = {
        type: "direct",
        name: "",
        memberIds: selectedUsers,
      };
      dispatch(createConversationThunk(newConvData));
      setSelectedUsers([]);
      onClose();
      return;
    }

    if (selectedUsers.length >= 2) {
      // Hiển thị modal tên nhóm thay vì tạo ngay
      setShowGroupNameInput(true);
      return;
    }

    onClose();
  };

  const handleCreateGroup = (groupName) => {
    // Tạo conversation mới group với tên nhóm
    const newConvData = {
      type: "group",
      name: groupName,
      memberIds: selectedUsers,
    };
    dispatch(createConversationThunk(newConvData));
    setSelectedUsers([]);
    setSearchTerm("");
    setShowGroupNameInput(false);
    onClose();
  };

  const handleCloseGroupModal = () => {
    setShowGroupNameInput(false);
  };

  const handleClose = () => {
    setSelectedUsers([]); // Reset selection
    setSearchTerm(""); // Reset search term
    setShowGroupNameInput(false); // Reset hiển thị input
    onClose(); // Gọi prop onClose từ parent
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Chỉ hiển thị modal chính khi không có modal nhập tên nhóm */}
      {!showGroupNameInput && (
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
              <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-2 flex-shrink-0 text-left">
                <p className="w-full text-md font-semibold text-black">Tới:</p>
                {selectedUsers.map((userId) => {
                  const user = users.find((u) => u._id === userId);
                  return (
                    <div
                      key={userId}
                      className="flex relative items-center py-1 px-3 w-auto rounded-full bg-blue-50"
                    >
                      <p className="mr-5 pr-1 text-sm text-blue-700 font-semibold truncate max-w-full text-center hover:underline cursor-pointer">
                        {user?.lastname} {user?.firstname}
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
            <div className="flex-1 overflow-y-auto text-left">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <label
                    key={user._id}
                    ref={
                      index === filteredUsers.length - 1 ? lastItemRef : null
                    }
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUser(user._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <img
                      src={
                        user.avatar ||
                        "https://via.placeholder.com/40x40?text=U"
                      }
                      alt={`${user.lastname} ${user.firstname}`}
                      className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.lastname} {user.firstname}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </label>
                ))
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm">Đang tải...</p>
                </div>
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
      )}

      {/* Render GroupNameModal trên cùng */}
      <GroupNameModal
        isOpen={showGroupNameInput}
        onClose={handleCloseGroupModal}
        onCreate={handleCreateGroup}
        selectedUsers={selectedUsers}
      />
    </>
  );
};

export default NewMessageModal;
