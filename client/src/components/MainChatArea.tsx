import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Paperclip, X } from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "./ui/tooltip";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useChatOpenedStore from "@/store/chatOpened";
import useMessages from "@/hooks/useMessage";
import { convertHtmlToMarkdown } from "@/utils";
import { EmojiPicker } from "./ui/EmojiPicker";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useUserContacts from "@/hooks/useUserContacts";
import MessageItem from "./MessageItem";
import useMemberStore from "@/store/membersStore";
import { useDialog } from "./ui/use-dialog";
import { GroupDetailsDialog } from "./GroupDetailsDialog";
import useChat from "@/hooks/useChat";

function formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function MainChatArea() {
    const { messages, sendMessage, deleteMessage, editMessage, handleTyping } =
        useMessages();
    const { chatOpened } = useChatOpenedStore();
    const { removeMember } = useChat();
    const { updateContact } = useUserContacts();
    const userDetails = useUserDetailStore((state) => state.userDetails)!;
    const { socket, onlineContacts, typingUsers } = useSocket();
    const [newMessage, setNewMessage] = useState("");
    const { membersMap } = useMemberStore();

    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    // const [editText, setEditText] = useState("");

    const [selectedForReply, setSelectedForReply] = useState<Message | null>(
        null
    );
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const msgInputRef = useRef<HTMLTextAreaElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const clearChatDialog = useDialog<HTMLDivElement>();
    const leaveGroupDialog = useDialog<HTMLDivElement>();
    const groupDetailsDialog = useDialog<HTMLDivElement>();

    useEffect(() => {
        if (msgInputRef.current) {
            msgInputRef.current.style.height = "auto";
            msgInputRef.current.style.height = `${msgInputRef.current.scrollHeight}px`;
            if (editingMessage) {
                setEditingMessage(null);
                msgInputRef.current.focus();
            }
        }
    }, [newMessage]);

    const handleSendMessage = () => {
        if (chatOpened && (newMessage.trim() || selectedFile)) {
            if (selectedFile) {
                sendMessage({
                    chatId: chatOpened._id,
                    senderId: userDetails._id,
                    text: newMessage.trim() || selectedFile.name || "",
                    repliedTo: selectedForReply,
                    attachment: selectedFile,
                });
                setNewMessage("");
                setSelectedFile(null);
            } else {
                sendMessage({
                    chatId: chatOpened._id,
                    senderId: userDetails._id,
                    text: newMessage.trim(),
                    repliedTo: selectedForReply,
                });
                setNewMessage("");
                setSelectedForReply(null);
            }
        }
    };

    // useEffect(() => {
    //     if (chatOpened) {
    //         fetch(`/api/chat-groups/messages/${chatOpened._id}`)
    //             .then((res) => res.json())
    //             .then((data) => {
    //                 if (data.error) return console.error(data.error);
    //                 initializeMessages(data.messages);
    //             })
    //             .catch(console.error);
    //     } else {
    //         resetMessages();
    //     }
    // }, [chatOpened, initializeMessages, resetMessages]);

    //todo move to provider
    useEffect(() => {
        setNewMessage("");
        if (socket && chatOpened) {
            socket.emit(SOCKET_EVENTS.JOIN_ROOM, chatOpened._id);
            return () => {
                socket.emit(SOCKET_EVENTS.LEAVE_ROOM, chatOpened._id);
            };
        }
    }, [socket, chatOpened]);

    useEffect(() => {
        if (selectedForReply) {
            msgInputRef.current?.focus();
        }
    }, [selectedForReply]);
    useEffect(() => {
        scrollAreaRef.current?.querySelector(":scope >div")?.scrollTo({
            top: 999999999,
            behavior: "auto",
        });
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) {
                toast.error("File too large to upload. Limit is 100MB");
                return;
            }
            setSelectedFile(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };
    if (!chatOpened)
        return (
            <div className="flex-1 grid place-items-center select-none border rounded-r-lg border-l-0 max-h-screen">
                <p className="text-accent-foreground">
                    Select a chat/group to start chatting
                </p>
            </div>
        );
    return (
        <div className="flex-1 flex flex-col border rounded-r-lg border-l-0 max-h-screen">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center select-none">
                    <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage
                            src={chatOpened.displayPicture}
                            alt={chatOpened.displayName}
                        />
                        <AvatarFallback>
                            {chatOpened.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-bold">{chatOpened.displayName}</h2>
                        <p className="text-xs text-muted-foreground">
                            {typingUsers.length > 0
                                ? `${new Intl.ListFormat("en").format(
                                      typingUsers.map(
                                          (id) =>
                                              membersMap.get(id)?.username || ""
                                      )
                                  )} is typing...`
                                : chatOpened.type === "chat"
                                ? onlineContacts.includes(
                                      chatOpened.members.find(
                                          (m) => m.user._id !== userDetails._id
                                      )!.user._id
                                  )
                                    ? "Online"
                                    : "Offline"
                                : `${new Intl.ListFormat("en").format(
                                      Array.from(membersMap.values())
                                          .map((e) => e.username)
                                          .sort((a, b) => a.localeCompare(b))
                                  )}`}
                        </p>
                    </div>
                </div>
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                                <span className="sr-only">More Options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {chatOpened.type === "chat" && (
                                <>
                                    <DropdownMenuItem
                                        {...clearChatDialog.triggerProps}
                                    >
                                        Clear Chat
                                    </DropdownMenuItem>

                                    {chatOpened.displayName.includes(
                                        "(Unknown)"
                                    ) && (
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                updateContact(
                                                    chatOpened.members.find(
                                                        (m) =>
                                                            m.user._id !==
                                                            userDetails._id
                                                    )!.user._id,
                                                    "add"
                                                );
                                            }}
                                        >
                                            Add Contact
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {chatOpened.type === "group" && (
                                <>
                                    <DropdownMenuItem
                                        {...leaveGroupDialog.triggerProps}
                                    >
                                        Leave Group
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        {...groupDetailsDialog.triggerProps}
                                    >
                                        Group Details
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog {...clearChatDialog.dialogProps}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Clear Chat</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to clear all messages?
                                    This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (!socket || !chatOpened) return;
                                            socket.emit(
                                                SOCKET_EVENTS.CLEAR_CHAT,
                                                { chatId: chatOpened._id }
                                            );
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog {...leaveGroupDialog.dialogProps}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Leave Group</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to leave this group?
                                    Only admins can re-add you.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            removeMember({
                                                groupId: chatOpened._id,
                                                userId: userDetails._id,
                                            });
                                        }}
                                    >
                                        Leave
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog {...groupDetailsDialog.dialogProps}>
                        <GroupDetailsDialog
                            trigger={leaveGroupDialog.trigger}
                        />
                    </Dialog>
                </div>
            </div>
            <TooltipProvider
                delayDuration={100}
                disableHoverableContent
                skipDelayDuration={0}
            >
                <ScrollArea
                    className="overflow-y-auto p-4 h-full"
                    ref={scrollAreaRef}
                >
                    {messages.map((message, i, arr) => (
                        <MessageItem
                            key={message._id + i}
                            i={i}
                            isFirstMessage={
                                i === 0 ||
                                !!message.repliedTo ||
                                (i > 0 &&
                                    arr[i - 1].senderId !== message.senderId)
                            }
                            message={message}
                            editingMessage={
                                editingMessage?._id === message._id
                                    ? editingMessage.text
                                    : ""
                            }
                            chatOpened={chatOpened}
                            deleteMessage={deleteMessage}
                            editMessage={editMessage}
                            sender={
                                membersMap.get(message.senderId) || {
                                    username: `Unknown (${message.senderId})`,
                                    avatarUrl: "",
                                    role: "member",
                                }
                            }
                            isCurrentUser={userDetails._id === message.senderId}
                            isCurrentUserAdmin={
                                membersMap.get(userDetails._id)?.role ===
                                "admin"
                            }
                            setEditingMessage={() => {
                                console.log("Setting editing message");
                                setEditingMessage(message);
                            }}
                            clearEditingMessageStatus={() =>
                                setEditingMessage(null)
                            }
                            selectedForReply={
                                selectedForReply?._id === message._id
                            }
                            setSelectedForReply={() =>
                                setSelectedForReply(message)
                            }
                        />
                    ))}
                </ScrollArea>
            </TooltipProvider>
            {selectedForReply && (
                <div className="-top-full left-0 w-full p-2 rounded-t-md  border-t text-xs select-none">
                    <div className="flex items-center justify-between">
                        <span
                            className="hover:underline"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                const element = document.querySelector(
                                    `[data-message-id="${selectedForReply._id}"]`
                                );
                                if (element) {
                                    element.scrollIntoView({
                                        behavior: "smooth",
                                    });
                                    element.classList.add("animate-flash");
                                    element.addEventListener(
                                        "animationend",
                                        () => {
                                            element.classList.remove(
                                                "animate-flash"
                                            );
                                        },
                                        { once: true }
                                    );
                                }
                            }}
                        >
                            Replying to{" "}
                            {selectedForReply.senderId === userDetails._id
                                ? userDetails.username
                                : chatOpened.displayName}
                        </span>
                        <Button
                            variant="ghost"
                            className="w-6 h-6 rounded-full p-1"
                            onClick={() => setSelectedForReply(null)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel Reply</span>
                        </Button>
                    </div>
                </div>
            )}
            {selectedFile && (
                <div className="p-2 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {selectedFile.name} (
                            {formatFileSize(selectedFile.size)})
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveFile}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove File</span>
                        </Button>
                    </div>
                </div>
            )}
            <div className="p-4 border-t relative">
                <div className="flex items-stretch gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={triggerFileInput}
                    >
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Attach File</span>
                    </Button>
                    <input
                        hidden
                        type="file"
                        accept="*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Textarea
                        placeholder="Type a message..."
                        ref={msgInputRef}
                        value={newMessage}
                        rows={1}
                        className="resize-none min-h-fit max-h-32 row-auto"
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }
                            if (e.key === "Escape") {
                                setSelectedForReply(null);
                            }
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                            if (e.clipboardData.types.includes("Files")) {
                                try {
                                    const file = e.clipboardData.files[0];
                                    if (file.size > 100 * 1024 * 1024) {
                                        toast.error(
                                            "File too large to upload. Limit is 100MB"
                                        );
                                        return;
                                    }
                                    setSelectedFile(file);
                                } catch (error) {
                                    console.error(error);
                                    toast.error(
                                        "Failed to upload file from clipboard"
                                    );
                                }
                                return;
                            }
                            if (e.clipboardData.types.includes("text/html")) {
                                const text =
                                    e.clipboardData.getData("text/html");
                                const md = convertHtmlToMarkdown(text);
                                setNewMessage((prev) => prev + md);
                                return;
                            }
                            if (e.clipboardData.types.includes("text/plain")) {
                                const text =
                                    e.clipboardData.getData("text/plain");
                                setNewMessage((prev) => prev + text);
                                return;
                            }
                        }}
                    />

                    <EmojiPicker
                        onEmojiSelect={(e) => {
                            const input = msgInputRef.current;
                            if (!input) return;
                            const startPos = input.selectionStart;
                            const endPos = input.selectionEnd;
                            const text = input.value;
                            const before = text.substring(0, startPos);
                            const after = text.substring(endPos, text.length);
                            input.value = before + e + after;
                            input.selectionStart = startPos + e.length;
                            input.selectionEnd = startPos + e.length;
                            setNewMessage(input.value);
                        }}
                    />
                    {/* <Button onClick={handleSendMessage} className="">
                        <Send className="h-5 w-5" />
                        <span className="sr-only">Send Message</span>
                    </Button> */}
                </div>
            </div>
        </div>
    );
}
