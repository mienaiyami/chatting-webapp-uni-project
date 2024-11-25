// import useChatsGroups from "./useChatsGroups";
// import useUserContacts from "./useUserContacts";
// import useCombinedChatListStore from "@/store/combinedChatList";
// import { useSocket } from "@/socket/SocketProvider";
// import { SOCKET_EVENTS } from "@/socket/events";
// import { useEffect } from "react";
// import useUserDetailStore from "@/store/userDetails";

// const useCombinedChatList = () => {
//     const { chats, groups } = useChatsGroups();
//     const { contacts } = useUserContacts();
//     const { socket } = useSocket();
//     const { userDetails } = useUserDetailStore();
//     const { setChatList, chatList, updateLastMessage } =
//         useCombinedChatListStore();

//     useEffect(() => {
//         const combinedList: CombinedChatListType[] = [];

//         chats.forEach((chat) => {
//             const contact = contacts.find((contact) =>
//                 chat.members.includes(contact.userId)
//             );
//             if (contact) {
//                 combinedList.push({
//                     _id: chat._id,
//                     type: "chat",
//                     displayName: contact.nickname || contact.username,
//                     displayPicture: contact.avatarUrl,
//                     lastMessage:
//                         (chat.messages[0]?.senderId === userDetails?._id
//                             ? "You: "
//                             : "") + chat.messages[0]?.text || "Start Chatting",
//                     lastMessageAt: chat.messages[0]?.createdAt || null,
//                 });
//             }
//         });

//         groups.forEach((group) => {
//             combinedList.push({
//                 _id: group._id,
//                 type: "group",
//                 displayName: group.name,
//                 displayPicture: group.displayPicture,
//                 lastMessage:
//                     (group.messages[0]?.senderId === userDetails?._id
//                         ? "You: "
//                         : "") + group.messages[0]?.text || "Start Chatting",
//                 lastMessageAt: group.messages[0]?.createdAt || null,
//             });
//         });

//         contacts.forEach((contact) => {
//             const chat = chats.find((chat) =>
//                 chat.members.includes(contact.userId)
//             );
//             if (!chat) {
//                 combinedList.push({
//                     userId: contact.userId,
//                     type: "contact",
//                     displayName: contact.nickname || contact.username,
//                     displayPicture: contact.avatarUrl,
//                     lastMessage: "Start Chatting",
//                     lastMessageAt: null,
//                 });
//             }
//         });

//         combinedList.sort((a, b) => {
//             if (a.lastMessageAt && b.lastMessageAt) {
//                 return a.lastMessageAt > b.lastMessageAt ? -1 : 1;
//             }
//             if (a.lastMessageAt && !b.lastMessageAt) return -1;
//             if (!a.lastMessageAt && b.lastMessageAt) return 1;
//             return 0;
//         });

//         setChatList(combinedList);
//     }, [chats, groups, contacts, setChatList, userDetails]);

//     useEffect(() => {
//         if (!socket) return;
//         const listener = (message: Message) => {
//             console.log("New message received", message);
//             updateLastMessage(
//                 message.chatId,
//                 (message.senderId === userDetails?._id ? "You: " : "") +
//                     message.text,
//                 message.createdAt
//             );
//         };
//         socket.on(SOCKET_EVENTS.NEW_MESSAGE, listener);

//         return () => {
//             socket.off(SOCKET_EVENTS.NEW_MESSAGE, listener);
//         };
//     }, [socket, updateLastMessage]);

//     return {
//         combinedChatList: chatList,
//     };
// };

// export default useCombinedChatList;
