import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Search, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import AddContactDialog from "./AddContactDialog";
import useChatOpenedStore from "@/store/chatOpened";
import useChat from "@/hooks/useChat";
import { formatDate } from "@/utils";
import useUserDetailStore from "@/store/userDetails";

export function Sidebar() {
    const [searchQuery, setSearchQuery] = useState("");
    const { chatOpened, setChatOpened } = useChatOpenedStore();
    const userDetails = useUserDetailStore((state) => state.userDetails)!;

    const { combinedList, createChat, loading } = useChat();

    if (loading) {
        return (
            <div className="w-1/2 sm:w-72 lg:w-96 border rounded-l-lg flex flex-col">
                Loading...
            </div>
        );
    }
    return (
        <div className="w-1/2 sm:w-72 lg:w-96 border rounded-l-lg flex flex-col">
            <div className="p-4 border-b h-18 flex flex-row gap-1">
                <Link to={"/profile"}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarImage
                                src={userDetails?.avatarUrl}
                                alt={userDetails?.username}
                            />
                            <AvatarFallback>
                                {userDetails?.username
                                    ?.slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Profile</span>
                    </Button>
                </Link>
                <AddContactDialog />
                <Button variant="ghost" size="icon">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">New Message</span>
                </Button>
            </div>
            <div className="p-4">
                <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-4"
                />
            </div>
            <ScrollArea className="flex-grow">
                {combinedList
                    .filter((e) =>
                        e.displayName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    )
                    .map((chat) => (
                        <Button
                            variant="ghost"
                            key={
                                chat.type !== "contact" ? chat._id : chat.userId
                            }
                            className={`flex w-full space-x-2 items-center h-full rounded-none p-2 hover:bg-accent first:border-t border-b 
                            ${
                                chatOpened?._id ===
                                (chat.type !== "contact"
                                    ? chat._id
                                    : chat.userId)
                                    ? "bg-accent"
                                    : ""
                            }`}
                            onClick={async () => {
                                if (chat.type === "contact") {
                                    const newChat = await createChat(
                                        chat.userId
                                    );
                                    if (newChat) {
                                        setChatOpened({
                                            ...chat,
                                            _id: newChat._id,
                                            type: "chat",
                                            members: newChat.members,
                                        });
                                    }
                                } else {
                                    setChatOpened({
                                        ...chat,
                                        members: [],
                                    });
                                }
                            }}
                        >
                            <Avatar className="h-10 w-10 mr-4">
                                <AvatarImage
                                    src={chat.displayPicture}
                                    alt={chat.displayName}
                                />
                                <AvatarFallback>
                                    {chat.displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow min-w-0 flex flex-col items-start">
                                <div className="flex flex-row w-full">
                                    <span className="font-medium truncate">
                                        {chat.displayName}
                                    </span>
                                    <span className="ml-auto font-xs text-muted-foreground">
                                        {chat.lastMessageAt
                                            ? formatDate(chat.lastMessageAt)
                                            : "-"}
                                    </span>
                                </div>
                                <span
                                    className="text-sm text-muted-foreground truncate"
                                    title={chat.lastMessage}
                                >
                                    {chat.lastMessage
                                        .replace("\n", " ")
                                        .slice(0, 20) +
                                        (chat.lastMessage.length > 20
                                            ? "..."
                                            : "")}
                                </span>
                            </div>
                        </Button>
                    ))}
            </ScrollArea>
        </div>
    );
}
