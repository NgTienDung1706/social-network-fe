import { useDispatch, useSelector } from "react-redux";
import AppSidebarMin from "@/components/AppSidebarMin";
import MessagesSidebar from "@/features/message/components/MessagesSidebar";
import SkeletonMessageSidebar from "@/features/message/components/SkeletonMessageSidebar";
import ChatArea from "@/features/message/components/ChatArea";
import { setActiveConversationId } from "@/redux/chatSlice";
import { selectSocketHelpers } from "@/redux/socketSlice";
import { chatSelector, fetchConversations } from "@/redux/chatSlice";
import { useEffect } from "react";

function Messenger() {
  const dispatch = useDispatch();
  const socketHelpers = useSelector(selectSocketHelpers);
  const chatState = useSelector(chatSelector);

  const { markAsRead } = socketHelpers || {};
  const { conversationLoading, conversations, activeConversationId } =
    chatState;

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const setActiveConversationIdHandler = (conversationId) => {
    dispatch(setActiveConversationId(conversationId));
    // Chỉ emit nếu socket đã ready
    if (markAsRead) markAsRead(conversationId);
  };

  useEffect(() => {
    if (activeConversationId && markAsRead) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, markAsRead]);

  return (
    <>
      <AppSidebarMin />
      <div className="flex h-screen bg-white ml-16 md:ml-20">
        <div className="w-96 border-r border-gray-200">
          {conversationLoading ? (
            <SkeletonMessageSidebar />
          ) : (
            <MessagesSidebar
              conversations={conversations}
              onSelectConversation={setActiveConversationIdHandler}
              activeId={activeConversationId}
            />
          )}
        </div>

        <div className="flex-1">
          <ChatArea />
        </div>
      </div>
    </>
  );
}

export default Messenger;
