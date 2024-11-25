import useTokenStore from "@/store/token";
import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "./events";
import useChatOpenedStore from "@/store/chatOpened";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineContacts: string[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineContacts: [],
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineContacts, setOnlineContacts] = useState<string[]>([]);
    const token = useTokenStore((e) => e.token);
    const { chatOpened, setChatOpened } = useChatOpenedStore();

    useLayoutEffect(() => {
        if (!token) return;
        const socketInstance = io("http://localhost:6969", {
            auth: {
                token,
            },
            // withCredentials: true,
        });

        socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
            console.log("Connected to socket server");
            setIsConnected(true);
            socketInstance.emit(SOCKET_EVENTS.GET_ONLINE_CONTACTS);
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

        socketInstance.on(SOCKET_EVENTS.NEW_MESSAGE, (message: Message) => {
            // todo handle for sidebar display

            if (chatOpened && message.chatId === chatOpened._id) {
                // push message to chat
            }
        });

        socketInstance.on(SOCKET_EVENTS.DISCONNECT, () => {
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineContacts }}>
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
