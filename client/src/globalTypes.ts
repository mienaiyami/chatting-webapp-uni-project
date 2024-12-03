interface EmEmojiProps {
    id?: string;
    shortcodes?: string;
    native?: string;
    size?: string;
    fallback?: string;
    set?: "native" | "apple" | "facebook" | "google" | "twitter";
    skin?: 1 | 2 | 3 | 4 | 5 | 6;
}
declare global {
    type Message = {
        _id: string;
        chatId: string;
        senderId: string;
        text: string;
        attachment?: {
            fType: "image" | "video" | "audio" | "file";
            url: string;
            mimeType: string;
            size: number;
            name: string;
        } | null;
        /**only send id to backend, while fetching get it pre-populated with message so
         * dont need to find by id
         */
        repliedTo: Message | null;
        deletedAt: Date | null;
        createdAt: Date;
        modifiedAt: Date;
    };
    /**Messages which are not yet in db */
    type OptimisticMessage = Message & {
        optimistic?: boolean;
        tempId?: string;
    };

    type UserDetails = {
        email: string;
        username: string;
        avatarUrl?: string;
        nickname?: string;
        _id: string;
    };
    type Contact = {
        userId: string;
        username: string;
        avatarUrl: string;
        email: string;
        nickname: string;
        note: string;
    };

    type ChatMember = {
        user: UserDetails;
        joinedAt?: Date;
        role?: "admin" | "member";
    };
    type SimpleChatMember = {
        username: string;
        avatarUrl?: string;
        role?: "admin" | "member";
        joinedAt?: Date;
    };
    //todo : populate dp,name on server from other user?
    type Chat = {
        _id: string;
        members: ChatMember[];
        // will only be a single message
        messages: Message[];
    };
    type Group = {
        _id: string;
        name: string;
        displayPicture: string;
        description: string;
        members: ChatMember[];
        // will only be a single message
        messages: Message[];
        createdAt: Date;
    };
    type ChatGroupListType = {
        _id: string;
        type: "chat" | "group";
        displayName: string;
        displayPicture: string;
        lastMessage: string;
        lastMessageAt: Date | null;
        members?: ChatMember[];
        muted?: boolean;
    };
    type ContactListType = Omit<ChatGroupListType, "_id" | "type"> & {
        userId: string;
        type: "contact";
    };
    type CombinedChatListType = ChatGroupListType | ContactListType;
    type ChatGroupDetails = {
        _id: string;
        type: "chat" | "group";
        displayName: string;
        displayPicture: string;
        lastMessage: string;
        lastMessageAt: Date | null;
        muted?: boolean;
        /**this get filled later, not on `setChatOpened` */
        members: ChatMember[];
        admins?: UserDetails[];
    };

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "em-emoji": EmEmojiProps;
        }
    }
}
