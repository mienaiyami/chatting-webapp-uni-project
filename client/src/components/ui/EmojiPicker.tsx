import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@radix-ui/react-popover";
import { useTheme } from "next-themes";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { SmileIcon } from "lucide-react";
import { Button } from "./button";

console.log(data);

export const EmojiPicker = ({
    onEmojiSelect,
}: {
    onEmojiSelect: (emoji: string) => void;
}) => {
    const { theme } = useTheme();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <SmileIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition" />
                    <span className="sr-only">Add Emoji</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full">
                <Picker
                    emojiSize={18}
                    theme={theme || "dark"}
                    autoFocus
                    data={data}
                    maxFrequentRows={1}
                    onEmojiSelect={(emoji: any) => onEmojiSelect(emoji.native)}
                />
            </PopoverContent>
        </Popover>
    );
};
