import { useLayoutEffect, useState } from "react";
import useUserDetailStore from "./store/userDetails";
import { toast } from "sonner";
import ChatApp from "./components/Chat";
import { getUserDetails } from "./utils";
import { SocketProvider } from "./socket/SocketProvider";

function App() {
    const { setUserDetails, userDetails } = useUserDetailStore();
    useLayoutEffect(() => {
        if (!document.cookie.includes("token")) {
            window.location.href = "/signin";
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
                        // window.location.href = "/signin";
                    } else {
                        toast.error(error.message);
                    }
                });
        }
    }, []);
    return (
        <>
            {userDetails ? (
                <SocketProvider>
                    <ChatApp />
                </SocketProvider>
            ) : (
                "Loading..."
            )}
        </>
    );
}

export default App;
