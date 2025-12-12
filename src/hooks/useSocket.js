// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";

import {
  setConnected,
  setOnlineUsers,
  setSocketHelpers,
} from "@/redux/socketSlice.js";

import {
  addMessage,
  updateConversation,
  fetchMessages,
} from "@/redux/chatSlice.js";

export const useSocket = () => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  // --- Actual Redux states ---
  const { accessToken } = useSelector((state) => state.auth.login);
  const user = useSelector((state) => state.auth.login.currentUser);
  const messages = useSelector((state) => state.chat.messages);
  const activeConversationId = useSelector(
    (state) => state.chat.activeConversationId
  );

  // --- Refs to avoid stale closure ---
  const userRef = useRef(user);
  const messagesRef = useRef(messages);
  const activeRef = useRef(activeConversationId);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  // ===========================
  // HANDLERS (stable – no deps)
  // ===========================

  const handleNewMessage = (payload) => {
    const user = userRef.current;
    const messages = messagesRef.current;

    if (!user || !payload?.message || !payload?.conversation) return;

    const { message, conversation, seenBy, unreadCount } = payload;
    const convoId = conversation._id;

    const messagesNotLoaded = !messages[convoId]; // conversation chưa load

    if (messagesNotLoaded) {
      dispatch(fetchMessages({ conversationId: convoId }));
    } else {
      dispatch(addMessage({ message, userId: user._id }));
    }

    // Update conversation
    const lastMessage = {
      _id: message._id,
      content: message.content,
      images: message.images || [],
      createdAt: message.createdAt,
      senderId: message.senderId,
    };

    dispatch(
      updateConversation({
        ...conversation,
        lastMessage,
        seenBy: seenBy,
        unreadCount: unreadCount || conversation.unreadCount || {},
      })
    );

    // Mark as read nếu đang ở trong cuộc trò chuyện đó
    if (
      convoId === activeRef.current &&
      user._id.toString() !== message.senderId.toString()
    ) {
      console.log("hé lô bây bi");
      socketRef.current?.emit("mark-as-read", { conversationId: convoId });
    }
  };

  const handleMarkAsReadSuccess = (payload) => {
    const { conversationId, seenBy, unreadCount } = payload;
    dispatch(
      updateConversation({
        _id: conversationId,
        seenBy: seenBy,
        unreadCount: unreadCount || {},
      })
    );
  };

  const handleOnlineUsers = (userIds) => {
    dispatch(setOnlineUsers(userIds));
  };

  // ===========================
  // SOCKET INIT
  // ===========================

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!accessToken) {
      dispatch(setConnected(false));
      return;
    }

    // Create socket instance
    const socket = io("http://localhost:3001", {
      withCredentials: true,
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    dispatch(
      setSocketHelpers({
        markAsRead: (conversationId) =>
          socketRef.current.emit("mark-as-read", { conversationId }),
      })
    );

    // Listeners (stable)
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      dispatch(setConnected(true));
    });

    socket.on("disconnect", () => {
      dispatch(setConnected(false));
    });

    socket.on("online-users", handleOnlineUsers);
    socket.on("new-message", handleNewMessage);
    socket.on("mark-as-read-success", handleMarkAsReadSuccess);

    // Cleanup on unmount or token change
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      dispatch(setSocketHelpers(null));
    };
  }, [accessToken, dispatch]);

  return {
    socket: socketRef.current,
  };
};
