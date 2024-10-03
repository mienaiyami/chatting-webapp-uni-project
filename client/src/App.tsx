import { useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTokenStore from "./store/token";
import ProfilePage from "./components/Profile";
import useUserDetailStore from "./store/userDetails";
import { toast } from "sonner";

const getUserDetails = async (userToken: string) => {
    const response = await fetch("/api/userDetails", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
        },
    });
    const json = await response.json();
    if (response.ok) return json.user;
    return null;
};

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
                        navigate("/profile");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }, [userToken]);
    return <>{"Loading..."}</>;
}

export default App;
