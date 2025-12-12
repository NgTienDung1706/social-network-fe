// ImageModal.jsx - Component riêng cho modal xem ảnh
import React from "react";
import { formatMessageTime } from "@/utils/messageUtils"; // Giả sử bạn có util này
import { CiCircleRemove } from "react-icons/ci";
const ImageModal = ({
  isOpen,
  imageSrc,
  onClose,
  messageCreatedAt, // Để hiển thị thời gian
}) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 overflow-auto p-4"
      onClick={onClose}
    >
      <div
        className="max-w-4xl max-h-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()} // Không đóng khi click vào ảnh
      >
        {/* Ảnh chính với overlay mưa */}
        <div className="w-full max-w-2xl max-h-[80vh]">
          <img
            src={imageSrc}
            alt="Full view"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Thời gian dưới ảnh */}
        {messageCreatedAt && (
          <div className="mt-4 text-center text-white text-sm opacity-75">
            {formatMessageTime(new Date(messageCreatedAt))}
          </div>
        )}
      </div>

      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 hover:text-red-900 text-white flex items-center justify-center text-xl transition-all"
      >
        <CiCircleRemove size={36} />
      </button>
    </div>
  );
};

export default ImageModal;
