import useMemberStore from "@/store/membersStore";
import useUserDetailStore from "@/store/userDetails";
import { useCallback } from "react";

export const useMemberDetails = () => {
    const membersMap = useMemberStore((state) => state.membersMap);
    const userDetails = useUserDetailStore((state) => state.userDetails);

    const getMemberDetails = useCallback(
        (memberId: string): SimpleChatMember & { _id: string } => {
            // console.log(membersMap);
            const details = {
                username: "Unknown User",
                _id: memberId,
                // isCurrentUser: false,
            };
            const member = membersMap.get(memberId);
            if (member) {
                return {
                    username: member.username,
                    avatarUrl: member.avatarUrl,
                    _id: memberId,
                    joinedAt: member.joinedAt,
                    role: member.role,
                };
            }
            return details;
        },
        [membersMap, userDetails]
    );

    return getMemberDetails;
};
