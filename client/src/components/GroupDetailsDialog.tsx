import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CalendarDays,
    Edit,
    MoreVertical,
    Search,
    UserPlus,
} from "lucide-react";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useUserDetailStore from "@/store/userDetails";
import useChatOpenedStore from "@/store/chatOpened";
import { toast } from "sonner";
import { Separator } from "./ui/separator";
import { formatDate2 } from "@/utils";
import { useDialog } from "./ui/use-dialog";
import GroupDetailsEditDialog from "./GroupDetailsEditDialog";
import { useChatService } from "@/contexts/ChatServiceProvider";

type GroupDetailsDialogProps = {
    trigger: () => void;
};

export function GroupDetailsDialog({ trigger }: GroupDetailsDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const userDetails = useUserDetailStore((s) => s.userDetails);
    const chatOpened = useChatOpenedStore((s) => s.chatOpened);
    const { removeMember } = useChatService();
    const groupDetailsEditDialog = useDialog<HTMLButtonElement>();

    if (!chatOpened || chatOpened.type !== "group") return null;
    // todo: use membersMap instead?
    const sortedMembers = [...chatOpened.members].sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return 0;
    });

    const filteredMembers = sortedMembers.filter(
        (member) =>
            member.user.username
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            (member.user.nickname?.toLowerCase() || "").includes(
                searchQuery.toLowerCase()
            )
    );

    const handleMakeAdmin = (userId: string) => {
        // if (!socket) return;
        // socket.emit(
        //     SOCKET_EVENTS.MAKE_ADMIN,
        //     {
        //         groupId: chatOpened._id,
        //         userId,
        //     },
        //     (response: { error?: string }) => {
        //         if (response.error) {
        //             toast.error(response.error);
        //         }
        //     }
        // );
    };

    const isAdmin =
        chatOpened.members.find((m) => m.user._id === userDetails?._id)
            ?.role === "admin";

    // not wrapped in dialog because have to control dialog from outside
    return (
        <DialogContent className="sm:max-w-[425px] cursor-default">
            <DialogHeader className="select-none">
                <DialogTitle>Group Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                        <AvatarImage
                            src={chatOpened.displayPicture}
                            alt={chatOpened.displayName}
                        />
                        <AvatarFallback>
                            {chatOpened.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {chatOpened.displayName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {chatOpened.members.length} members
                        </p>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground text-red-600 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Created on {formatDate2(new Date())}
                </p>
                <div className="select-none">
                    <h3 className="mb-2 text-lg font-semibold relative">
                        Members
                    </h3>
                    <div className="flex items-center mb-2 relative">
                        <Input
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8"
                        />
                        <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <ScrollArea className="h-[200px]">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.user._id}
                                className="flex items-center justify-between h-12 p-2 hover:bg-accent/50 rounded-md"
                            >
                                <div className="flex items-center">
                                    <Avatar className="w-8 h-8 mr-2">
                                        <AvatarImage
                                            src={member.user.avatarUrl}
                                            alt={member.user.username}
                                        />
                                        <AvatarFallback>
                                            {member.user.username
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className=" select-text">
                                        <p className="text-sm font-medium">
                                            {member.user.username}
                                            {member.user._id ===
                                                userDetails?._id && " (You)"}
                                        </p>
                                        <p className="text-xs text-muted-foreground text-red-500">
                                            {member.user.email || "aa"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center select-none">
                                    {member.role === "admin" && (
                                        <Badge variant="secondary">Admin</Badge>
                                    )}
                                    {isAdmin &&
                                        member.user._id !==
                                            userDetails?._id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {member.role !==
                                                        "admin" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleMakeAdmin(
                                                                    member.user
                                                                        ._id
                                                                )
                                                            }
                                                        >
                                                            Make Admin
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            removeMember({
                                                                groupId:
                                                                    chatOpened._id,
                                                                userId: member
                                                                    .user._id,
                                                            })
                                                        }
                                                    >
                                                        Remove from Group
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                {isAdmin && (
                    <div className="flex justify-between">
                        <Button
                            className="flex items-center w-full "
                            {...groupDetailsEditDialog.triggerProps}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                            <Separator
                                orientation="vertical"
                                className="mx-6"
                            />
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Members
                        </Button>
                        <GroupDetailsEditDialog
                            {...groupDetailsEditDialog.dialogProps}
                        />
                    </div>
                )}
                <Button variant="destructive" onClick={trigger}>
                    Leave Group
                </Button>
            </div>
        </DialogContent>
    );
}
