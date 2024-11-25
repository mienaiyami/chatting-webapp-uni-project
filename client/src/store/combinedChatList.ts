import { create } from "zustand";

interface CombinedChatListState {
    chatList: CombinedChatListType[];
    setChatList: (list: CombinedChatListType[]) => void;
    updateLastMessage: (chatId: string, text: string, timestamp: Date) => void;
}

const useCombinedChatListStore = create<CombinedChatListState>((set) => ({
    chatList: [],
    setChatList: (list) => set({ chatList: list }),
    updateLastMessage: (chatId, text, timestamp) =>
        set((state) => {
            console.log(
                "Updating last message for chat",
                chatId,
                text,
                timestamp
            );
            console.log(state.chatList);
            return {
                chatList: state.chatList.map((item) =>
                    item.type !== "contact" && item._id === chatId
                        ? {
                              ...item,
                              lastMessage: text,
                              lastMessageAt: timestamp,
                          }
                        : item
                ),
            };
        }),
}));

export default useCombinedChatListStore;
