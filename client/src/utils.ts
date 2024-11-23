export const getUserDetails = async (userToken: string) => {
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
