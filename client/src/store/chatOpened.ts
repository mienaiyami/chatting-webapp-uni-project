import { create } from "zustand";
import { combine } from "zustand/middleware";
/**
 * id of the chat that is currently opened
 */
const useChatOpenedStore = create(
    combine({ chatOpened: "" }, (set) => ({
        setChatOpened: (id: string) => set({ chatOpened: id }),
    }))
);
export default useChatOpenedStore;
