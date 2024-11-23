const searchUsers = async (query: string) => {
    try {
        const response = await fetch(`/api/searchUser?search=${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error);
        }
        return json.users as UserDetails[];
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return [];
    }
};
export default searchUsers;
