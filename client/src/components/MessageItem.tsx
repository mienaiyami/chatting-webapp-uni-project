import React, { memo, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Reply, Edit2, Trash2, MoreHorizontal, Paperclip } from "lucide-react";
import { formatDate, formatDate2 } from "../utils";
import ReplyPreview from "./ReplyPreview";
import { useMemberDetails } from "../hooks/useMemberDetails";
import useUserDetailStore from "@/store/userDetails";
import useChatOpenedStore from "@/store/chatOpened";
import useMessages from "@/hooks/useMessage";
import ReactMarkdown, {
    Components as ReactMarkdownComponents,
} from "react-markdown";

const renderers: ReactMarkdownComponents = {
    p: ({ children }) => <p className="text-accent-foreground">{children}</p>,
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    s: ({ children }) => <s className="line-through">{children}</s>,

    code: ({ children }) => (
        <code className="bg-accent text-accent-foreground p-1 rounded">
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="bg-accent text-accent-foreground p-1 rounded whitespace-pre overflow-x-auto">
            {children}
        </pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-gray-500 pl-4 italic">
            {children}
        </blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" className="text-blue-500 underline">
            {children}
        </a>
    ),
    ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
    ol: ({ children }) => (
        <ol className="list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,
    h1: ({ children }) => (
        <h1 className="text-2xl font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg font-bold mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
        <h4 className="text-base font-bold mb-2">{children}</h4>
    ),
    h5: ({ children }) => (
        <h5 className="text-sm font-bold mb-2">{children}</h5>
    ),
    h6: ({ children }) => (
        <h6 className="text-xs font-bold mb-2">{children}</h6>
    ),
};

function formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

interface MessageItemProps {
    message: OptimisticMessage;
    i: number;
    isFirstMessage: boolean;
    /**empty if not editing */
    editingMessage?: string;
    selectedForReply: boolean;
    sender: SimpleChatMember;
    userDetails: UserDetails;
    chatOpened: ChatGroupDetails;
    deleteMessage: (chatId: string, messageId: string) => void;
    editMessage: (chatId: string, messageId: string, text: string) => void;
    setSelectedForReply: () => void;
    setEditingMessage: () => void;
    clearEditingMessageStatus: () => void;
}
const MessageItem = memo<MessageItemProps>(
    ({
        message,
        i,
        isFirstMessage,
        editingMessage,
        selectedForReply,
        chatOpened,
        sender,
        userDetails,
        deleteMessage,
        editMessage,
        setSelectedForReply,
        setEditingMessage,
        clearEditingMessageStatus,
    }) => {
        const isFromCurrentUser = message.senderId === userDetails._id;
        const isCurrentUserAdmin = false;
        // const isFirstMessage =
        //     index === 0 ||
        //     message.repliedTo ||
        //     (index > 0 && messagesArray[index - 1].senderId !== message.senderId);
        return (
            <div
                data-message-id={message._id}
                className={`group/message hover:bg-accent/10 rounded-md relative flex flex-col items-start ${
                    selectedForReply ? "bg-accent/20" : ""
                } ${message.optimistic ? "opacity-50" : ""}`}
            >
                {!editingMessage && (
                    <div className="group-hover/message:flex bg-accent/50 rounded-sm absolute right-0 top-0 hidden flex-row gap-0 items-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-8 h-8 p-2 rounded-none rounded-l-sm"
                                    onClick={() => {
                                        setSelectedForReply();
                                    }}
                                >
                                    <Reply className="aspect-square h-4" />
                                    <span className="sr-only">Reply</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs px-2 py-1">
                                Reply
                            </TooltipContent>
                        </Tooltip>
                        {isFromCurrentUser && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-8 h-8 p-2 rounded-none"
                                        onClick={() => {
                                            setEditingMessage();
                                            // setEditText(
                                            //     message.text
                                            // );
                                        }}
                                    >
                                        <Edit2 className="aspect-square h-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs px-2 py-1">
                                    Edit
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {(isFromCurrentUser ||
                            (chatOpened.type === "group" &&
                                isCurrentUserAdmin)) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-8 h-8 p-2 rounded-none"
                                        onClick={() => {
                                            deleteMessage(
                                                chatOpened._id,
                                                message._id
                                            );
                                        }}
                                    >
                                        <Trash2 className="aspect-square h-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs px-2 py-1">
                                    Delete
                                </TooltipContent>
                            </Tooltip>
                        )}
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
                )}
                {isFirstMessage && (
                    <div className="w-full flex flex-col gap-0.5 items-start justify-between mb-1 mt-2 cursor-default">
                        {message.repliedTo && (
                            <ReplyPreview
                                message={message}
                                key={message.repliedTo._id}
                            />
                        )}
                        <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage
                                    src={sender.avatarUrl}
                                    alt={sender.username}
                                />
                                <AvatarFallback>
                                    {sender.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-row gap-2 items-center">
                                <h3 className="text-sm">{sender.username}</h3>
                                <Tooltip delayDuration={1000}>
                                    <TooltipTrigger asChild>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(message.createdAt)}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                        {formatDate2(message.createdAt)}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-row items-start gap-1.5 w-full">
                    <Tooltip delayDuration={1000}>
                        <TooltipTrigger asChild>
                            <div className="w-8 pt-2 pl-1 group-hover/message:opacity-100 opacity-0 select-none text-xs text-accent-foreground/30">
                                {new Date(message.createdAt).toLocaleTimeString(
                                    "en-GB",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    }
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs px-2 py-1">
                            {formatDate2(message.createdAt)}
                        </TooltipContent>
                    </Tooltip>

                    <div
                        className={`p-2 bg-accent/50 text-accent-foreground rounded-lg max-w-[80%] break-words whitespace-pre-line ${
                            isFirstMessage ? "mb-1" : "my-1"
                        }`}
                    >
                        {editingMessage ? (
                            <div className="flex flex-col gap-1 w-full">
                                <div
                                    role="textbox"
                                    aria-label="Edit message"
                                    aria-multiline="true"
                                    contentEditable
                                    ref={(element) => {
                                        if (element) {
                                            //todo fix caret position
                                            element.textContent =
                                                editingMessage;
                                            element.focus();
                                            const range =
                                                document.createRange();
                                            const selection =
                                                window.getSelection();
                                            range.selectNodeContents(element);
                                            range.collapse(false);
                                            selection?.removeAllRanges();
                                            selection?.addRange(range);
                                            // element.textContent =
                                            //     editText;
                                            // element.focus();
                                            // const range =
                                            //     document.createRange();
                                            // const selection =
                                            //     window.getSelection();
                                            // range.selectNodeContents(
                                            //     element
                                            // );
                                            // range.collapse(false);
                                            // selection?.removeAllRanges();
                                            // selection?.addRange(
                                            //     range
                                            // );
                                        }
                                    }}
                                    // onInput={(e) =>
                                    //     setEditText(
                                    //         e.currentTarget
                                    //             .textContent || ""
                                    //     )
                                    // }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            const text =
                                                e.currentTarget.textContent;

                                            if (text?.trim()) {
                                                editMessage(
                                                    chatOpened._id,
                                                    message._id,
                                                    text.trim()
                                                );
                                                clearEditingMessageStatus();
                                                // setEditText("");
                                            }
                                        }
                                        if (e.key === "Escape") {
                                            clearEditingMessageStatus();
                                            // setEditText("");
                                        }
                                    }}
                                    className="w-full min-h-[1.5em] p-1 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 rounded-sm"
                                />
                                <div className="flex justify-end gap-2 text-xs text-muted-foreground">
                                    <span>
                                        Press Enter to save, Esc to cancel
                                    </span>
                                    <span>Shift + Enter for new line</span>
                                </div>
                            </div>
                        ) : (
                            <ReactMarkdown components={renderers}>
                                {message.text}
                            </ReactMarkdown>
                        )}
                        {message.attachment && (
                            <div className="mt-2">
                                <a
                                    href={message.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {message.attachment.fType === "image" ? (
                                        <img
                                            src={message.attachment.url}
                                            alt={message.attachment.name}
                                            className="max-w-sm rounded-md"
                                        />
                                    ) : message.attachment.fType === "video" ? (
                                        <video
                                            src={message.attachment.url}
                                            controls
                                            className="max-w-sm rounded-md"
                                        />
                                    ) : message.attachment.fType === "audio" ? (
                                        <audio
                                            src={message.attachment.url}
                                            controls
                                            className="w-full"
                                        />
                                    ) : (
                                        <a
                                            href={message.attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-500 hover:underline"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                            <span>
                                                {message.attachment.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                (
                                                {formatFileSize(
                                                    message.attachment.size
                                                )}
                                                )
                                            </span>
                                        </a>
                                    )}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        const conditions: boolean[] = [
            prevProps.message._id === nextProps.message._id,
            prevProps.isFirstMessage === nextProps.isFirstMessage,
            prevProps.editingMessage === nextProps.editingMessage,
            // todo move these to usecallback for performance
            prevProps.selectedForReply === nextProps.selectedForReply,
        ];
        return conditions.every((e) => !e);
    }
);

export default MessageItem;
