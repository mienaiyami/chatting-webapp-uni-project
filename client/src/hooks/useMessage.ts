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
}

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
            const tempMessage: OptimisticMessage = {
                _id: tempId,
                ...content,
                mediaUrl: "",
                tempId,

                //will be updated when server confirms, not sent to server, just for optimistic ui
                createdAt: new Date(),
                modifiedAt: new Date(),
                deletedAt: null,
            };

            addOptimisticMessage(tempMessage);

            socket?.emit(SOCKET_EVENTS.NEW_MESSAGE, {
                chatId: content.chatId,
                text: content.text,
                repliedTo: content.repliedTo?._id,
                tempId,
            });
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
