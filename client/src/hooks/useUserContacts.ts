import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../socket/SocketProvider";
import { SOCKET_EVENTS } from "../../../server/socket/events";

type ContactsResponse = {
    contacts: Contact[];
    message?: string;
};

type ErrorResponse = {
    message: string;
};

const useUserContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { socket } = useSocket();

    const fetchContacts = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.GET_CONTACTS);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleContactsReceived = ({ contacts }: ContactsResponse) => {
            setContacts(contacts);
            setLoading(false);
        };

        const handleContactUpdated = ({
            contacts,
            message,
        }: ContactsResponse) => {
            if (contacts) {
                setContacts(contacts);
            }
            setLoading(false);
        };

        const handleError = ({ message }: ErrorResponse) => {
            setError(message);
            setLoading(false);
        };

        socket.on(SOCKET_EVENTS.CONTACTS, handleContactsReceived);
        socket.on(SOCKET_EVENTS.CONTACT_UPDATED, handleContactUpdated);
        socket.on("error", handleError);

        fetchContacts();

        return () => {
            socket.off(SOCKET_EVENTS.CONTACTS, handleContactsReceived);
            socket.off(SOCKET_EVENTS.CONTACT_UPDATED, handleContactUpdated);
            socket.off("error", handleError);
        };
    }, [socket, fetchContacts]);

    const updateContact = async (
        userId: string,
        action: "add" | "remove",
        note = "",
        nickname = ""
    ) => {
        if (!socket) return { error: "Socket not connected" };

        try {
            socket.emit(SOCKET_EVENTS.UPDATE_CONTACT, {
                userId,
                action,
                note,
                nickname,
            });
            return { success: true };
        } catch (error: any) {
            console.error("An unexpected error occurred:", error);
            return { error: error.message || "An unexpected error occurred" };
        }
    };

    return {
        contacts,
        loading,
        error,
        refetchContacts: fetchContacts,
        updateContact,
    };
};

export default useUserContacts;
