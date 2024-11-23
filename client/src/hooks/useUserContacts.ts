import { useState, useEffect, useCallback } from "react";

const useUserContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContacts = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await fetch(`/api/userContacts`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}`,
                },
                signal,
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || json.error);
            }
            setContacts(json.contacts);
        } catch (error: any) {
            console.error("An unexpected error occurred:", error);
            if (error.name !== "AbortError") {
                setError(error.message || "An unexpected error occurred");
            }
            setContacts([]);
        }
    }, []);
    const updateContact = async (
        token: string,
        userId: string,
        action: "add" | "remove",
        note = "",
        nickname = ""
    ) => {
        try {
            const response = await fetch(`/api/updateContact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    action,
                    note,
                    nickname,
                }),
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || json.error);
            }
            setContacts(json.contacts);
            return json;
        } catch (error: any) {
            console.error("An unexpected error occurred:", error);
            return { error: error.message || "An unexpected error occurred" };
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchContacts(controller.signal).finally(() => setLoading(false));

        return () => {
            controller.abort();
        };
    }, [fetchContacts]);

    return {
        contacts,
        loading,
        error,
        refetchContacts: fetchContacts,
        updateContact,
    };
};

export default useUserContacts;
