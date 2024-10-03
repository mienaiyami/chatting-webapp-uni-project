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
import { Trash, UserPlus } from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { toast } from "sonner";
import useTokenStore from "@/store/token";

const fetchUsers = async (query: string) => {
    try {
        const response = await fetch(`/api/searchUser?search=${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error);
        }
        return json.users as UserDetails[];
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return [];
    }
};

const fetchContacts = async (token: string) => {
    try {
        const response = await fetch(`/api/userContacts`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error);
        }
        console.log(json.contacts);
        return json.contacts as { userId: string }[];
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return [];
    }
};

const updateContact = async (
    token: string,
    userId: string,
    action: "add" | "remove",
    note = "",
    nickname = ""
) => {
    const response = await fetch(`/api/updateContact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action, note, nickname }),
    });
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || json.error);
    }
    return json;
};

export default function AddContactDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<UserDetails[]>([]);
    const [contacts, setContacts] = useState<{ userId: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const currentUser = useUserDetailStore((s) => s.userDetails);
    const token = useTokenStore((s) => s.token);

    useLayoutEffect(() => {
        if (token) {
            fetchContacts(token).then(setContacts);
        }
    }, [setContacts, token]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                setIsLoading(true);
                fetchUsers(searchQuery)
                    .then(setUsers)
                    .finally(() => setIsLoading(false));
            } else {
                setUsers([]);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </DialogTrigger>
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
                                    <span
                                        className="flex w-full cursor-pointer space-x-2 items-center p-2 rounded-md hover:bg-accent"
                                        role="button"
                                        onClick={() => {
                                            if (token) {
                                                toast.promise(
                                                    updateContact(
                                                        token,
                                                        user._id,
                                                        "add"
                                                    ),
                                                    {
                                                        loading:
                                                            "Adding contact...",
                                                        success: (data) => {
                                                            setContacts(
                                                                data.contacts ||
                                                                    []
                                                            );
                                                            return (
                                                                data?.message ||
                                                                "Updated. "
                                                            );
                                                        },
                                                        error: (error) =>
                                                            error?.message ||
                                                            "An unexpected error occurred",
                                                    }
                                                );
                                            }
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
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {user.username}{" "}
                                                {user._id === currentUser?._id
                                                    ? "(You)"
                                                    : ""}
                                                {contacts.find(
                                                    (contact) =>
                                                        contact.userId ===
                                                        user._id
                                                ) && "(In Contacts)"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </span>
                                    {contacts.find(
                                        (c) => c.userId === user._id
                                    ) && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-[3.2rem]"
                                            onClick={() => {
                                                if (token) {
                                                    toast.promise(
                                                        updateContact(
                                                            token,
                                                            user._id,
                                                            "remove"
                                                        ),
                                                        {
                                                            loading:
                                                                "Removing contact...",
                                                            success: (data) => {
                                                                setContacts(
                                                                    data.contacts ||
                                                                        []
                                                                );
                                                                return (
                                                                    data?.message ||
                                                                    "Updated. "
                                                                );
                                                            },
                                                            error: (error) =>
                                                                error?.message ||
                                                                "An unexpected error occurred",
                                                        }
                                                    );
                                                }
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
