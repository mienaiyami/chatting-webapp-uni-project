export const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    NEW_MESSAGE: "new_message",
    JOIN_ROOM: "join_room",
    LEAVE_ROOM: "leave_room",
    USER_TYPING: "user_typing",
    USER_STOP_TYPING: "user_stop_typing",
    USER_ONLINE: "user_online",
    USER_OFFLINE: "user_offline",
    GET_ONLINE_CONTACTS: "get_online_contacts",
    ONLINE_CONTACTS: "online_contacts",
    GET_CHATS_AND_GROUPS: "GET_CHATS_AND_GROUPS",
    CHATS_AND_GROUPS: "CHATS_AND_GROUPS",
    CREATE_CHAT: "CREATE_CHAT",
    CHAT_CREATED: "CHAT_CREATED",
    GET_CONTACTS: "GET_CONTACTS",
    CONTACTS: "CONTACTS",
    UPDATE_CONTACT: "UPDATE_CONTACT",
    CONTACT_UPDATED: "CONTACT_UPDATED",
    GET_MESSAGES: "GET_MESSAGES",
    MESSAGES: "MESSAGES",
    CLEAR_CHAT: "CLEAR_CHAT",
    CHAT_CLEARED: "CHAT_CLEARED",
    DELETE_MESSAGE: "DELETE_MESSAGE",
    MESSAGE_DELETED: "MESSAGE_DELETED",
    EDIT_MESSAGE: "EDIT_MESSAGE",
    MESSAGE_EDITED: "MESSAGE_EDITED",
    CREATE_GROUP: "CREATE_GROUP",
    GROUP_CREATED: "GROUP_CREATED",
    EDIT_GROUP: "EDIT_GROUP",
    GROUP_EDITED: "GROUP_EDITED",
    REMOVE_MEMBER: "REMOVE_MEMBER",
    MEMBER_REMOVED: "MEMBER_REMOVED",
} as const;
