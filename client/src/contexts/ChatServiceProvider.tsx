import { createContext, useContext, useEffect, useCallback } from "react";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useUserDetailStore from "@/store/userDetails";
import useChatStore from "@/store/chatStore";
import useChatOpenedStore from "@/store/chatOpened";
import useMemberStore from "@/store/membersStore";
import { toast } from "sonner";

type ChatServiceContextType = {
    loading: boolean;
    createChat: (userId2: string) => Promise<Chat | null>;
    createGroup: (data: {
        name: string;
        members: string[];
        displayPicture?: string;
    }) => Promise<Group | null>;
    removeMember: (data: { groupId: string; userId: string }) => void;
    editGroup: (data: {
        groupId: string;
        name?: string;
        displayPicture?: string;
        newMembers?: string[];
    }) => void;
    refetch: () => void;
};

const ChatServiceContext = createContext<ChatServiceContextType | null>(null);

export const ChatServiceProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { socket, contacts } = useSocket();
    const { userDetails } = useUserDetailStore();
    const { chatOpened, setChatOpened } = useChatOpenedStore();
    const { updateMembers } = useMemberStore();
    const {
        chats,
        groups,
        loading,
        setChats,
        setGroups,
        setCombinedList,
        setLoading,
        setError,
        updateLastMessage,
    } = useChatStore();

    const fetchChatsAndGroups = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.GET_CHATS_AND_GROUPS);
    }, [socket]);

    const createChat = useCallback(
        async (userId2: string) => {
            if (!socket) return null;
            return new Promise<Chat | null>((resolve, reject) => {
                socket.emit(
                    SOCKET_EVENTS.CREATE_CHAT,
                    { userId2 },
                    (response: { chat?: Chat; error?: string }) => {
                        if (response.error) {
                            toast.error(response.error);
                            reject(null);
                        } else if (response.chat) {
                            resolve(response.chat);
                        }
                    }
                );
            });
        },
        [socket]
    );

    const createGroup = useCallback(
        async (data: {
            name: string;
            members: string[];
            displayPicture?: string;
        }) => {
            if (!socket) return null;
            return new Promise<Group | null>((resolve, reject) => {
                socket.emit(
                    SOCKET_EVENTS.CREATE_GROUP,
                    data,
                    (response: { group?: Group; error?: string }) => {
                        if (response.error) {
                            toast.error(response.error);
                            reject(null);
                        } else if (response.group) {
                            resolve(response.group);
                        }
                    }
                );
            });
        },
        [socket]
    );

    const removeMember = useCallback(
        ({ groupId, userId }: { groupId: string; userId: string }) => {
            if (!socket) return;
            socket.emit(SOCKET_EVENTS.REMOVE_MEMBER, { groupId, userId });
        },
        [socket]
    );

    const editGroup = useCallback(
        (data: {
            groupId: string;
            name?: string;
            displayPicture?: string;
            newMembers?: string[];
        }) => {
            if (!socket) return;
            socket.emit(SOCKET_EVENTS.EDIT_GROUP, data);
        },
        [socket]
    );

    useEffect(() => {
        if (!socket || !userDetails) return;

        const handleChatsAndGroups = (data: {
            chats: Chat[];
            groups: Group[];
        }) => {
            setLoading(false);
            setChats(data.chats);
            setGroups(data.groups);
        };

        const handleChatCreated = (data: { chat: Chat }) => {
            if (data.chat) {
                setChats((prevChats) => [...prevChats, data.chat]);
            } else {
                toast.error("Failed to create chat");
            }
        };

        const handleGroupCreated = (data: { group: Group }) => {
            if (data.group) {
                setGroups((prevGroups) => [...prevGroups, data.group]);
            } else {
                toast.error("Failed to create group");
            }
        };

        const handleGroupEdited = (data: { group: Group }) => {
            if (data.group) {
                if (chatOpened?._id === data.group._id) {
                    setChatOpened((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            members: data.group.members,
                        };
                    });
                }
                console.log(data.group);
                setGroups((prevGroups) => {
                    const found = prevGroups.find(
                        (g) => g._id === data.group._id
                    );
                    if (!found) return [...prevGroups, data.group];
                    return prevGroups.map((g) =>
                        g._id === data.group._id ? data.group : g
                    );
                });
            }
        };

        const handleMemberRemoved = (data: {
            groupId: string;
            userId: string;
        }) => {
            if (chatOpened?._id === data.groupId) {
                if (data.userId === userDetails._id) {
                    setChatOpened(null);
                } else {
                    setChatOpened((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            members: prev.members.filter(
                                (m) => m.user._id !== data.userId
                            ),
                        };
                    });
                }
            }
            setGroups((prevGroups) =>
                prevGroups
                    .map((g) => {
                        if (g._id === data.groupId) {
                            return {
                                ...g,
                                members: g.members.filter(
                                    (m) => m.user._id !== data.userId
                                ),
                            };
                        }
                        return g;
                    })
                    .filter((g) => g.members.length > 0)
            );
        };
        const handleNewMessage = (message: Message) => {
            updateLastMessage(
                message.chatId,
                message.senderId,
                message.text,
                message.createdAt
            );
        };

        socket.on(SOCKET_EVENTS.CHATS_AND_GROUPS, handleChatsAndGroups);
        socket.on(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
        socket.on(SOCKET_EVENTS.GROUP_CREATED, handleGroupCreated);
        socket.on(SOCKET_EVENTS.GROUP_EDITED, handleGroupEdited);
        socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);

        return () => {
            socket.off(SOCKET_EVENTS.CHATS_AND_GROUPS, handleChatsAndGroups);
            socket.off(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
            socket.off(SOCKET_EVENTS.GROUP_CREATED, handleGroupCreated);
            socket.off(SOCKET_EVENTS.GROUP_EDITED, handleGroupEdited);
            socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
            socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
        };
    }, [socket, userDetails, chatOpened]);

    useEffect(() => {
        if (!userDetails) return;
        const list = [
            ...chats.map((chat) => {
                const otherMember = chat.members.find(
                    (member) => member.user._id !== userDetails._id
                );
                const contact = contacts.find(
                    (c) => c.userId === otherMember?.user._id
                );

                return {
                    _id: chat._id,
                    type: "chat" as const,
                    displayName:
                        contact?.nickname ||
                        contact?.username ||
                        (otherMember?.user.username || "") + " (Unknown)",
                    displayPicture: otherMember?.user.avatarUrl || "",
                    lastMessage: chat.messages[0]
                        ? `${
                              chat.messages[0].senderId === userDetails._id
                                  ? "You: "
                                  : ""
                          }${chat.messages[0].text}`
                        : "Start Chatting",
                    lastMessageAt: chat.messages[0]?.createdAt || null,
                    members: chat.members,
                };
            }),
            ...groups.map((group) => ({
                _id: group._id,
                type: "group" as const,
                displayName: group.name,
                displayPicture: group.displayPicture,
                lastMessage: group.messages[0]
                    ? `${
                          group.messages[0].senderId === userDetails._id
                              ? "You: "
                              : ""
                      }${group.messages[0].text}`
                    : "Start Chatting",
                lastMessageAt: group.messages[0]?.createdAt || null,
                members: group.members,
            })),
            ...contacts
                .filter(
                    (contact) =>
                        !chats.some((chat) =>
                            chat.members.some(
                                (m) => m.user._id === contact.userId
                            )
                        )
                )
                .map((contact) => ({
                    userId: contact.userId,
                    type: "contact" as const,
                    displayName: contact.nickname || contact.username,
                    displayPicture: contact.avatarUrl,
                    lastMessage: "Start Chatting",
                    lastMessageAt: null,
                })),
        ].sort((a, b) => {
            if (!a.lastMessageAt && !b.lastMessageAt) return 0;
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return (
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime()
            );
        });
        setCombinedList(list);
        setLoading(false);
    }, [chats, groups, contacts, userDetails]);

    useEffect(() => {
        fetchChatsAndGroups();
    }, [userDetails]);

    useEffect(() => {
        if (userDetails && chatOpened && chatOpened.members.length > 0) {
            if (chatOpened.type === "chat") {
                const found = contacts.find((e) =>
                    chatOpened.members.some((m) => m.user._id === e.userId)
                );
                if (found && chatOpened.displayName.includes(" (Unknown)")) {
                    setChatOpened((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            displayName: found.nickname || found.username,
                        };
                    });
                } else if (
                    !found &&
                    !chatOpened.displayName.includes(" (Unknown)")
                ) {
                    setChatOpened((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            displayName: prev.displayName + " (Unknown)",
                        };
                    });
                }
            }
            updateMembers(chatOpened.members, userDetails._id, contacts);
        }
    }, [chatOpened, contacts, chats, groups, userDetails, updateMembers]);

    const value = {
        loading,
        createChat,
        createGroup,
        removeMember,
        editGroup,
        refetch: fetchChatsAndGroups,
    };

    return (
        <ChatServiceContext.Provider value={value}>
            {children}
        </ChatServiceContext.Provider>
    );
};

export const useChatService = () => {
    const context = useContext(ChatServiceContext);
    if (!context) {
        throw new Error(
            "useChatService must be used within ChatServiceProvider"
        );
    }
    return context;
};
