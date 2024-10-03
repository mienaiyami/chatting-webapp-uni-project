import { create } from "zustand";
import { combine } from "zustand/middleware";

const token = localStorage.getItem("token") || null;

const useTokenStore = create(
    combine({ token }, (set) => ({
        setToken: (token: string) => set({ token }),
        clearToken: () => set({ token: null }),
    }))
);
export default useTokenStore;
