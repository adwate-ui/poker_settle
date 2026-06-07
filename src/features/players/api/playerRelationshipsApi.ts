import { supabase } from "@/integrations/supabase/client";

export type RelationshipType = 'preferred' | 'avoid';

export interface PlayerRelationship {
    id: string;
    player_id: string;
    related_player_id: string;
    relationship_type: RelationshipType;
    related_player_name?: string;
}

export const fetchRelationships = async (
    userId: string,
    playerId: string
): Promise<PlayerRelationship[]> => {
    const { data, error } = await supabase
        .from("player_relationships")
        .select(`
            id,
            player_id,
            related_player_id,
            relationship_type,
            related:players!player_relationships_related_player_id_fkey (name)
        `)
        .eq("user_id", userId)
        .eq("player_id", playerId);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
        id: row.id,
        player_id: row.player_id,
        related_player_id: row.related_player_id,
        relationship_type: row.relationship_type as RelationshipType,
        related_player_name: row.related?.name ?? ''
    }));
};

export const addRelationship = async (
    userId: string,
    playerId: string,
    relatedPlayerId: string,
    type: RelationshipType
): Promise<void> => {
    // Insert both directions for reciprocity (ignore conflicts if they already exist)
    const { error } = await supabase
        .from("player_relationships")
        .upsert([
            { user_id: userId, player_id: playerId, related_player_id: relatedPlayerId, relationship_type: type },
            { user_id: userId, player_id: relatedPlayerId, related_player_id: playerId, relationship_type: type }
        ], { onConflict: 'user_id,player_id,related_player_id,relationship_type' });

    if (error) throw error;
};

export const removeRelationship = async (
    userId: string,
    playerId: string,
    relatedPlayerId: string,
    type: RelationshipType
): Promise<void> => {
    // Remove both directions
    const { error } = await supabase
        .from("player_relationships")
        .delete()
        .eq("user_id", userId)
        .in("player_id", [playerId, relatedPlayerId])
        .in("related_player_id", [playerId, relatedPlayerId])
        .eq("relationship_type", type);

    if (error) throw error;
};

export const fetchAllRelationships = async (userId: string): Promise<{
    preferredPairs: Set<string>;
    avoidPairs: Set<string>;
    playerIdToName: Map<string, string>;
}> => {
    const { data, error } = await supabase
        .from("player_relationships")
        .select(`
            player_id,
            related_player_id,
            relationship_type,
            player:players!player_relationships_player_id_fkey (name),
            related:players!player_relationships_related_player_id_fkey (name)
        `)
        .eq("user_id", userId);

    if (error) throw error;

    const preferredPairs = new Set<string>();
    const avoidPairs = new Set<string>();
    const playerIdToName = new Map<string, string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data || []) as any[]) {
        const nameA = row.player?.name;
        const nameB = row.related?.name;
        if (!nameA || !nameB) continue;

        if (row.player_id) playerIdToName.set(row.player_id, nameA);
        if (row.related_player_id) playerIdToName.set(row.related_player_id, nameB);

        const pairKey = [nameA, nameB].sort().join('|');
        if (row.relationship_type === 'preferred') {
            preferredPairs.add(pairKey);
        } else if (row.relationship_type === 'avoid') {
            avoidPairs.add(pairKey);
        }
    }

    return { preferredPairs, avoidPairs, playerIdToName };
};
