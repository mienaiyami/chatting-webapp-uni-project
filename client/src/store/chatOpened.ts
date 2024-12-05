import { create } from "zustand";

type ChatOpenedStore = {
    chatOpened: ChatGroupDetails | null;
    setChatOpened: (
        chat:
            | ChatGroupDetails
            | null
            | ((prev: ChatGroupDetails | null) => ChatGroupDetails | null)
    ) => void;
};

const useChatOpenedStore = create<ChatOpenedStore>((set) => ({
    chatOpened: null,
    setChatOpened: (chat) => {
        set((state) => {
            if (typeof chat === "function") {
                return {
                    chatOpened: chat(state.chatOpened),
                };
            }
            return { chatOpened: chat };
        });
    },
}));
export default useChatOpenedStore;
