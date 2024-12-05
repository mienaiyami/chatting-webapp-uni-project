import { useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useUserDetailStore from "@/store/userDetails";
import useChatStore from "@/store/chatStore";
import useUserContacts from "@/hooks/useUserContacts";
import { toast } from "sonner";
import useChatOpenedStore from "@/store/chatOpened";
import useMemberStore from "@/store/membersStore";

const useChat = () => {
    const { socket } = useSocket();
    const { userDetails } = useUserDetailStore();
    const { contacts } = useUserContacts();
    const chatOpened = useChatOpenedStore((e) => e.chatOpened);
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

    // const fetchChatsAndGroups = useCallback(async () => {
    //     try {
    //         setLoading(true);
    //         const response = await fetch("/api/chat-groups");
    //         if (!response.ok) throw new Error("Failed to fetch");
    //         const data = await response.json();
    //         setChats(data.chats);
    //         setGroups(data.groups);
    //     } catch (err: any) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

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
                            // setError(response.error);
                            toast.error(response.error);
                            reject(null);
                        } else if (response.chat) {
                            resolve(response.chat!);
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
                            // setError(response.error);
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
    // using this to get self removed from group as well
    const removeMember = useCallback(
        async ({ groupId, userId }: { groupId: string; userId: string }) => {
            if (!socket) return;
            socket.emit(SOCKET_EVENTS.REMOVE_MEMBER, { groupId, userId });
        },
        [socket]
    );
    const editGroup = useCallback(
        async (data: {
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

    // const createChat = useCallback(
    //     async (userId2: string): Promise<Chat | null> => {
    //         try {
    //             const response = await fetch("/api/chat-groups/create-chat", {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ userId2 }),
    //             });
    //             if (!response.ok) throw new Error("Failed to create chat");
    //             const data = await response.json();
    //             setChats([...chats, data.chat]);
    //             return data.chat;
    //         } catch (err: any) {
    //             setError(err.message);
    //             return null;
    //         }
    //     },
    //     [chats, setChats]
    // );

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
                // setChatOpened();
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
                setGroups((prevGroups) =>
                    prevGroups.map((g) =>
                        g._id === data.group._id ? data.group : g
                    )
                );
            }
        };

        const handleError = (data: { message: any }) => {
            setLoading(false);
            setError(data.message);
        };

        const handleNewMessage = (message: Message) => {
            updateLastMessage(
                message.chatId,
                message.senderId,
                message.text,
                message.createdAt
            );
        };

        const handleMemberRemoved = ({
            chatId,
            userId,
        }: {
            chatId: string;
            userId: string;
        }) => {
            if (userId === userDetails._id) {
                setGroups((prevGroups) =>
                    prevGroups.filter((g) => g._id !== chatId)
                );
            } else {
                setGroups((prevGroups) =>
                    prevGroups.map((group) =>
                        group._id === chatId
                            ? {
                                  ...group,
                                  members: group.members.filter(
                                      (m) => m.user._id !== userId
                                  ),
                              }
                            : group
                    )
                );
            }
        };

        socket.on(SOCKET_EVENTS.CHATS_AND_GROUPS, handleChatsAndGroups);
        socket.on(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
        socket.on(SOCKET_EVENTS.GROUP_CREATED, handleGroupCreated);
        socket.on(SOCKET_EVENTS.GROUP_EDITED, handleGroupEdited);
        socket.on("error", handleError);
        socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        socket.on(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);

        return () => {
            socket.off(SOCKET_EVENTS.CHATS_AND_GROUPS, handleChatsAndGroups);
            socket.off(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
            socket.off(SOCKET_EVENTS.GROUP_CREATED, handleGroupCreated);
            socket.off("error", handleError);
            socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
            socket.off(SOCKET_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
        };
    }, [socket, chats, userDetails]);

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

    useLayoutEffect(() => {
        if (chatOpened && chatOpened.members.length > 0) {
            updateMembers(chatOpened.members, userDetails?._id || "", contacts);
        }
    }, [chatOpened, contacts, chats, groups, userDetails]);

    return {
        loading,
        createChat,
        createGroup,
        removeMember,
        editGroup,
        refetch: fetchChatsAndGroups,
    };
};

export default useChat;
