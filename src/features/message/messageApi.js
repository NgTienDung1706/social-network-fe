import axios from "@/utils/axiosInstance";

const pagelimit = 50;
//Lấy danh sách các cuộc trò chuyện
export const getConversations = async () => {
  const res = await axios.get("/conversation");
  return res || [];
};

export const getMessages = async (conversationId, cursor) => {
  const res = await axios.get(
    `/conversation/${conversationId}/messages?limit=${pagelimit}&cursor=${
      cursor || ""
    }`
  );
  return {
    messages: res.messages || [],
    cursor: res.nextCursor || null,
  };
};

export const sendDirectMessage = async (
  recipientId,
  content,
  images,
  conversationId
) => {
  const res = await axios.post("/message/direct", {
    recipientId,
    content,
    images,
    conversationId,
  });
  return res;
};

export const sendGroupMessage = async (conversationId, content, images) => {
  const res = await axios.post("/message/group", {
    conversationId,
    content,
    images,
  });
  return res;
};

export const createConversation = async (type, name, memberIds) => {
  const res = await axios.post("/conversation", {
    type,
    name,
    memberIds,
  });
  return res;
};
