import { useState, useEffect, useRef } from "react";
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

const fetchMessages = async () => {
    try {
        const messages: Message[] = [
            {
                _id: "msg1",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Hello! How are you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg1",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Hello! How are you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg1",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Hello! How are you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg2",
                chatId: "chat1",
                senderId: "6734bf1e0671076b1ad95a5f",
                text: "I am good, thanks! How about you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg2",
                chatId: "chat1",
                senderId: "6734bf1e0671076b1ad95a5f",
                text: "I am good, thanks! How about you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg3",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Doing well. Working on a project.",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg4",
                chatId: "chat1",
                senderId: "6734bf1e0671076b1ad95a5f",
                text: "Sounds interesting! Need any help?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg5",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Not at the moment, thanks!",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg1",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Hello! How are you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg2",
                chatId: "chat1",
                senderId: "6734bf1e0671076b1ad95a5f",
                text: "I am good, thanks! How about you?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg3",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Doing well. Working on a project.",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg4",
                chatId: "chat1",
                senderId: "6734bf1e0671076b1ad95a5f",
                text: "Sounds interesting! Need any help?",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
            {
                _id: "msg5",
                chatId: "chat1",
                senderId: "6734bed10671076b1ad95a50",
                text: "Not at the moment, thanks!",
                imageUrl: "",
                videoUrl: "",
                deletedAt: new Date(0),
                createdAt: new Date(),
                modifiedAt: new Date(),
            },
        ];
        return messages;
        const response = await fetch("/api/chatMessages", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error);
        }
        return json.messages as Message[];
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return [];
    }
};

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

export function MainChatArea({ user2 }: { user2: UserDetails }) {
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const userDetails = useUserDetailStore((state) => state.userDetails)!;
    const [selectedForReply, setSelectedForReply] = useState<Message | null>(
        null
    );
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const msgInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const loadMessages = async () => {
            const fetchedMessages = await fetchMessages();
            setMessages(fetchedMessages);
        };
        loadMessages();
    }, []);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            if (selectedForReply) setSelectedForReply(null);
            setMessages((init) => {
                return [
                    ...init,
                    {
                        _id: window.crypto.randomUUID(),
                        chatId: "chat1",
                        senderId: userDetails._id,
                        text: newMessage.trim(),
                        imageUrl: "",
                        videoUrl: "",
                        deletedAt: new Date(0),
                        createdAt: new Date(),
                        modifiedAt: new Date(),
                    },
                ];
            });
            setNewMessage("");
        }
    };
    useEffect(() => {
        scrollAreaRef.current?.querySelector(":scope > div")?.scrollTo({
            top: 99999999,
            behavior: "smooth",
        });
    }, [messages]);
    useEffect(() => {
        if (selectedForReply) {
            msgInputRef.current?.focus();
        }
    }, [selectedForReply]);

    return (
        <div className="flex-1 flex flex-col border rounded-r-lg border-l-0 max-h-screen">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center select-none">
                    <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage
                            src={user2.avatarUrl}
                            alt={user2.username}
                        />
                        <AvatarFallback>
                            {user2.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-bold">
                            {user2.nickname || user2.username}
                        </h2>
                        <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                </div>
                <div>
                    <Button
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
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">More Options</span>
                    </Button>
                </div>
            </div>
            <TooltipProvider
                delayDuration={100}
                disableHoverableContent
                skipDelayDuration={1000}
            >
                <ScrollArea
                    className="overflow-y-auto p-4 h-full"
                    ref={scrollAreaRef}
                >
                    {messages.map((message, i, arr) => (
                        <div
                            key={message._id + i}
                            data-message-id={message._id}
                            className={`group/message rounded-md relative flex flex-col items-start ${
                                selectedForReply?._id === message._id
                                    ? "bg-accent/20"
                                    : ""
                            }`}
                        >
                            <div className="group-hover/message:flex absolute right-0 top-0 hidden flex-row gap-0 items-center">
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
                                (i > 0 &&
                                    arr[i - 1].senderId !==
                                        message.senderId)) && (
                                <div className="w-full flex items-center justify-between mb-1 mt-2 cursor-default">
                                    <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarImage
                                                src={
                                                    message.senderId ===
                                                    userDetails._id
                                                        ? userDetails.avatarUrl
                                                        : user2.avatarUrl
                                                }
                                                alt={
                                                    message.senderId ===
                                                    userDetails._id
                                                        ? userDetails.avatarUrl
                                                        : user2.avatarUrl
                                                }
                                            />
                                            <AvatarFallback>
                                                {(message.senderId ===
                                                userDetails._id
                                                    ? userDetails.avatarUrl
                                                    : user2.avatarUrl
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
                                                    : user2.nickname ||
                                                      user2.username}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(message.createdAt)
                                                    .toLocaleString()
                                                    .replace(",", "")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div
                                className={`p-2 bg-accent/50 text-accent-foreground rounded-lg ${
                                    // i === 0 ||
                                    // (i > 0 &&
                                    //     arr[i - 1].senderId !==
                                    //         message.senderId)
                                    //     ? "mb-1"
                                    //     : ""
                                    "mb-1"
                                }`}
                            >
                                <ReactMarkdown components={renderers}>
                                    {message.text}
                                </ReactMarkdown>
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
                            onClick={() => {
                                document
                                    .querySelector(
                                        `[data-message-id="${selectedForReply._id}"]`
                                    )
                                    ?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Replying to{" "}
                            {selectedForReply.senderId === userDetails._id
                                ? userDetails.username
                                : user2.username}
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
                    <Button variant="ghost" size="icon" className="mr-2">
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Attach File</span>
                    </Button>
                    <Textarea
                        placeholder="Type a message..."
                        ref={msgInputRef}
                        value={newMessage}
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
                        rows={1}
                        className="resize-none min-h-fit"
                    />
                    <Button variant="ghost" size="icon" className="ml-2">
                        <Smile className="h-5 w-5" />
                        <span className="sr-only">Add Emoji</span>
                    </Button>
                    <Button onClick={handleSendMessage} className="ml-2">
                        <Send className="h-5 w-5" />
                        <span className="sr-only">Send Message</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
