import { create } from "zustand";
import { combine } from "zustand/middleware";

const useUserDetailStore = create(
    combine({ userDetails: null as null | UserDetails }, (set) => ({
        setUserDetails: (userDetails: UserDetails) => set({ userDetails }),
    }))
);
export default useUserDetailStore;
