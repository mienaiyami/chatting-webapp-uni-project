import { create } from "zustand";

interface ChatStore {
    chats: Chat[];
    groups: Group[];
    combinedList: CombinedChatListType[];
    loading: boolean;
    error: Error | string | null;
    setChats: (chats: Chat[] | ((prevChats: Chat[]) => Chat[])) => void;
    setGroups: (groups: Group[]) => void;
    setCombinedList: (list: CombinedChatListType[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | string | null) => void;
    updateLastMessage: (
        chatId: string,
        senderId: string,
        text: string,
        timestamp: Date
    ) => void;
}

const useChatStore = create<ChatStore>((set) => ({
    chats: [],
    groups: [],
    combinedList: [],
    loading: true,
    error: null,
    setChats: (chats) => {
        if (typeof chats === "function") {
            set((state) => ({ chats: chats(state.chats) }));
        } else {
            set({ chats });
        }
    },
    setGroups: (groups) => set({ groups }),
    setCombinedList: (list) => set({ combinedList: list }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    updateLastMessage: (chatId, senderId, text, timestamp) =>
        set((state) => ({
            combinedList: state.combinedList.map((item) =>
                item.type !== "contact" && item._id === chatId
                    ? {
                          ...item,
                          lastMessage:
                              (senderId === "self" ? "You: " : "") + text,
                          lastMessageAt: timestamp,
                      }
                    : item
            ),
        })),
}));

export default useChatStore;
