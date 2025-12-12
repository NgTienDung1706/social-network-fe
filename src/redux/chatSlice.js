// src/store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getConversations,
  getMessages,
  sendDirectMessage,
  sendGroupMessage,
} from "@/features/message/messageApi.js";

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId }, thunkAPI) => {
    try {
      const activeConversationId =
        thunkAPI.getState().chat.activeConversationId;
      const messages = thunkAPI.getState().chat.messages;
      const user = thunkAPI.getState().auth.login.currentUser;

      const convoId = conversationId ?? activeConversationId;

      if (!convoId)
        return { processed: [], conversationId: null, nextCursor: null };

      const current = messages?.[convoId] || [];
      const nextCursor =
        current?.nextCursor === undefined ? "" : current?.nextCursor;

      if (nextCursor === null)
        return { processed: [], conversationId: null, nextCursor: null };

      try {
        const { messages: fetched, cursor } = await getMessages(
          convoId,
          nextCursor
        );

        const processed = fetched.map((m) => ({
          ...m,
          isOwn: m.senderId === user?._id,
        }));

        return { processed, conversationId: convoId, nextCursor: cursor };
      } catch (error) {
        return thunkAPI.rejectWithValue(
          error.message || "Fetch messages failed"
        );
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, thunkAPI) => {
    try {
      const conversations = await getConversations();
      return conversations;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const sendDirectMessageThunk = createAsyncThunk(
  "chat/sendDirectMessage",
  async ({ recipientId, content, images }, thunkAPI) => {
    try {
      const activeConversationId =
        thunkAPI.getState().chat.activeConversationId;
      const response = await sendDirectMessage(
        recipientId,
        content,
        images,
        activeConversationId || undefined
      );
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const sendGroupMessageThunk = createAsyncThunk(
  "chat/sendGroupMessage",
  async ({ conversationId, content, images }, thunkAPI) => {
    try {
      const response = await sendGroupMessage(conversationId, content, images);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  conversations: [],
  messages: {},
  // messages: {
  //   [conversationId]: {
  //     items: [...],
  //     hasMore: true,
  //     nextCursor: null,
  //   }
  // },
  activeConversationId: null,
  isTyping: false,
  conversationLoading: false,
  messageLoading: false,
};
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action) => {
      const { message, userId } = action.payload;

      // message.isOwn = message.senderId === userId;

      // const convoId = message.conversationId;

      // let prevItems = state.messages[convoId]?.items || [];

      // state.messages[convoId] = {
      //   items: [...prevItems, message],
      //   hasMore: state.messages[convoId]?.hasMore ?? true,
      //   nextCursor: state.messages[convoId]?.nextCursor ?? undefined,
      // };
      // Tạo object mới để tránh mutate payload
      const processedMessage = {
        ...message,
        isOwn: message.senderId === userId,
      };

      const convoId = processedMessage.conversationId;
      if (!convoId) return; // Skip nếu thiếu convoId

      // Lấy prev state
      const prevState = state.messages[convoId];
      const prevItems = prevState?.items || [];

      // Check duplicate _id (fix root cause)
      const existingMessage = prevItems.find(
        (msg) => msg._id === processedMessage._id
      );
      console.log("Đang kiểm tra tin nhắn trùng lặp:", existingMessage);
      if (existingMessage) return; // Skip nếu trùng lặp
      // Tạo state mới
      const newItems = [...prevItems, processedMessage];
      state.messages[convoId] = {
        items: newItems,
        hasMore: prevState?.hasMore ?? false, // Default false nếu convo mới
        nextCursor: prevState?.nextCursor ?? null,
      };
    },
    updateConversation: (state, action) => {
      const updatedConversation = action.payload;
      state.conversations = state.conversations.map((conv) => {
        if (conv._id === updatedConversation._id) {
          // Merge the updated fields with existing conversation
          return {
            ...conv,
            ...updatedConversation,
            // If unreadCount is provided, merge it properly
            unreadCount:
              updatedConversation.unreadCount !== undefined
                ? updatedConversation.unreadCount
                : conv.unreadCount,
          };
        }
        return conv;
      });
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messageLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messageLoading = false;
        const { processed, conversationId, nextCursor } = action.payload;
        const prev = state.messages[conversationId]?.items ?? [];
        const merged = prev.length > 0 ? [...processed, ...prev] : processed;
        state.messages[conversationId] = {
          items: merged,
          hasMore: !!nextCursor,
          nextCursor: nextCursor ?? null,
        };
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.messageLoading = false;
      });
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.conversationLoading = false;
      });
    builder
      .addCase(sendDirectMessageThunk.pending, (state) => {
        state.messageLoading = true;
      })
      .addCase(sendDirectMessageThunk.fulfilled, (state, action) => {
        state.messageLoading = false;
        const message = action.payload;
        const conversationId = message.conversationId;
        const activeConversationId = state.activeConversationId;
        state.conversations = state.conversations.map((conv) =>
          conv._id === activeConversationId ? { ...conv, seenBy: [] } : conv
        );
      })
      .addCase(sendDirectMessageThunk.rejected, (state) => {
        state.messageLoading = false;
      });
    builder
      .addCase(sendGroupMessageThunk.pending, (state) => {
        state.messageLoading = true;
      })
      .addCase(sendGroupMessageThunk.fulfilled, (state, action) => {
        state.messageLoading = false;
        const message = action.payload;
        const conversationId = message.conversationId;
        const activeConversationId = state.activeConversationId;
        state.conversations = state.conversations.map((conv) =>
          conv._id === activeConversationId ? { ...conv, seenBy: [] } : conv
        );
      })
      .addCase(sendGroupMessageThunk.rejected, (state) => {
        state.messageLoading = false;
      });
  },
});

export const {
  setActiveConversationId,
  addMessage,
  clearMessages,
  setTyping,
  updateConversation,
} = chatSlice.actions;
export default chatSlice.reducer;

export const chatSelector = (state) => state.chat;
