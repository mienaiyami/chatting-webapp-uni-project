import { create } from "zustand";
import { combine } from "zustand/middleware";

const useChatOpenedStore = create(
    combine({ chatOpened: null as ChatGroupDetails | null }, (set) => ({
        setChatOpened: (chat: ChatGroupDetails | null) =>
            set({ chatOpened: chat }),
    }))
);
export default useChatOpenedStore;
