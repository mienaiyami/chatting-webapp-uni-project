import { create } from "zustand";

interface MessagesState {
    messages: OptimisticMessage[];
    addOptimisticMessage: (message: OptimisticMessage) => void;
    confirmOrAddMessage: (serverMessage: Message & { tempId?: string }) => void;
    setMessages: (messages: Message[]) => void;
    clearMessages: () => void;
    deleteMessage: (messageId: string) => void;
    editMessage: (message: Message) => void;
}

const useMessagesStore = create<MessagesState>((set) => ({
    messages: [],
    addOptimisticMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, { ...message, optimistic: true }],
        })),
    confirmOrAddMessage: (serverMessage) =>
        set((state) => {
            const messages = [...state.messages];
            const confirmedMessageIndex = messages.findIndex(
                (e) => e.tempId && e.tempId === serverMessage.tempId
            );
            if (confirmedMessageIndex === -1) {
                messages.push(serverMessage);
                return { messages };
            } else {
                messages[confirmedMessageIndex] = serverMessage;
                return { messages };
            }
        }),
    setMessages: (messages) =>
        set({
            messages: messages.map((msg) => ({ ...msg, optimistic: false })),
        }),
    clearMessages: () => set({ messages: [] }),
    deleteMessage: (messageId) =>
        set((state) => ({
            messages: state.messages.filter((msg) => msg._id !== messageId),
        })),
    editMessage: (message) =>
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg._id === message._id ? message : msg
            ),
        })),
}));

export default useMessagesStore;
