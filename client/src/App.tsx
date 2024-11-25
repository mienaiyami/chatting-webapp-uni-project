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
            //todo check
            window.location.href = "/signin";
        } else {
            getUserDetails()
                .then((data) => {
                    if (data) {
                        setUserDetails(data);
                    }
                })
                .catch((error) => {
                    console.error(error);
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
