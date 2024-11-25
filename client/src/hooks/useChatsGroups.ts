// import { useEffect, useState } from "react";

// const useChatsGroups = () => {
//     const [chats, setChats] = useState<Chat[]>([]);
//     const [groups, setGroups] = useState<Group[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<Error | string | null>(null);
//     //todo test

//     const fetchChatsAndGroups = async () => {
//         try {
//             setLoading(true);
//             const response = await fetch("/api/chat-groups", {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     // Authorization: `Bearer ${token}`,
//                 },
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || "Failed to fetch data");
//             }

//             const data = await response.json();
//             setChats(data.chats);
//             setGroups(data.groups);
//         } catch (err: any) {
//             setError(err.message || "Failed to fetch data");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const createChat = async (userId2: string): Promise<Chat | null> => {
//         try {
//             const response = await fetch("/api/chat-groups/create-chat", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     // "Authorization": `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ userId2 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || "Failed to create chat");
//             }
//             const data = await response.json();
//             setChats((prevChats) => [...prevChats, data.chat]);
//             return data.chat;
//         } catch (err: any) {
//             setError(err.message || "Failed to create chat");
//             return null;
//         }
//     };

//     useEffect(() => {
//         fetchChatsAndGroups();
//     }, []);

//     return {
//         chats,
//         groups,
//         loading,
//         error,
//         createChat,
//         refetch: fetchChatsAndGroups,
//     };
// };

// export default useChatsGroups;
