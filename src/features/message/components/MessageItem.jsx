// MessageItem.jsx - Cập nhật (tách modal ra)
import React, { useState } from "react";
import UserAvatar from "@/features/message/components/UserAvatar";
import { formatMessageTime } from "@/utils/messageUtils";
import ImageModal from "@/components/common/ImageModal"; // Import component mới (điều chỉnh path nếu cần)

const MessageItem = ({
  message,
  index,
  messages,
  selectedConversation,
  lastMessageStatus,
  onImageLoaded,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const openImageModal = (imgSrc) => {
    setCurrentImage(imgSrc);
    setShowModal(true);
  };

  const closeImageModal = () => {
    setShowModal(false);
    setCurrentImage(null);
  };

  const prev = messages[index - 1];
  const after = messages[index + 1];
  const isGroupBreak =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isAvatarOtherParticipant =
    !after ||
    after.senderId !== message.senderId ||
    new Date(after.createdAt).getTime() -
      new Date(message.createdAt).getTime() >
      300000; // 5 phút
  const participant = selectedConversation?.participants.find(
    (p) => p._id.toString() === message.senderId.toString()
  );

  return (
    <>
      {/* Thời gian - Giữa màn hình nếu group break */}
      {isGroupBreak && (
        <div className="w-full flex justify-center mb-2 px-4">
          <span className="px-3 py-1 text-xs text-gray-500 font-medium">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        </div>
      )}

      <div
        className={`flex gap-2 message-bounce mb-1 ${
          message.isOwn ? "justify-end mr-4" : "justify-start"
        }`}
      >
        {/* Avatar */}
        {!message.isOwn && (
          <div className="w-12">
            {isAvatarOtherParticipant && (
              <UserAvatar
                name={participant?.fullname}
                avatarUrl={participant?.avatar}
                isOnline={false}
              />
            )}
          </div>
        )}
        {/* Message */}
        <div
          className={`max-w-xs lg:max-w-md space-y-1 flex flex-col ${
            message.isOwn ? "items-end" : "items-start"
          }`}
        >
          {message.content && (
            <div
              className={`${
                message.isOwn
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              } px-3 py-2 rounded-xl`}
            >
              <p className="text-sm leading-relaxed break-words whitespace-pre-line">
                {message.content}
              </p>
            </div>
          )}

          {message.images && message.images.length > 0 && (
            <div
              className={`flex flex-wrap gap-2 ${
                message.isOwn ? "justify-end" : ""
              }`}
            >
              {message.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer"
                  onClick={() => openImageModal(img)}
                >
                  <img
                    src={img}
                    alt={`attachment-${idx}`}
                    className="max-w-60 rounded-2xl object-cover hover:opacity-90 transition-opacity"
                    onLoad={() => {
                      if (message.isOwn) {
                        onImageLoaded();
                      }
                    }}
                  />
                  {/* Icon zoom nhỏ nếu muốn */}
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    🔍
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seen / Delivered - Giữ nguyên */}
          {message.isOwn &&
            message._id === selectedConversation?.lastMessage?._id && (
              <span className="text-xs text-muted-foreground px-1 font-medium text-gray-500">
                {lastMessageStatus === "received" ? "Đã xem" : "Đã gửi"}
              </span>
            )}
        </div>
      </div>

      {/* Sử dụng ImageModal component */}
      <ImageModal
        isOpen={showModal}
        imageSrc={currentImage}
        onClose={closeImageModal}
        messageCreatedAt={message.createdAt}
      />
    </>
  );
};

export default MessageItem;
