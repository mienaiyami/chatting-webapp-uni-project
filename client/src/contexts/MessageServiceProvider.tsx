import {
    createContext,
    useContext,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useMessagesStore from "@/store/messagesStore";
import useChatOpenedStore from "@/store/chatOpened";
import { toast } from "sonner";

type SendMessageContent = {
    chatId: string;
    text: string;
    senderId: string;
    repliedTo: Message | null;
    attachment?: File;
};

type MessageServiceContextType = {
    messages: OptimisticMessage[];
    sendMessage: (content: SendMessageContent) => Promise<void>;
    deleteMessage: (messageId: string) => void;
    editMessage: (messageId: string, newText: string) => void;
    handleTyping: () => void;
    clearChat: () => void;
};

const MessageServiceContext = createContext<MessageServiceContextType | null>(
    null
);

const getFileType = (
    mimeType: string
): NonNullable<Message["attachment"]>["fType"] => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
};

export const MessageServiceProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { socket } = useSocket();
    const { chatOpened } = useChatOpenedStore();
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const {
        messages,
        addOptimisticMessage,
        confirmOrAddMessage,
        setMessages,
        clearMessages,
        deleteMessage: deleteMessageFromStore,
        editMessage: editMessageInStore,
    } = useMessagesStore();

    const handleTyping = useCallback(() => {
        if (!socket || !chatOpened) return;
        socket.emit(SOCKET_EVENTS.USER_TYPING, chatOpened._id);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit(SOCKET_EVENTS.USER_STOP_TYPING, chatOpened._id);
        }, 1500);
    }, [socket, chatOpened]);

    const sendMessage = useCallback(
        async (content: SendMessageContent) => {
            if (!socket) return;

            const tempId = `temp-${window.crypto.randomUUID()}`;
            const attachment = content.attachment
                ? {
                      // placeholder values; will be updated after server processes the file
                      fType: getFileType(content.attachment.type),
                      url: "", // to be updated
                      mimeType: content.attachment.type,
                      size: content.attachment.size,
                      name: content.attachment.name,
                  }
                : null;
            const optimisticMessage: OptimisticMessage = {
                _id: tempId,
                tempId,
                chatId: content.chatId,
                text: content.text,
                senderId: content.senderId,
                repliedTo: content.repliedTo,
                attachment,

                //will be updated when server confirms, not sent to server, just for optimistic ui
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null,
                optimistic: true,
            };

            addOptimisticMessage(optimisticMessage);

            socket.emit(
                SOCKET_EVENTS.NEW_MESSAGE,
                {
                    chatId: content.chatId,
                    text: content.text,
                    repliedTo: content.repliedTo?._id,
                    tempId,
                    attachment,
                },
                content.attachment,
                (response: { message?: Message; error?: string }) => {
                    if (response.error) {
                        toast.error(response.error);
                    } else if (response.message) {
                        // currently not handling cb
                        // confirmOrAddMessage(response.message);
                    }
                }
            );
        },
        [socket, addOptimisticMessage]
    );

    const deleteMessage = useCallback(
        (messageId: string) => {
            if (!socket || !chatOpened) return;
            socket.emit(
                SOCKET_EVENTS.DELETE_MESSAGE,
                { messageId, chatId: chatOpened._id },
                (response: { success?: boolean; error?: string }) => {
                    if (response.error) {
                        toast.error(response.error);
                    } else if (response.success) {
                        // currently not handling cb
                        // deleteMessageFromStore(messageId);
                    }
                }
            );
        },
        [socket, chatOpened]
    );

    const editMessage = useCallback(
        (messageId: string, newText: string) => {
            if (!socket || !chatOpened) return;
            socket.emit(
                SOCKET_EVENTS.EDIT_MESSAGE,
                {
                    messageId,
                    chatId: chatOpened._id,
                    text: newText,
                },
                (response: { message?: Message; error?: string }) => {
                    if (response.error) {
                        toast.error(response.error);
                    } else if (response.message) {
                        // currently not handling cb
                        // editMessageInStore(response.message);
                    }
                }
            );
        },
        [socket, chatOpened]
    );
    const clearChat = useCallback(() => {
        if (!socket || !chatOpened) return;
        socket.emit(SOCKET_EVENTS.CLEAR_CHAT, { chatId: chatOpened._id });
    }, [socket, chatOpened]);

    useEffect(() => {
        if (!socket || !chatOpened) return;

        const handleMessagesReceived = ({
            messages,
        }: {
            messages: Message[];
        }) => {
            setMessages(messages);
        };

        const handleNewMessage = (message: Message & { tempId?: string }) => {
            confirmOrAddMessage(message);
        };

        const handleMessageDeleted = (data: { messageId: string }) => {
            deleteMessageFromStore(data.messageId);
        };

        const handleMessageEdited = (message: Message) => {
            editMessageInStore(message);
        };

        const handleChatCleared = () => {
            clearMessages();
        };

        socket.on(SOCKET_EVENTS.MESSAGES, handleMessagesReceived);
        socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
        socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
        socket.on(SOCKET_EVENTS.CHAT_CLEARED, handleChatCleared);

        // message get sent after joining room instead
        // socket.emit(
        //     SOCKET_EVENTS.GET_MESSAGES,
        //     { chatId: chatOpened._id },
        //     (response: { messages?: Message[]; error?: string }) => {
        //         if (response.error) {
        //             toast.error(response.error);
        //         } else if (response.messages) {
        //             setMessages(response.messages);
        //         }
        //     }
        // );

        // socket.emit(SOCKET_EVENTS.JOIN_ROOM, chatOpened._id);

        return () => {
            socket.off(SOCKET_EVENTS.MESSAGES, handleMessagesReceived);
            socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
            socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
            socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
            socket.off(SOCKET_EVENTS.CHAT_CLEARED, handleChatCleared);
            // socket.emit(SOCKET_EVENTS.LEAVE_ROOM, chatOpened._id);

            clearMessages();
        };
    }, [socket, chatOpened]);

    const value = {
        messages,
        sendMessage,
        deleteMessage,
        editMessage,
        handleTyping,
        clearChat,
    };

    return (
        <MessageServiceContext.Provider value={value}>
            {children}
        </MessageServiceContext.Provider>
    );
};

export const useMessageService = () => {
    const context = useContext(MessageServiceContext);
    if (!context) {
        throw new Error(
            "useMessageService must be used within MessageServiceProvider"
        );
    }
    return context;
};
