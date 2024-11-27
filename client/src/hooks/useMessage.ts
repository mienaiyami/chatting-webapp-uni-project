import { useCallback, useLayoutEffect } from "react";
import useMessagesStore from "@/store/messagesStore";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useChatOpenedStore from "@/store/chatOpened";

interface SendMessageContent {
    chatId: string;
    text: string;
    senderId: string;
    repliedTo: Message | null;
    attachment?: File;
}
const getFileType = (
    mimeType: string
): NonNullable<Message["attachment"]>["fType"] => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
};
const useMessages = () => {
    const messages = useMessagesStore((state) => state.messages);
    const addOptimisticMessage = useMessagesStore(
        (state) => state.addOptimisticMessage
    );
    const confirmOrAddMessage = useMessagesStore(
        (state) => state.confirmOrAddMessage
    );
    const setMessages = useMessagesStore((state) => state.setMessages);
    const clearMessages = useMessagesStore((state) => state.clearMessages);
    const deleteMessage_store = useMessagesStore(
        (state) => state.deleteMessage
    );
    const editMessage_store = useMessagesStore((state) => state.editMessage);
    const chatOpened = useChatOpenedStore((state) => state.chatOpened);
    const { socket } = useSocket();

    const initializeMessages = useCallback(
        (msgs: Message[]) => {
            setMessages(msgs);
        },
        [setMessages]
    );

    const resetMessages = useCallback(() => {
        clearMessages();
    }, [clearMessages]);

    const deleteMessage = useCallback(
        (chatId: string, messageId: string) => {
            if (!socket) return;
            socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { chatId, messageId });
        },
        [socket]
    );
    const editMessage = useCallback(
        (chatId: string, messageId: string, text: string) => {
            if (!socket) return;
            socket.emit(SOCKET_EVENTS.EDIT_MESSAGE, {
                chatId,
                messageId,
                text,
            });
        },
        [socket]
    );

    const sendMessage = useCallback(
        async (content: SendMessageContent) => {
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
            const tempMessage: OptimisticMessage = {
                _id: tempId,
                chatId: content.chatId,
                senderId: content.senderId,
                text: content.text,
                repliedTo: content.repliedTo,
                attachment,
                tempId,

                //will be updated when server confirms, not sent to server, just for optimistic ui
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null,
            };

            addOptimisticMessage(tempMessage);

            if (content.attachment) {
                socket?.emit(
                    SOCKET_EVENTS.NEW_MESSAGE,
                    {
                        chatId: content.chatId,
                        text: content.text,
                        repliedTo: content.repliedTo?._id,
                        tempId,
                        attachment,
                    },
                    content.attachment
                );
            } else {
                socket?.emit(SOCKET_EVENTS.NEW_MESSAGE, {
                    chatId: content.chatId,
                    text: content.text,
                    repliedTo: content.repliedTo?._id,
                    tempId,
                    attachment: null,
                });
            }
        },
        [socket, addOptimisticMessage]
    );
    useLayoutEffect(() => {
        if (!socket) return;

        const messageListener = (
            serverMessage: Message & { tempId?: string }
        ) => {
            confirmOrAddMessage(serverMessage);
        };

        const chatClearedListener = ({ chatId }: { chatId: string }) => {
            clearMessages();
        };

        const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
            deleteMessage_store(messageId);
        };

        const handleMessageEdited = (updatedMessage: Message) => {
            editMessage_store(updatedMessage);
        };

        socket.on(SOCKET_EVENTS.NEW_MESSAGE, messageListener);
        socket.on(SOCKET_EVENTS.CHAT_CLEARED, chatClearedListener);
        socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
        socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);

        return () => {
            socket.off(SOCKET_EVENTS.NEW_MESSAGE, messageListener);
            socket.off(SOCKET_EVENTS.CHAT_CLEARED, chatClearedListener);
            socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
            socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
        };
    }, [socket, confirmOrAddMessage, clearMessages, setMessages]);

    useLayoutEffect(() => {
        if (!socket) return;
        if (!chatOpened) {
            resetMessages();
            return;
        }
        const handleMessagesReceived = ({
            messages,
        }: {
            messages: Message[];
        }) => {
            setMessages(messages);
        };

        socket.on(SOCKET_EVENTS.MESSAGES, handleMessagesReceived);

        socket.emit(SOCKET_EVENTS.GET_MESSAGES, { chatId: chatOpened._id });

        return () => {
            socket.off(SOCKET_EVENTS.MESSAGES, handleMessagesReceived);
        };
    }, [socket, chatOpened, setMessages]);

    return {
        messages,
        sendMessage,
        initializeMessages,
        resetMessages,
        deleteMessage,
        editMessage,
    };
};

export default useMessages;
