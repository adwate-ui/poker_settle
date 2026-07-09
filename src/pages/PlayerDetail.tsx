import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/notifications";
import {
  ArrowLeft, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Share2,
  ChevronDown, Edit, User, Phone, CreditCard, Layers, ArrowRight,
  Download, FileSpreadsheet, FileText, Heart, X as XIcon, Plus, UserX,
} from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatCurrency } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import { Player } from "@/types/poker";
import { useAuth } from "@/hooks/useAuth";
import { fetchPlayers } from "@/features/players/api/playerApi";
import {
  fetchRelationships,
  addRelationship,
  removeRelationship,
  PlayerRelationship,
  RelationshipType,
} from "@/features/players/api/playerRelationshipsApi";
import { ShareDialog } from "@/components/shared/ShareDialog";
import OptimizedAvatar from "@/components/player/OptimizedAvatar";
import { PlayerFormDialog, PlayerFormData } from "@/components/player/PlayerFormDialog";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import { SupabaseClient } from "@supabase/supabase-js";
import { ResponsiveCurrency } from "@/components/ui-primitives/ResponsiveCurrency";
import { StatTile } from "@/components/ui-primitives/StatTile";

import { usePlayerDashboard } from "@/features/players/hooks/usePlayerDashboard";
import { PlayerDashboardFilters } from "@/components/player/filters/PlayerDashboardFilters";
import { PlayerStatsGrid } from "@/components/player/stats/PlayerStatsGrid";
import { PlayerCharts } from "@/components/player/stats/PlayerCharts";
import { exportPlayerStatsToCSV, printPlayerStatsReport } from "@/lib/exportUtils";

type SortField = "date" | "buy_ins" | "final_stack" | "net_amount";
type SortOrder = "asc" | "desc" | null;

interface PlayerDetailProps {
  playerId?: string;
  userId?: string;
  client?: SupabaseClient;
  readOnly?: boolean;
}

const PlayerDetail = ({ playerId: propPlayerId, userId: _userId, client, readOnly = false }: PlayerDetailProps = {}) => {
  const params = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const playerId = propPlayerId || params.playerId;
  const { user } = useAuth();

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Relationship state
  const [relationships, setRelationships] = useState<PlayerRelationship[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [pickerType, setPickerType] = useState<RelationshipType | null>(null);

  const preferredPartners = relationships.filter(r => r.relationship_type === 'preferred');
  const avoidPartners = relationships.filter(r => r.relationship_type === 'avoid');
  const relatedIds = new Set(relationships.map(r => r.related_player_id));

  const loadRelationships = useCallback(async () => {
    if (!user || !playerId || readOnly) return;
    try {
      const [rels, players] = await Promise.all([
        fetchRelationships(user.id, playerId),
        fetchPlayers(user.id),
      ]);
      setRelationships(rels);
      setAllPlayers(players.filter(p => p.id !== playerId));
    } catch {
      // silently fail — relationships are non-critical
    }
  }, [user, playerId, readOnly]);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  const handleAddRelationship = async (relatedPlayerId: string, type: RelationshipType) => {
    if (!user || !playerId) return;
    try {
      await addRelationship(user.id, playerId, relatedPlayerId, type);
      await loadRelationships();
      setPickerType(null);
      toast.success("Partner added");
    } catch {
      toast.error("Failed to add partner");
    }
  };

  const handleRemoveRelationship = async (relatedPlayerId: string, type: RelationshipType) => {
    if (!user || !playerId) return;
    try {
      await removeRelationship(user.id, playerId, relatedPlayerId, type);
      await loadRelationships();
      toast.success("Partner removed");
    } catch {
      toast.error("Failed to remove partner");
    }
  };

  const { updatePlayer } = usePlayerManagement();

  const {
    player,
    setPlayer,
    filteredHistory,
    sessionStats,
    cumulativePnL,
    monthlyStats,
    distribution,
    filters,
    setFilter,
    resetFilters,
    availableMonths,
    availableStakes,
    isLoading,
  } = usePlayerDashboard(playerId, client);

  const handleUpdatePlayer = async (playerData: Partial<PlayerFormData>) => {
    if (!playerId || readOnly) return;
    try {
      const updated = await updatePlayer(playerId, playerData);
      if (updated) setPlayer(updated);
      toast.success("Player details updated successfully");
    } catch (_error) {
      // toast handled in hook
    }
  };

  const handleNavigateGame = (gameId: string) => {
    if (client) {
      navigate(`../game/${gameId}`, { relative: "path" });
    } else {
      navigate(`/games/${gameId}`);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField("date");
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 text-muted-foreground" />;
    return sortOrder === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const sortedGameHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      let aVal: number;
      let bVal: number;
      switch (sortField) {
        case "date":
          aVal = new Date(a.games.date).getTime();
          bVal = new Date(b.games.date).getTime();
          break;
        case "buy_ins":
          aVal = a.buy_ins;
          bVal = b.buy_ins;
          break;
        case "final_stack":
          aVal = a.final_stack;
          bVal = b.final_stack;
          break;
        case "net_amount":
          aVal = a.net_amount;
          bVal = b.net_amount;
          break;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredHistory, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-label text-muted-foreground animate-pulse">
          Loading Player Profile...
        </p>
      </div>
    );
  }

  if (!player) {
    return (
      <Card className="max-w-4xl mx-auto border-border bg-background/60 backdrop-blur-xl p-6 text-center">
        <p className="text-muted-foreground text-label">Player not found.</p>
      </Card>
    );
  }

  const isProfit = (player.total_profit || 0) >= 0;
  const winRate = filteredHistory.length > 0
    ? (filteredHistory.filter(gh => gh.net_amount > 0).length / filteredHistory.length) * 100
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {!readOnly && (
        <Button
          variant="ghost"
          onClick={() => navigate("/players")}
          className="hover:bg-accent/10 text-primary hover:text-primary/80 font-luxury uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Players
        </Button>
      )}

      {/* ── 1. Player Profile Card ─────────────────────────────── */}
      <Card className="border-border bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border bg-accent/5">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3 xs:gap-5 min-w-0">
              <div className="relative shrink-0">
                <OptimizedAvatar name={player.name} size="lg" className="border-primary/30 group-hover:border-primary transition-colors" />
                <div className="absolute inset-0 rounded-full shadow-lg shadow-primary/20 motion-safe:animate-pulse" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-2xl xs:text-3xl font-luxury text-foreground truncate">{player.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-label text-muted-foreground">Player Profile</span>
                </div>
              </div>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 shrink-0 ml-2",
              isProfileOpen && "rotate-180"
            )} />
          </div>
        </CardHeader>

        {isProfileOpen && (
          <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in duration-500">

            {/* Core KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatTile label="Total Games" value={player.total_games || 0} />
              <StatTile
                label="Total Profit / Loss"
                value={
                  <Badge
                    variant={isProfit ? "profit" : "loss"}
                    className="text-lg xs:text-xl sm:text-2xl font-numbers py-1 px-3 h-auto"
                  >
                    {isProfit ? "+" : ""}{formatCurrency(Math.abs(player.total_profit || 0))}
                  </Badge>
                }
              />
              <StatTile
                label="Success Ratio"
                valueClassName="text-primary"
                value={`${winRate.toFixed(1)}%`}
                caption={
                  <div
                    role="progressbar"
                    aria-label="Success ratio"
                    aria-valuenow={Math.round(winRate)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden"
                  >
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${winRate}%` }} />
                  </div>
                }
              />
            </div>

            {/* Contact / Payment details */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <div>
                  <h3 className="text-base font-luxury font-semibold text-foreground">Player Details</h3>
                  <p className="text-label text-muted-foreground mt-0.5">Contact and payment info</p>
                </div>
                {!readOnly && (
                  <div className="flex gap-2 flex-wrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 bg-accent/5 border-border hover:bg-accent/10 text-foreground text-label rounded-full"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => exportPlayerStatsToCSV(player.name, filteredHistory, sessionStats)}
                          className="cursor-pointer gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-luxury text-xs uppercase tracking-widest">Excel (CSV)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => printPlayerStatsReport(player as Player, filteredHistory, sessionStats)}
                          className="cursor-pointer gap-2"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-luxury text-xs uppercase tracking-widest">PDF / Print</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDialogOpen(true)}
                      className="h-9 px-4 hover:bg-accent/10 text-primary text-label rounded-full border border-primary/20"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditDialog(true)}
                      className="h-9 px-4 bg-accent/5 border-border hover:bg-accent/10 text-foreground text-label rounded-full"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {(player.phone_number || player.upi_id || player.payment_preference) ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 sm:p-5 rounded-lg border border-border bg-accent/5 space-y-2">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />WhatsApp
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{player.phone_number || "Not Linked"}</p>
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg border border-border bg-accent/5 space-y-2">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <CreditCard className="h-3 w-3 shrink-0" />Digital ID
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{player.upi_id || "Not Linked"}</p>
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg border border-border bg-accent/5 space-y-2">
                    <div className="flex items-center gap-2 text-label text-muted-foreground">
                      <Layers className="h-3 w-3 shrink-0" />Preference
                    </div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {player.payment_preference
                        ? (player.payment_preference === "digital" ? "Digital" : "Cash")
                        : "Unspecified"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-border bg-accent/5 text-center">
                  <p className="text-label text-muted-foreground/30">
                    No contact data for this player.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 2. Filters (before stats, so filtering is visible first) ─ */}
      <PlayerDashboardFilters
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        availableMonths={availableMonths}
        availableStakes={availableStakes}
      />

      {/* ── 3. Advanced Stats Grid ─────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-luxury font-semibold text-foreground">Advanced Stats</h3>
          <p className="text-label text-muted-foreground mt-0.5">
            {filteredHistory.length} session{filteredHistory.length !== 1 ? 's' : ''} · computed from filtered data
          </p>
        </div>
        <PlayerStatsGrid stats={sessionStats} />
      </div>

      {/* ── 4. Charts ──────────────────────────────────────────── */}
      <PlayerCharts
        cumulativePnL={cumulativePnL}
        monthlyStats={monthlyStats}
        distribution={distribution}
        totalSessions={filteredHistory.length}
      />

      {/* ── 5. Session History Table ───────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-luxury font-semibold text-foreground">Session History</h3>
          <p className="text-label text-muted-foreground mt-0.5">
            {sortedGameHistory.length} session{sortedGameHistory.length !== 1 ? 's' : ''} shown
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("date")} className="cursor-pointer w-[16%] md:w-auto">
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">Session Day</span>
                  <span className="sm:hidden">Date</span>
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("buy_ins")} className="cursor-pointer w-[12%] md:w-auto">
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">Buy-ins</span>
                  <span className="sm:hidden">Buy</span>
                  {getSortIcon("buy_ins")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("net_amount")} className="cursor-pointer w-[32%] md:w-auto">
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">Net P&L</span>
                  <span className="sm:hidden">P&L</span>
                  {getSortIcon("net_amount")}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort("final_stack")} className="cursor-pointer w-[20%] md:w-auto">
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">Final Stack</span>
                  <span className="sm:hidden">Stack</span>
                  {getSortIcon("final_stack")}
                </div>
              </TableHead>
              <TableHead className="w-[20%] md:w-auto">
                <span className="hidden sm:inline">Actions</span>
                <span className="sm:hidden">Act</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGameHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <p className="text-label text-muted-foreground/40">
                    No sessions match the current filters
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sortedGameHistory.map((game) => {
                const isWin = game.net_amount > 0;
                return (
                  <TableRow
                    key={game.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleNavigateGame(game.game_id)}
                  >
                    <TableCell className="font-medium text-tiny">
                      {format(new Date(game.games.date), isMobile ? 'd/M/yy' : 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-numbers text-center text-muted-foreground text-tiny">
                      {game.buy_ins}
                    </TableCell>
                    <TableCell className="text-tiny">
                      <Badge
                        variant={isWin ? "profit" : "loss"}
                        className="font-numbers px-1 h-5 min-w-[20px] text-tiny justify-center"
                      >
                        <ResponsiveCurrency amount={game.net_amount} />
                      </Badge>
                    </TableCell>
                    <TableCell className="font-numbers text-muted-foreground text-tiny">
                      <ResponsiveCurrency amount={game.final_stack} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size={isMobile ? "icon-sm" : "sm"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateGame(game.game_id);
                        }}
                        className="hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        {isMobile ? <ArrowRight className="h-4 w-4" /> : "Examine"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── 6. Settlement Partner Preferences (private, owner only) ─ */}
      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["preferred", "avoid"] as RelationshipType[]).map((type) => {
            const partners = type === "preferred" ? preferredPartners : avoidPartners;
            const isPreferred = type === "preferred";
            const Icon = isPreferred ? Heart : UserX;
            const label = isPreferred ? "Preferred Settlement Partners" : "Avoid Settlement Partners";
            const pickerOptions = allPlayers.filter(p => !relatedIds.has(p.id));
            const isPickerOpen = pickerType === type;

            return (
              <Card key={type} className="border-border bg-background/60 backdrop-blur-xl shadow-md overflow-hidden">
                <CardHeader className="p-4 border-b border-border bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", isPreferred ? "text-state-success" : "text-state-error")} />
                      <CardTitle className="text-lg font-luxury uppercase tracking-widest">{label}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPickerType(isPickerOpen ? null : type)}
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {isPickerOpen && (
                    <div className="space-y-1.5 pb-2 border-b border-border">
                      <p className="text-label text-muted-foreground">Select a player to add</p>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {pickerOptions.length === 0 ? (
                          <p className="text-3xs text-muted-foreground font-luxury">No more players to add</p>
                        ) : (
                          pickerOptions.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddRelationship(p.id, type)}
                              className="text-2xs px-2.5 py-1 rounded-full border border-border bg-accent/5 hover:border-primary/40 hover:bg-primary/5 font-luxury uppercase tracking-wider transition-all"
                            >
                              {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {partners.length === 0 ? (
                    <p className="text-label text-muted-foreground py-2">None added</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {partners.map(r => (
                        <div
                          key={r.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs font-luxury uppercase tracking-wider",
                            isPreferred
                              ? "bg-state-success/10 border-state-success/30 text-state-success"
                              : "bg-state-error/10 border-state-error/30 text-state-error"
                          )}
                        >
                          {r.related_player_name}
                          <button
                            onClick={() => handleRemoveRelationship(r.related_player_id, type)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        resourceType="player"
        resourceId={playerId!}
        title={`Player Profile - ${player.name}`}
        description={`Poker statistics and session history for ${player.name}.`}
      />

      {!readOnly && (
        <PlayerFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleUpdatePlayer}
          initialData={player || undefined}
          title="Edit Player Details"
          description="Edit the communication and financial parameters for this player."
        />
      )}
    </div>
  );
};

export default PlayerDetail;
