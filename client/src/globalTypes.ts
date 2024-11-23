declare global {
    type Message = {
        _id: string;
        chatId: string;
        senderId: string;
        text: string;
        imageUrl: string;
        videoUrl: string;
        deletedAt: Date;
        createdAt: Date;
        modifiedAt: Date;
    };
    type UserDetails = {
        email: string;
        username: string;
        avatarUrl: string;
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
    type Chat = {
        _id: string;
        members: string[];
        messages: string[];
    };
    type Group = {
        _id: string;
        name: string;
        displayPicture: string;
        description: string;
        members: {
            user: string[];
            joinedAt: Date;
        }[];
        admins: string[];
        messages: string[];
        createdAt: Date;
    };
}
