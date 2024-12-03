import { create } from "zustand";

type MemberStore = {
    membersMap: Map<string, SimpleChatMember>;
    updateMembers: (members: ChatMember[], contacts?: Contact[]) => void;
};

const useMemberStore = create<MemberStore>((set) => ({
    membersMap: new Map(),
    updateMembers: (members, contacts) =>
        set((state) => {
            const newMap = new Map(state.membersMap);
            members.forEach((member) => {
                const contact = contacts?.find(
                    (c) => c.userId === member.user._id
                );
                newMap.set(member.user._id, {
                    username: contact?.nickname || member.user.username,
                    avatarUrl: member.user.avatarUrl,
                    joinedAt: member.joinedAt,
                    role: member.role,
                });
            });
            return { membersMap: newMap };
        }),
}));
export default useMemberStore;
