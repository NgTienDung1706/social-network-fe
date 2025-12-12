import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { FaRegLaughSquint } from "react-icons/fa";
import { FaRegImage } from "react-icons/fa6";
import { CiCircleRemove } from "react-icons/ci";
import { GrSend } from "react-icons/gr";
import EmojiPickerComponent from "@/features/message/components/EmojiPickerComponent";
import ImageModal from "@/components/common/ImageModal";

import {
  sendDirectMessageThunk,
  sendGroupMessageThunk,
} from "@/redux/chatSlice.js";

const MessageInput = ({ selectedConversation }) => {
  const me = useSelector((state) => state.auth.login.currentUser);
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState([]); // Array of { id, url, name, file } cho ảnh
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null); // Ref cho input file hidden
  const dispatch = useDispatch();

  // Auto-resize textarea theo nội dung, tối đa 3 dòng (maxHeight ~88px: 3*24px line-height + 20px padding)
  const maxHeight = 150; // Điều chỉnh nếu font/line-height khác
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset
      const scrollH = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollH, maxHeight)}px`; // Giới hạn height
    }
  }, [value, maxHeight]);

  if (!me) return;
  const openImageModal = (imgSrc) => {
    setCurrentImage(imgSrc);
    setShowModal(true);
  };

  const closeImageModal = () => {
    setShowModal(false);
    setCurrentImage(null);
  };

  // Thêm ảnh khi click button
  const handleAddImage = () => {
    fileInputRef.current?.click(); // Trigger file picker
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(), // ID unique tạm
      url: URL.createObjectURL(file), // Preview URL
      name: file.name,
      file: file, // Giữ file gốc để upload sau
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = ""; // Reset input file
  };

  // Xóa attachment
  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => {
      const toRemove = prev.find((att) => att.id === id);
      if (toRemove && toRemove.url) {
        URL.revokeObjectURL(toRemove.url); // Cleanup memory
      }
      return prev.filter((att) => att.id !== id);
    });
  };

  // Hàm upload ảnh lên Cloudinary và trả về URLs
  const uploadImagesToCloudinary = async (files) => {
    try {
      // Lấy signature từ backend (giả định endpoint chung hoặc "/chat/upload-signature")
      const { signature, timestamp, cloudname, apikey } =
        await axiosInstance.get("/message/upload-signature"); // Hoặc "/chat/upload-signature" nếu có endpoint riêng

      // Upload từng file lên Cloudinary
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apikey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", "messages"); // Folder riêng cho messages

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudname}/auto/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return {
          url: response.data.secure_url,
          type: response.data.resource_type,
          public_id: response.data.public_id,
        };
      });

      const media = await Promise.all(uploadPromises);
      return media.map((item) => item.url); // Trả về mảng URLs
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      throw error; // Ném lỗi để handle ở handleSend
    }
  };

  // Hàm gửi tin nhắn (cập nhật để upload ảnh trước nếu có)
  const handleSend = async () => {
    if (!value.trim() && attachments.length === 0) return; // Không gửi nếu trống

    setUploading(true);
    const currentAttachments = [...attachments]; // Lưu ref để cleanup sau
    try {
      let imageUrls = [];
      if (attachments.length > 0) {
        // Upload ảnh trước
        const files = attachments.map((att) => att.file);
        imageUrls = await uploadImagesToCloudinary(files);
      }

      // Reset attachments NGAY SAU KHI UPLOAD THÀNH CÔNG, TRƯỚC KHI DISPATCH
      // (để preview biến mất ngay, tránh layout bị đẩy khi body render ảnh)
      setAttachments([]);
      currentAttachments.forEach((att) => {
        if (att.url) URL.revokeObjectURL(att.url); // Cleanup local URLs ngay lập tức
      });

      // Reset text cùng lúc
      setValue("");

      // Bây giờ dispatch với URLs (backend lưu trực tiếp vào DB)
      if (selectedConversation.type === "direct") {
        const participants = selectedConversation.participants;
        const participantId = participants.filter((p) => p.userId !== me._id)[0]
          .userId;
        await dispatch(
          sendDirectMessageThunk({
            recipientId: participantId,
            content: value.trim(),
            images: imageUrls, // Mảng các URL string, lưu trực tiếp vào DB
          })
        );
      } else if (selectedConversation.type === "group") {
        await dispatch(
          sendGroupMessageThunk({
            conversationId: selectedConversation._id,
            content: value.trim(),
            images: imageUrls, // Mảng các URL string, lưu trực tiếp vào DB
          })
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      // Có thể hiển thị toast/alert lỗi cho user
      // Nếu lỗi, khôi phục attachments để user có thể thử lại
      setAttachments(currentAttachments);
    } finally {
      setUploading(false);
    }
  };

  // Xử lý phím nhấn (giữ nguyên, nhưng giờ textarea auto-resize khi shift+enter)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift + Enter: Tự thêm \n và auto-resize
  };

  // Xử lý chọn emoji
  const handleEmojiSelect = (emoji) => {
    setValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col gap-2 px-4 mx-4 mb-4 border border-gray-300 rounded-2xl relative">
      {" "}
      {/* Thay flex row bằng col để attachments ở trên */}
      {/* Emoji Picker */}
      {showEmojiPicker && <EmojiPickerComponent onSelect={handleEmojiSelect} />}
      {/* Attachments preview (hiển thị khi có ảnh) */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {" "}
          {/* Horizontal scroll nếu nhiều ảnh */}
          {attachments.map((att) => (
            <div key={att.id} className="relative group pt-2">
              <img
                src={att.url}
                alt={att.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                onClick={() => openImageModal(att.url)}
              />
              <button
                type="button"
                onClick={() => handleRemoveAttachment(att.id)}
                className="absolute top-0 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CiCircleRemove
                  size={24}
                  className="text-red-500 bg-white rounded-full"
                />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex flex-1 items-end">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Soạn tin nhắn..."
            className="flex-1 py-2 min-h-[44px] max-h-[150px] focus:outline-none transition-smooth resize-none overflow-y-auto"
            rows={1}
            disabled={uploading} // Disable khi đang upload
          />

          <div className="flex items-center">
            <button
              type="button"
              onClick={handleAddImage}
              className="p-2 group transition-smooth rounded-full hover:bg-gray-100 disabled:opacity-50"
              disabled={uploading}
            >
              <FaRegImage
                size={24}
                className="text-gray-600 group-hover:text-blue-400"
              />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 group transition-smooth rounded-full hover:bg-gray-100 disabled:opacity-50"
              disabled={uploading}
            >
              <FaRegLaughSquint
                size={24}
                className="text-gray-600 group-hover:text-yellow-400"
              />
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              type="button"
              onClick={handleSend}
              className="p-2 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                uploading || (value.trim() === "" && attachments.length === 0)
              } // Disable nếu không có text hoặc ảnh, hoặc đang upload
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              ) : (
                <GrSend
                  size={24}
                  className="text-gray-600 hover:text-green-600"
                />
              )}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple // Cho phép chọn nhiều ảnh
          onChange={handleFileChange}
          className="hidden" // Hidden input
          disabled={uploading}
        />
      </div>
      {uploading && (
        <div className="px-2 text-xs text-gray-500 text-center">
          Đang tải lên ảnh...
        </div>
      )}
      <ImageModal
        isOpen={showModal}
        imageSrc={currentImage}
        onClose={closeImageModal}
        messageCreatedAt={null}
      />
    </div>
  );
};

export default MessageInput;
