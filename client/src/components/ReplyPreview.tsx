import React, { useCallback } from "react";
import { useMemberDetails } from "../hooks/useMemberDetails";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ReplyPreviewProps {
    message: Message;
    // sender: SimpleChatMember;
    // onClick: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message }) => {
    if (!message.repliedTo) {
        throw new Error("Message does not have a repliedTo field");
    }
    //todo: optimize
    const getMemberDetails = useMemberDetails();
    const sender = getMemberDetails(message.repliedTo.senderId);

    return (
        <div
            className="flex items-center gap-1 hover:underline select-none"
            role="button"
            tabIndex={-1}
            onClick={() => {
                const element = document.querySelector(
                    `[data-message-id="${message.repliedTo?._id}"]`
                );
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                    });
                    element.classList.add("animate-flash");
                    element.addEventListener(
                        "animationend",
                        () => {
                            element.classList.remove("animate-flash");
                        },
                        { once: true }
                    );
                }
            }}
        >
            <span className="text-xs">Replying to</span>
            <Avatar className="h-4 w-4">
                <AvatarImage src={sender.avatarUrl} alt={sender.username} />
                <AvatarFallback>
                    {sender.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-row gap-2 items-center">
                <h3 className="text-sm">{sender.username}</h3>
                <div className={`text-xs`}>
                    {message.repliedTo.text.replace("\n", " ").slice(0, 20) +
                        (message.repliedTo.text.length > 20 ? "..." : "")}
                </div>
            </div>
        </div>
    );
};
export default ReplyPreview;
