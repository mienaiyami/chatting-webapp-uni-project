import { MainChatArea } from "@/components/MainChatArea";
import { Sidebar } from "@/components/Sidebar";

export default function ChatApp() {
    return (
        <div
            id="chat-app"
            className="flex h-full xl:h-[90vh] w-full xl:w-[90vw]"
        >
            <Sidebar />
            <MainChatArea />
        </div>
    );
}
