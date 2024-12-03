import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import AddContactDialog from "./AddContactDialog";
import useChatOpenedStore from "@/store/chatOpened";
import useChat from "@/hooks/useChat";
import { formatDate } from "@/utils";
import useUserDetailStore from "@/store/userDetails";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import useChatStore from "@/store/chatStore";
import { Search, Users } from "lucide-react";
import CreateGroupDialog from "./CreateGroupDialog";

export function Sidebar() {
    const [searchQuery, setSearchQuery] = useState("");
    const { chatOpened, setChatOpened } = useChatOpenedStore();
    const userDetails = useUserDetailStore((state) => state.userDetails)!;

    const { createChat, loading } = useChat();
    const { combinedList } = useChatStore();

    if (loading) {
        return (
            <div className="w-1/2 sm:w-72 lg:w-96 flex-shrink-0 border rounded-l-lg flex flex-col select-none">
                Loading...
            </div>
        );
    }
    return (
        <div className="w-1/2 sm:w-72 lg:w-96 flex-shrink-0 border rounded-l-lg flex flex-col">
            <TooltipProvider
                delayDuration={500}
                disableHoverableContent
                skipDelayDuration={500}
            >
                <div className="p-4 border-b h-18 flex flex-row gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link to={"/profile"} className="rounded-full">
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
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs px-2 py-1">
                            Profile
                        </TooltipContent>
                    </Tooltip>
                    <AddContactDialog />
                    <CreateGroupDialog />
                    {/* <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Users className="h-5 w-5" />
                                <span className="sr-only">Create Group</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs px-2 py-1">
                            Create Group
                        </TooltipContent>
                    </Tooltip> */}
                    {/* <Button variant="ghost" size="icon">
                        <MessageSquare className="h-5 w-5" />
                        <span className="sr-only">New Message</span>
                    </Button> */}
                </div>
                <div className="p-4 relative">
                    <Search
                        size={"1.3em"}
                        className="opacity-40 pointer-events-none absolute top top-1/2 -translate-y-1/2 left-6 "
                    />
                    <Input
                        placeholder="Search"
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {combinedList.length === 0 && (
                    <div className="flex-grow flex items-center justify-center select-none">
                        <span className="text-muted-foreground">
                            No contacts/chat found
                        </span>
                    </div>
                )}
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
                                    chat.type !== "contact"
                                        ? chat._id
                                        : chat.userId
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
                                        console.log(newChat);
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
                                            members:
                                                chat.type === "chat"
                                                    ? chat?.members || []
                                                    : [],
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
                                        {chat.displayName
                                            .slice(0, 2)
                                            .toUpperCase()}
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
            </TooltipProvider>
        </div>
    );
}
