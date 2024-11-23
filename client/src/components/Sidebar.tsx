import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Search, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import AddContactDialog from "./AddContactDialog";
import useUserContacts from "@/hooks/useUserContacts";
import useTokenStore from "@/store/token";
import useChatOpenedStore from "@/store/chatOpened";

export function Sidebar() {
    const [searchQuery, setSearchQuery] = useState("");
    const token = useTokenStore((s) => s.token)!;
    // first show all chats, then show contacts without a chat started
    const { contacts } = useUserContacts(token);
    const { chatOpened, setChatOpened } = useChatOpenedStore();
    const filteredContacts = contacts.filter((contact) =>
        (contact.nickname || contact.username)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-1/2 sm:w-72 lg:w-96 border rounded-l-lg flex flex-col">
            <div className="p-4 border-b h-18 flex flex-row gap-1">
                <Link to={"/profile"}>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
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
                {filteredContacts.map((contact) => (
                    <Button
                        variant={"ghost"}
                        key={contact.userId}
                        className={`flex w-full space-x-2 items-center h-full rounded-none p-2 hover:bg-accent first:border-t border-b 
                            ${
                                chatOpened === contact.userId ? "bg-accent" : ""
                            }`}
                        role="button"
                        tabIndex={-1}
                        onClick={() => {
                            // todo used chat id instead
                            setChatOpened(contact.userId);
                        }}
                    >
                        <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage
                                src={contact.avatarUrl}
                                alt={contact.username}
                            />
                            <AvatarFallback>
                                {(contact.nickname || contact.username)
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0 flex flex-col items-start">
                            <p className="font-medium truncate">
                                {contact.nickname || contact.username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {"Start Chatting"}
                            </p>
                        </div>
                    </Button>
                ))}
            </ScrollArea>
        </div>
    );
}
