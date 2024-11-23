import { getUserDetails } from "@/utils";
import { create } from "zustand";
import { combine } from "zustand/middleware";

const token = localStorage.getItem("token") || null;

const useUserDetailStore = create(
    combine({ userDetails: null as null | UserDetails }, (set) => ({
        setUserDetails: (userDetails: UserDetails) => set({ userDetails }),
    }))
);
export default useUserDetailStore;
