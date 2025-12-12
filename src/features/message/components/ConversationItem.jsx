import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";

function ConversationItem({ item, active, onClick }) {
  const { currentUser } = useSelector((state) => state.auth.login); // Giả sử currentUser từ auth slice, có _id
  const { onlineUsers } = useSelector((state) => state.socket); // onlineUsers array userIds

  let displayName = "";
  let displayAvatar = "";
  let isOnline = false;
  let unreadCount = 0;
  let displayLastMessage = "No messages yet"; // Default

  if (item.type === "direct") {
    // Lọc participant không phải current user
    const otherParticipant = item.participants.find(
      (participant) => participant._id !== currentUser?._id
    );
    if (otherParticipant) {
      displayName = otherParticipant.fullname || otherParticipant.username;
      displayAvatar = otherParticipant.avatar;
      isOnline = onlineUsers.includes(otherParticipant._id);
      unreadCount = item.unreadCount?.[currentUser?._id] || 0;
    }
  } else if (item.type === "group") {
    displayName =
      item.groupName ||
      item.participants
        .slice(0, 2)
        .map((p) => p.fullname || p.username)
        .join(", ") +
        (item.participants.length > 2
          ? ` +${item.participants.length - 2}`
          : "");
    displayAvatar = item.groupAvatar || item.participants[0]?.avatar || "";
    const groupOnline =
      item.participants.filter((p) => onlineUsers.includes(p._id)).length > 0;
    isOnline = groupOnline;
    unreadCount = item.unreadCount?.[currentUser?._id] || 0;
  }

  // Logic hiển thị lastMessage
  const { lastMessage } = item;
  if (lastMessage) {
    const senderId = lastMessage.senderId._id || lastMessage.senderId;
    const isOwnMessage = senderId === currentUser?._id; // Kiểm tra senderId có phải currentUser không
    const hasImages = lastMessage.images && lastMessage.images.length > 0;
    const imageCount = hasImages ? lastMessage.images.length : 0;
    const content = lastMessage.content || "";

    if (hasImages) {
      // Ưu tiên ảnh nếu có (schema có images array)
      if (isOwnMessage) {
        displayLastMessage =
          imageCount === 1 ? "Bạn đã gửi một ảnh" : "Bạn đã gửi nhiều ảnh";
      } else {
        displayLastMessage =
          imageCount === 1 ? "Đã gửi một ảnh" : "Đã gửi nhiều ảnh"; // Nguyên gốc cho đối phương
      }
    } else if (content) {
      // Nếu là text
      if (isOwnMessage) {
        displayLastMessage = `Bạn: ${content}`;
      } else {
        displayLastMessage = content; // Nguyên gốc cho đối phương
      }
    } else {
      displayLastMessage = "Media message"; // Fallback nếu không có content/images
    }
  }

  const isUnread = unreadCount > 0;

  // Class cho displayName: Mỏng đen khi unread=0, đậm đen khi >0
  const nameClass = isUnread
    ? "text-sm font-semibold text-gray-900 truncate"
    : "text-sm font-normal text-gray-900 truncate";

  // Class cho displayLastMessage: Xám khi unread=0, đậm đen khi >0
  const lastMessageClass = isUnread
    ? "text-xs font-semibold text-gray-900 truncate"
    : "text-xs text-gray-500 truncate";

  return (
    <div
      onClick={() => onClick(item._id)} // Sử dụng _id
      className={`flex items-center justify-between gap-3 px-6 py-2 rounded-lg cursor-pointer transition-colors
          ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {" "}
        {/* Wrap left + middle để flex-1 */}
        <div className="relative">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover"
          />
          {isOnline && (
            <div className="absolute -bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={nameClass + " pb-2"}>{displayName}</div>
          <div className={lastMessageClass}>{displayLastMessage}</div>
        </div>
      </div>
      {/* Unread count: Push sang phải, chỉ text màu xanh da trời, không badge */}
      {unreadCount > 0 && (
        <span className="text-xs text-blue-600 font-semibold ml-auto">
          {" "}
          {/* ml-auto để push phải */}
          {unreadCount}
        </span>
      )}
    </div>
  );
}

export default ConversationItem;
