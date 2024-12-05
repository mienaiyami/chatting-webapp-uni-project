"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash, UserPlus, UserSearch } from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { toast } from "sonner";
import searchUsers from "@/requests/searchUsers";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useSocket } from "@/socket/SocketProvider";

export default function AddContactDialog() {
    //todo use some sort of cache?
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<UserDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const currentUser = useUserDetailStore((s) => s.userDetails);
    const { contacts, updateContact } = useSocket();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                setIsLoading(true);
                searchUsers(searchQuery)
                    .then(setUsers)
                    .finally(() => setIsLoading(false));
            } else {
                setUsers([]);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, contacts]);

    return (
        <Dialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size={"icon"}>
                            <UserSearch className="h-5 w-5" />
                            <span className="sr-only">Add Contact</span>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent className="text-xs px-2 py-1">
                    Add Contact
                </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-[425px] select-none">
                <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isLoading && (
                        <p className="text-sm text-muted-foreground">
                            Loading...
                        </p>
                    )}
                    {!isLoading && users.length > 0 && (
                        <ul className="space-y-2">
                            {users.map((user) => (
                                <li
                                    key={user._id}
                                    className="flex items-center justify-items-stretch space-x-2"
                                >
                                    <Button
                                        variant="ghost"
                                        className="flex w-full space-x-2 items-center h-full p-2 rounded-md"
                                        disabled={user._id === currentUser?._id}
                                        onClick={() => {
                                            updateContact(user._id, "add");
                                        }}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={user.avatarUrl}
                                                alt={user.username}
                                            />
                                            <AvatarFallback>
                                                {user.username
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow min-w-0 flex flex-col items-start">
                                            <p className="text-sm font-medium truncate">
                                                {user.username}{" "}
                                                {user._id ===
                                                    currentUser?._id && "(You)"}
                                                {contacts.find(
                                                    (contact) =>
                                                        contact.userId ===
                                                        user._id
                                                ) && " (In Contacts)"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </Button>
                                    {contacts.find(
                                        (c) => c.userId === user._id
                                    ) && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-[3.2rem]"
                                            onClick={() => {
                                                updateContact(
                                                    user._id,
                                                    "remove"
                                                );
                                            }}
                                        >
                                            <Trash className="h-full" />
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {!isLoading && searchQuery && users.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No users found
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
