import { useQuery } from "@tanstack/react-query";
import { fetchAllRelationships } from "../api/playerRelationshipsApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetches the current user's preferred/avoid settlement partner pairs.
 * Shared by every place that computes settlements (game preview, End Game,
 * post-completion edits) so preferences apply consistently everywhere.
 */
export const useSettlementPreferences = () => {
    const { user } = useAuth();

    const { data } = useQuery({
        queryKey: ['settlementPreferences', user?.id],
        queryFn: () => fetchAllRelationships(user!.id),
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });

    return {
        preferredPairs: data?.preferredPairs ?? new Set<string>(),
        avoidPairs: data?.avoidPairs ?? new Set<string>(),
    };
};
