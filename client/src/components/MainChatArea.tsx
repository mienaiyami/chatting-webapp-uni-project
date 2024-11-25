import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Phone,
    Video,
    MoreHorizontal,
    Paperclip,
    Smile,
    Send,
    Reply,
    Edit2,
    X,
} from "lucide-react";
import useUserDetailStore from "@/store/userDetails";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown, {
    Components as ReactMarkdownComponents,
} from "react-markdown";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { useSocket } from "@/socket/SocketProvider";
import { SOCKET_EVENTS } from "@/socket/events";
import useChatOpenedStore from "@/store/chatOpened";
import useMessages from "@/hooks/useMessage";
import { convertHtmlToMarkdown, formatDate, formatDate2 } from "@/utils";
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

const renderers: ReactMarkdownComponents = {
    p: ({ children }) => <p className="text-accent-foreground">{children}</p>,
    strong: ({ children }) => (
        <strong className="text-accent-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="text-accent-foreground italic">{children}</em>
    ),
    s: ({ children }) => <s className="text-accent-foreground">{children}</s>,
    code: ({ children }) => (
        <code className="bg-accent text-accent-foreground p-1 rounded">
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="bg-accent text-accent-foreground p-1 rounded whitespace-pre">
            {children}
        </pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-accent-foreground pl-4 text-accent-foreground">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            className="text-accent-foreground underline"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="text-accent-foreground list-disc list-inside">
            {children}
        </ul>
    ),
    // todo fix marker margin
    li: ({ children }) => (
        <li className="text-accent-foreground pl-1">{children}</li>
    ),
    h1: ({ children }) => (
        <h1 className="text-2xl text-accent-foreground mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl text-accent-foreground mb-1">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg text-accent-foreground">{children}</h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-base text-accent-foreground">{children}</h4>
    ),
    h5: ({ children }) => (
        <h4 className="text-sm text-accent-foreground">{children}</h4>
    ),
    h6: ({ children }) => (
        <h4 className="text-xs text-accent-foreground">{children}</h4>
    ),
};

export function MainChatArea() {
    const { messages, sendMessage, initializeMessages, resetMessages } =
        useMessages();
    const { chatOpened } = useChatOpenedStore();
    const { updateContact } = useUserContacts();
    const userDetails = useUserDetailStore((state) => state.userDetails)!;
    const { socket } = useSocket();
    const [newMessage, setNewMessage] = useState("");
    const [selectedForReply, setSelectedForReply] = useState<Message | null>(
        null
    );
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const msgInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (msgInputRef.current) {
            msgInputRef.current.style.height = "auto";
            msgInputRef.current.style.height = `${msgInputRef.current.scrollHeight}px`;
        }
    }, [newMessage]);

    const handleSendMessage = () => {
        if (chatOpened && newMessage.trim()) {
            sendMessage({
                chatId: chatOpened._id,
                senderId: userDetails._id,
                text: newMessage.trim(),
                repliedTo: selectedForReply,
            });
            setNewMessage("");
            setSelectedForReply(null);
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

    useEffect(() => {
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
            behavior: "smooth",
        });
    }, [messages]);

    if (!chatOpened)
        return (
            <div className="flex-1 grid place-items-center w-full select-none border rounded-r-lg border-l-0 max-h-screen">
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
                        <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                </div>
                <div>
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        disabled
                    >
                        <Phone className="h-5 w-5" />
                        <span className="sr-only">Call</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        disabled
                    >
                        <Video className="h-5 w-5" />
                        <span className="sr-only">Video Call</span>
                    </Button> */}

                    <Dialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-5 w-5" />
                                    <span className="sr-only">
                                        More Options
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DialogTrigger asChild>
                                    <DropdownMenuItem>
                                        Clear Chat
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem
                                    onClick={() => {
                                        updateContact(
                                            chatOpened.members.find(
                                                (m) => m._id !== userDetails._id
                                            )!._id,
                                            "add"
                                        );
                                    }}
                                >
                                    Add Contact
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                        <div
                            key={message._id + i}
                            data-message-id={message._id}
                            className={`group/message hover:bg-accent/10 rounded-md relative flex flex-col items-start ${
                                selectedForReply?._id === message._id
                                    ? "bg-accent/20"
                                    : ""
                            } ${message.optimistic ? "opacity-50" : ""}`}
                        >
                            <div className="group-hover/message:flex bg-accent/50 rounded-sm absolute right-0 top-0 hidden flex-row gap-0 items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-8 h-8 p-2 rounded-none rounded-l-sm"
                                            onClick={() => {
                                                setSelectedForReply(message);
                                            }}
                                        >
                                            <Reply className="aspect-square h-4" />
                                            <span className="sr-only">
                                                Reply
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                        Reply
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-8 h-8 p-2 rounded-none"
                                        >
                                            <Edit2 className="aspect-square h-4" />
                                            <span className="sr-only">
                                                Edit
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                        Edit
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-8 h-8 p-2 rounded-none rounded-r-sm"
                                        >
                                            <MoreHorizontal className="aspect-square h-4" />
                                            <span className="sr-only">
                                                More Options
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                        More Options
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            {(i === 0 ||
                                message.repliedTo ||
                                (i > 0 &&
                                    arr[i - 1].senderId !==
                                        message.senderId)) && (
                                <div className="w-full flex flex-col gap-0.5 items-start justify-between mb-1 mt-2 cursor-default">
                                    {message.repliedTo &&
                                        message.repliedTo._id && (
                                            <div
                                                className="flex items-center gap-1 hover:underline"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    const element =
                                                        document.querySelector(
                                                            `[data-message-id="${message.repliedTo?._id}"]`
                                                        );
                                                    if (element) {
                                                        element.scrollIntoView({
                                                            behavior: "smooth",
                                                        });
                                                        element.classList.add(
                                                            "animate-flash"
                                                        );
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
                                                <span className="text-xs">
                                                    Replying to
                                                </span>
                                                <Avatar className="h-4 w-4">
                                                    <AvatarImage
                                                        src={
                                                            message.repliedTo
                                                                .senderId ===
                                                            userDetails._id
                                                                ? userDetails.avatarUrl
                                                                : chatOpened.displayPicture
                                                        }
                                                        alt={
                                                            message.repliedTo
                                                                .senderId ===
                                                            userDetails._id
                                                                ? userDetails.avatarUrl
                                                                : chatOpened.displayPicture
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {(message.repliedTo
                                                            .senderId ===
                                                        userDetails._id
                                                            ? userDetails.avatarUrl
                                                            : chatOpened.displayPicture
                                                        )
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <h3 className="text-sm">
                                                        {message.repliedTo
                                                            .senderId ===
                                                        userDetails._id
                                                            ? userDetails.username
                                                            : chatOpened.displayName}
                                                    </h3>
                                                    <div className={`text-xs`}>
                                                        {message.repliedTo.text
                                                            .replace("\n", " ")
                                                            .slice(0, 20) +
                                                            (message.repliedTo
                                                                .text.length >
                                                            20
                                                                ? "..."
                                                                : "")}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarImage
                                                src={
                                                    message.senderId ===
                                                    userDetails._id
                                                        ? userDetails.avatarUrl
                                                        : chatOpened.displayPicture
                                                }
                                                alt={
                                                    message.senderId ===
                                                    userDetails._id
                                                        ? userDetails.avatarUrl
                                                        : chatOpened.displayPicture
                                                }
                                            />
                                            <AvatarFallback>
                                                {(message.senderId ===
                                                userDetails._id
                                                    ? userDetails.avatarUrl
                                                    : chatOpened.displayPicture
                                                )
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-row gap-2 items-center">
                                            <h3 className="text-sm">
                                                {message.senderId ===
                                                userDetails._id
                                                    ? userDetails.username
                                                    : chatOpened.displayName}
                                            </h3>
                                            <Tooltip delayDuration={1000}>
                                                <TooltipTrigger asChild>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            message.createdAt
                                                        )}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs px-2 py-1">
                                                    {formatDate2(
                                                        message.createdAt
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-row items-start gap-1">
                                <Tooltip delayDuration={1000}>
                                    <TooltipTrigger asChild>
                                        <div className="w-8 pt-2 pl-1 group-hover/message:opacity-100 opacity-0 select-none text-xs text-accent-foreground/30">
                                            {new Date(
                                                message.createdAt
                                            ).toLocaleTimeString("en-GB", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false,
                                            })}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                        {formatDate2(message.createdAt)}
                                    </TooltipContent>
                                </Tooltip>

                                <div
                                    className={`p-2 bg-accent/50 text-accent-foreground rounded-lg max-w-[80%] break-words whitespace-pre-wrap ${
                                        i === 0 ||
                                        message.repliedTo ||
                                        (i > 0 &&
                                            arr[i - 1].senderId !==
                                                message.senderId)
                                            ? "mb-1"
                                            : "my-1"
                                    }`}
                                >
                                    <ReactMarkdown components={renderers}>
                                        {message.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
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
            <div className="p-4 border-t relative">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2"
                        disabled
                    >
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Attach File</span>
                    </Button>
                    <Textarea
                        placeholder="Type a message..."
                        ref={msgInputRef}
                        value={newMessage}
                        rows={1}
                        className="resize-none min-h-fit max-h-32 row-auto"
                        onChange={(e) => setNewMessage(e.target.value)}
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
                                toast.error("File upload not supported yet.");
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
                    <Button onClick={handleSendMessage} className="ml-2">
                        <Send className="h-5 w-5" />
                        <span className="sr-only">Send Message</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
