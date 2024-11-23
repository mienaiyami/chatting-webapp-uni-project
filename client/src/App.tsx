import { useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTokenStore from "./store/token";
import ProfilePage from "./components/Profile";
import useUserDetailStore from "./store/userDetails";
import { toast } from "sonner";
import ChatApp from "./components/Chat";
import { getUserDetails } from "./utils";

function App() {
    const { token: userToken, setToken } = useTokenStore();
    const { setUserDetails, userDetails } = useUserDetailStore();
    const navigate = useNavigate();
    useLayoutEffect(() => {
        if (!userToken) {
            //todo check
            // navigate("/signin");
            window.location.href = "/signin";
        } else {
            getUserDetails(userToken)
                .then((data) => {
                    if (data) {
                        setUserDetails(data);
                        // navigate("/profile");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }, [userToken]);
    return <>{userDetails ? <ChatApp /> : "Loading..."}</>;
}

export default App;
