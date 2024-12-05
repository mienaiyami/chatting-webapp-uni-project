import useTokenStore from "@/store/token";
import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "./events";
import useChatOpenedStore from "@/store/chatOpened";
import { toast } from "sonner";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    onlineContacts: string[];
    typingUsers: string[];

    contacts: Contact[];
    updateContact: (
        userId: string,
        action: "add" | "remove",
        note?: string,
        nickname?: string
    ) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineContacts, setOnlineContacts] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const token = useTokenStore((state) => state.token);
    const { chatOpened, setChatOpened } = useChatOpenedStore();

    useLayoutEffect(() => {
        if (!token) return;
        const socketInstance = io(import.meta.env.VITE_BACKEND_URL, {
            auth: {
                token,
            },
            // withCredentials: true,
        });

        socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
            setIsConnected(true);
            setChatOpened(null);
            socketInstance.emit(SOCKET_EVENTS.GET_CONTACTS);
            socketInstance.emit(SOCKET_EVENTS.GET_ONLINE_CONTACTS);
        });

        socketInstance.on(SOCKET_EVENTS.DISCONNECT, () => {
            setIsConnected(false);
        });

        socketInstance.on(
            SOCKET_EVENTS.ONLINE_CONTACTS,
            ({ onlineContactIds }) => {
                setOnlineContacts(onlineContactIds);
            }
        );

        socketInstance.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }) => {
            setOnlineContacts((prev) => [...new Set([...prev, userId])]);
        });

        socketInstance.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }) => {
            setOnlineContacts((prev) => prev.filter((id) => id !== userId));
        });

        socketInstance.on(SOCKET_EVENTS.USER_TYPING, (userId: string) => {
            setTypingUsers((prev) => [...new Set([...prev, userId])]);
        });

        socketInstance.on(SOCKET_EVENTS.USER_STOP_TYPING, (userId: string) => {
            setTypingUsers((prev) => prev.filter((id) => id !== userId));
        });

        socketInstance.on(
            SOCKET_EVENTS.CONTACTS,
            ({ contacts }: { contacts: Contact[] }) => {
                setContacts(contacts);
            }
        );

        socketInstance.on(
            SOCKET_EVENTS.CONTACT_UPDATED,
            ({
                contacts,
                message,
            }: {
                contacts: Contact[];
                message?: string;
            }) => {
                socketInstance.emit(SOCKET_EVENTS.GET_ONLINE_CONTACTS);
                if (contacts) {
                    setContacts(contacts);
                }
                if (message) {
                    toast.success(message);
                }
            }
        );
        socketInstance.on("error", (data: { message: any }) => {
            console.error(data.message);
            toast.error(data.message || "An unexpected error occurred");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    useLayoutEffect(() => {
        if (!socket || !chatOpened) return;

        socket.emit(SOCKET_EVENTS.JOIN_ROOM, chatOpened._id);

        return () => {
            socket.emit(SOCKET_EVENTS.LEAVE_ROOM, chatOpened._id);
        };
    }, [socket, chatOpened]);

    const updateContact = (
        userId: string,
        action: "add" | "remove",
        note = "",
        nickname = ""
    ) => {
        if (!socket) {
            return;
        }

        socket.emit(SOCKET_EVENTS.UPDATE_CONTACT, {
            userId,
            action,
            note,
            nickname,
        });
    };

    const value = {
        socket,
        isConnected,
        onlineContacts,
        typingUsers,
        contacts,
        updateContact,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
