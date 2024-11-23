import { MainChatArea } from "@/components/MainChatArea";
import { Sidebar } from "@/components/Sidebar";

const tempUser2: UserDetails = {
    username: "beta",
    email: "beta2@mail.com",
    avatarUrl: "/api/images/avatar/34f8d43bfc9307ba6fee4dea294a7a77",
    _id: "6734bf1e0671076b1ad95a5f",
};

export default function ChatApp() {
    return (
        <div
            id="chat-app"
            className="flex h-full xl:h-[90vh] w-full xl:w-[90vw]"
        >
            <Sidebar />
            <MainChatArea user2={tempUser2} />
        </div>
    );
}
