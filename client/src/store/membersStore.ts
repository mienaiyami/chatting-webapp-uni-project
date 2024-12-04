import { create } from "zustand";

type MemberStore = {
    membersMap: Map<string, SimpleChatMember>;
    updateMembers: (
        members: ChatMember[],
        currentUserId: string,
        contacts?: Contact[]
    ) => void;
};

const useMemberStore = create<MemberStore>((set) => ({
    membersMap: new Map(),
    updateMembers: (members, currentUserId, contacts) =>
        set((state) => {
            const newMap = new Map(state.membersMap);
            members.forEach((member) => {
                const contact = contacts?.find(
                    (c) => c.userId === member.user._id
                );
                newMap.set(member.user._id, {
                    username:
                        member.user._id === currentUserId
                            ? "You"
                            : contact?.nickname ||
                              contact?.username ||
                              member.user.username + " (Unknown)",
                    avatarUrl: member.user.avatarUrl,
                    joinedAt: member.joinedAt,
                    role: member.role,
                });
            });
            return { membersMap: newMap };
        }),
}));
export default useMemberStore;
