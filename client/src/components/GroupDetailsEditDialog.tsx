import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Check } from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { toast } from "sonner";
import searchUsers from "@/requests/searchUsers";
import { Label } from "./ui/label";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { DialogDescription } from "@radix-ui/react-dialog";
import useChatOpenedStore from "@/store/chatOpened";
import { useChatService } from "@/contexts/ChatServiceProvider";
import { useSocket } from "@/socket/SocketProvider";

type GroupDetailsEditDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function GroupDetailsEditDialog({
    open,
    onOpenChange,
}: GroupDetailsEditDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<UserDetails[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const { editGroup } = useChatService();
    const { chatOpened } = useChatOpenedStore();

    const [displayPicture, setDisplayPicture] = useState<string | null>(null);

    const currentUser = useUserDetailStore((s) => s.userDetails);
    const { contacts } = useSocket();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery && chatOpened) {
                setIsLoading(true);
                searchUsers(searchQuery)
                    .then((users) => {
                        setUsers(
                            users.filter((user) => {
                                return !chatOpened.members.some(
                                    (e) => e.user._id === user._id
                                );
                            })
                        );
                    })
                    .catch(() => {
                        toast.error("Failed to search users");
                    })
                    .finally(() => setIsLoading(false));
            } else {
                setUsers([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const toggleUserSelection = (user: UserDetails) => {
        setSelectedUsers((prev) => {
            if (prev.some((u) => u._id === user._id)) {
                return prev.filter((u) => u._id !== user._id);
            }
            return [...prev, user];
        });
    };

    const handleEditGroup = async () => {
        if (!chatOpened) return;
        editGroup({
            groupId: chatOpened._id,
            name: groupName,
            displayPicture: displayPicture || undefined,
            newMembers: selectedUsers.map((user) => user._id),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                onOpenChange(open);
                if (!open) {
                    setGroupName("");
                    setSelectedUsers([]);
                    setDisplayPicture(null);
                }
            }}
        >
            <DialogContent className="sm:max-w-96 select-none">
                <DialogHeader>
                    <DialogTitle>Edit Group Details</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-sm text-muted-foreground">
                    Leave empty to keep the current value
                </DialogDescription>
                <div className="grid gap-2 py-4">
                    <Label className="flex flex-col gap-2 mb-2">
                        Group Name
                        <Input
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </Label>
                    <Label
                        className={`flex flex-col gap-2 ${
                            displayPicture ? "" : "mb-2"
                        }`}
                    >
                        Avatar
                        <Input
                            type="file"
                            className="col-span-3"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        setDisplayPicture(
                                            reader.result as string
                                        );
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </Label>
                    {displayPicture && (
                        <div className="flex flex-row items-center px-4 gap-4">
                            <div className="mb-2 flex justify-center">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage
                                        src={displayPicture}
                                        alt="Profile picture"
                                    />
                                    <AvatarFallback>UP</AvatarFallback>
                                </Avatar>
                            </div>
                            <Button
                                variant={"ghost"}
                                onClick={() => {
                                    setDisplayPicture(null);
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    )}

                    <Label className="flex flex-col gap-2 ">
                        Add Members
                        <div className="relative">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </Label>
                    {selectedUsers.length > 0 && (
                        <div className="text-xs flex flex-col gap-0.5 border-b pb-2">
                            <span>Selected Users ({selectedUsers.length})</span>
                            <ScrollArea className="w-80 mx-auto">
                                <div className="w-full flex flex-row gap-1 flex-nowrap ">
                                    {selectedUsers.map((user) => (
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                toggleUserSelection(user)
                                            }
                                            key={user._id}
                                            className="flex items-center space-x-2 bg-accent/50 rounded-full p-1 text-xs h-6"
                                        >
                                            <Avatar className="w-4 h-4">
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
                                            <span className="max-w-24 pr-1 truncate">
                                                {user.username}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    )}
                    {isLoading && (
                        <p className="text-sm text-muted-foreground">
                            Loading...
                        </p>
                    )}
                    {!isLoading && users.length > 0 && (
                        <ScrollArea className="w-full">
                            <div className="max-h-60 p-1">
                                {users.map((user) => (
                                    <Button
                                        key={user._id}
                                        variant={"ghost"}
                                        className={`flex w-full space-x-2 items-center h-full p-2 rounded-md ${
                                            selectedUsers.some(
                                                (u) => u._id === user._id
                                            )
                                                ? "bg-accent/50"
                                                : ""
                                        }`}
                                        disabled={user._id === currentUser?._id}
                                        onClick={() =>
                                            toggleUserSelection(user)
                                        }
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
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    )}
                    {!isLoading && searchQuery && users.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No users found / Already in group
                        </p>
                    )}
                </div>
                <div className="flex justify-end space-x-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setGroupName("");
                                setSelectedUsers([]);
                            }}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleEditGroup}>Save</Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
