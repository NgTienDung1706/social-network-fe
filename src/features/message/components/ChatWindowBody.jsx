import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { fetchMessages } from "@/redux/chatSlice";
import ChatWelcomeScreen from "@/features/message/components/ChatWelcomeScreen";
import MessageItem from "@/features/message/components/MessageItem";
import MessageItemHeader from "@/features/message/components/MessageItemHeader";

import { chatSelector } from "@/redux/chatSlice";
import { authSelector } from "@/redux/authSlice";

import logo from "@/assets/Cham_bochu.png";

const ChatWindowBody = () => {
  const dispatch = useDispatch();
  const chatSlice = useSelector(chatSelector);
  const authSlice = useSelector(authSelector);

  const activeConversationId = chatSlice.activeConversationId;
  const conversations = chatSlice.conversations;
  const messageLoading = chatSlice.messageLoading;
  const me = authSlice.currentUser;
  let otherUsers;
  let lastMessageStatus = "delivered";

  const messages = chatSlice.messages[activeConversationId]?.items || [];
  const hasMore = chatSlice.messages[activeConversationId]?.hasMore || false;

  const selectedConversation = conversations.find(
    (conv) => conv._id === activeConversationId
  );

  if (selectedConversation?.type === "direct") {
    // Lọc ra người dùng khác (chỉ 1 người)
    const otherParticipants = selectedConversation.participants.filter(
      (p) => p._id !== me._id
    );
    otherUsers = otherParticipants.length > 0 ? otherParticipants : []; // Trả về mảng (có thể chỉ 1 phần tử)
  } else if (selectedConversation?.type === "group") {
    // Lọc ra tất cả người dùng khác (nhiều người)
    const otherParticipants = selectedConversation.participants.filter(
      (p) => p._id !== me._id
    );
    // Tạo mảng object với thông tin cơ bản (tên, avatar, v.v.)
    otherUsers = otherParticipants.map((participant) => ({
      _id: participant._id,
      name:
        `${participant.lastname || ""} ${participant.firstname || ""}`.trim() ||
        participant.username,
      avatar: participant.avatar,
      username: participant.username,
      // Thêm các field khác nếu cần
    }));
  }

  if (selectedConversation) {
    if (
      selectedConversation.seenBy &&
      otherUsers.some((user) => selectedConversation.seenBy.includes(user._id))
    ) {
      //console.log(otherUser._id, selectedConversation.seenBy);
      lastMessageStatus = "received";
    } else {
      lastMessageStatus = "delivered";
    }
  }

  // Ref cho scroll container
  const scrollContainerRef = useRef(null);
  // Ref cho phần tử cuối cùng (anchor để scroll đến bottom)
  const messagesEndRef = useRef(null);
  // Ref để lưu scroll height và scroll top trước khi load more
  const scrollMetricsRef = useRef({ beforeHeight: 0, beforeScrollTop: 0 });
  // Flag ref để biết đang load more (không phải initial load)
  const isLoadingMoreRef = useRef(false);
  // Ref để track user có đang ở bottom không (để quyết định auto-scroll tin mới)
  const isUserAtBottomRef = useRef(true);

  // Hàm helper để force scroll to bottom (sử dụng scrollHeight thực tế)
  const scrollToBottom = useCallback((behavior = "auto") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Chờ một frame để DOM update (đặc biệt cho ảnh)
    requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = container;
      container.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: behavior === "auto" ? "auto" : "smooth",
      });
    });
  }, []);

  // Force scroll to bottom khi activeConversationId thay đổi (mới vào chat) hoặc messages thay đổi
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const endRef = messagesEndRef.current;
    if (!container || !endRef || messages.length === 0) return;

    // Kiểm tra nếu đang load more thì skip, ngược lại scroll to bottom
    if (!isLoadingMoreRef.current) {
      scrollToBottom("auto"); // Sử dụng helper mới
    }

    // Reset trạng thái bottom khi mới vào chat
    isUserAtBottomRef.current = true;
  }, [activeConversationId, messages.length, scrollToBottom]); // Giữ dependency

  // Auto-scroll đến bottom khi nhận tin mới (chỉ khi user đang ở bottom) - Sử dụng helper mới
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    // Sử dụng ref để check trạng thái bottom trước khi tin mới đến
    const shouldAutoScroll =
      isUserAtBottomRef.current && !isLoadingMoreRef.current;

    if (shouldAutoScroll) {
      scrollToBottom("auto");
    }

    // Reset flag sau khi xử lý
    //isLoadingMoreRef.current = false;
  }, [messages, scrollToBottom]); // Thay messages.length bằng messages để detect thay đổi nội dung (như thêm ảnh)

  // Handle scroll để load more khi scroll lên top + track trạng thái bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Luôn update trạng thái bottom mỗi khi scroll
    const { scrollHeight, scrollTop, clientHeight } = container;
    isUserAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50; // Threshold 50px

    // Logic load more chỉ khi scroll up
    if (!hasMore || messageLoading) return;

    const { scrollTop: currentScrollTop } = container;
    const threshold = 100;

    if (currentScrollTop <= threshold) {
      // Lưu metrics trước khi load more
      scrollMetricsRef.current = {
        beforeHeight: container.scrollHeight,
        beforeScrollTop: container.scrollTop,
      };
      isLoadingMoreRef.current = true; // Flag cho load more

      // Dispatch load more
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
  }, [dispatch, activeConversationId, hasMore, messageLoading]);

  // Attach/detach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Adjust scroll position sau khi load more (sử dụng useLayoutEffect để sync với DOM)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isLoadingMoreRef.current) return;

    const { beforeHeight, beforeScrollTop } = scrollMetricsRef.current;
    const newHeight = container.scrollHeight;
    const heightDiff = newHeight - beforeHeight;

    // Giữ vị trí scroll tương đối: cộng thêm height mới (prepended) vào scrollTop cũ
    requestAnimationFrame(() => {
      container.scrollTop = beforeScrollTop + heightDiff;
      // Reset flag
      isLoadingMoreRef.current = false;
    });
  }, [messages]); // Chạy sau khi messages update từ fetch

  // Phần render giữ nguyên...
  if (!selectedConversation) {
    return <ChatWelcomeScreen />;
  }
  if (messageLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-muted-foreground">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <span className="absolute w-24 h-24 rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
          <span className="absolute w-24 h-24 rounded-full bg-cyan-400 opacity-75 animate-ping delay-300"></span>

          {/* Ảnh ngón tay */}
          <img
            src={logo}
            alt="Touch Logo"
            className="relative z-10 w-24 h-24 object-contain"
          />
        </div>

        {/* Text */}
        <p className="mt-6 text-brand-green text-lg font-semibold animate-pulse">
          Đang tải tin nhắn...
        </p>
      </div>
    );
  }

  // if (messages.length === 0) {
  //   return (
  //     <div className="p-4 bg-white h-full flex flex-col overflow-hidden">
  //       <div className="flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar">
  //         <MessageItemHeader user={otherUser} />
  //       </div>
  //     </div>
  //   );
  // }
  return (
    <div className="p-4 bg-white h-full flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar"
      >
        {/* Spinner load more ở đầu nếu đang load và có messages */}
        {/* {messageLoading && messages.length > 0 && (
          <div className="flex items-center justify-center py-4 bg-gray-50 border-b">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải thêm tin nhắn...</span>
            </div>
          </div>
        )} */}
        {!hasMore && <MessageItemHeader user={otherUsers[0]} />}
        {messages.map((message, index) => (
          <MessageItem
            key={message._id}
            message={message}
            index={index}
            messages={messages}
            selectedConversation={selectedConversation}
            lastMessageStatus={lastMessageStatus}
            onImageLoaded={() => scrollToBottom("auto")}
          />
        ))}
        <div ref={messagesEndRef} /> {/* Anchor để scroll đến bottom */}
      </div>
    </div>
  );
};

export default ChatWindowBody;
