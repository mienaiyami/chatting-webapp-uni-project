import { MainChatArea } from "@/components/MainChatArea";
import { Sidebar } from "@/components/Sidebar";
import { getUserDetails } from "@/utils";
import { useEffect, useState } from "react";
import useUserDetailStore from "@/store/userDetails";
import { toast } from "sonner";
import { SocketProvider } from "@/socket/SocketProvider";
import { useNavigate } from "react-router-dom";
import useTokenStore from "@/store/token";
import { ChatServiceProvider } from "@/contexts/ChatServiceProvider";
import { MessageServiceProvider } from "@/contexts/MessageServiceProvider";

export default function ChatApp() {
    const { setUserDetails, userDetails } = useUserDetailStore();
    const clearToken = useTokenStore((state) => state.clearToken);
    const navigate = useNavigate();
    useEffect(() => {
        if (!document.cookie.includes("token")) {
            // window.location.href = "/signin";
            clearToken();
            localStorage.removeItem("token");
            toast.error("Unauthorized");
            navigate("/signin");
        } else {
            getUserDetails()
                .then((data) => {
                    if (data) {
                        setUserDetails(data);
                    }
                })
                .catch((error) => {
                    if (error.message === "Unauthorized") {
                        localStorage.removeItem("token");
                        document.cookie = "";
                        toast.error("Session expired. Please sign in again.");
                        navigate("/signin");
                    } else {
                        toast.error(error.message);
                    }
                });
        }
    }, []);
    if (!userDetails) return <div>Loading...</div>;
    return (
        <SocketProvider>
            <ChatServiceProvider>
                <MessageServiceProvider>
                    <div
                        id="chat-app"
                        className="flex h-screen xl:h-[90vh] w-full xl:w-[90vw]"
                    >
                        <Sidebar />
                        <MainChatArea />
                    </div>
                </MessageServiceProvider>
            </ChatServiceProvider>
        </SocketProvider>
    );
}
