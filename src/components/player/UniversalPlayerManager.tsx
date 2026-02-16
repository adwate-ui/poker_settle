import { useState, useMemo, useEffect } from "react";
import { Player } from "@/types/poker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Loader2 } from "lucide-react";
import LuxurySelectionCard from "@/components/ui-primitives/LuxurySelectionCard";
import { toast } from "@/lib/notifications";

interface UniversalPlayerManagerProps {
    allPlayers: Player[];
    selectedPlayers: Player[];
    onSelectPlayer: (player: Player) => void;
    onRemovePlayer?: (playerId: string) => void;
    onCreatePlayer: (name: string) => Promise<void>;
    mode: "dialog" | "embedded";
    triggerButtonText?: string;
    className?: string; // Allow custom styling for container
}

export const UniversalPlayerManager = ({
    allPlayers,
    selectedPlayers,
    onSelectPlayer,
    onCreatePlayer,
    mode,
    triggerButtonText = "Add Player",
    className,
    open,
    onOpenChange
}: UniversalPlayerManagerProps & { open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    // Control open state either via prop or internal state
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [newPlayerName, setNewPlayerName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    // Determine active tab: if no players available and not searching, default to 'new' maybe? 
    // But usually 'existing' is better default.
    const [activeTab, setActiveTab] = useState("existing");

    // Internal filtering logic
    const availablePlayers = useMemo(() => {
        return allPlayers
            .filter(p => !selectedPlayers.find(sp => sp.id === p.id))
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allPlayers, selectedPlayers, searchQuery]);

    const handleCreatePlayer = async () => {
        if (!newPlayerName.trim()) {
            toast.error("Please enter a player name");
            return;
        }

        setIsCreating(true);
        try {
            await onCreatePlayer(newPlayerName.trim());
            setNewPlayerName("");
            toast.success("Player created!");

            // If we are in dialog mode, and we successfully created (and presumably added via parent) a player,
            // we might want to close or just clear input.
            // If it's single selection mode, ideally we close.
            // But this is "Universal", often used for adding multiple.
            // I'll leave it open but clear input.
            if (activeTab === 'new') {
                setActiveTab("existing");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create player");
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelect = (player: Player) => {
        onSelectPlayer(player);
        if (mode === "dialog") {
            toast.success(`${player.name} added!`);
            // Optional: close dialog on select? usually no, for multiple selections.
        }
    };

    // Reset state when opening dialog
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setNewPlayerName("");
            setActiveTab("existing");
        }
    }, [isOpen]);

    const Content = (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
            <TabsList className="grid grid-cols-2">
                <TabsTrigger value="existing" className="font-luxury text-3xs uppercase tracking-widest">
                    Search
                </TabsTrigger>
                <TabsTrigger value="new" className="font-luxury text-3xs uppercase tracking-widest">
                    New
                </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="luxury"
                        className="pl-10 h-10 sm:h-12"
                        autoFocus={mode === 'dialog'} // Auto focus only in dialog
                    />
                </div>

                <ScrollArea className="h-[300px] sm:h-[350px]">
                    <div className="space-y-2 pr-4">
                        {availablePlayers.length > 0 ? (
                            availablePlayers.map((player) => (
                                <LuxurySelectionCard
                                    key={player.id}
                                    player={player}
                                    onClick={() => handleSelect(player)}
                                    size="sm"
                                />
                            ))
                        ) : (
                            <div className="py-20 text-center border border-dashed border-border/40 rounded-lg bg-card/10">
                                <p className="text-[10px] font-luxury uppercase tracking-widest text-muted-foreground">
                                    {searchQuery ? `No players found for "${searchQuery}"` : "No available players"}
                                </p>
                                {searchQuery && (
                                    <Button
                                        variant="link"
                                        className="mt-2 text-primary"
                                        onClick={() => {
                                            setNewPlayerName(searchQuery);
                                            setActiveTab("new");
                                        }}
                                    >
                                        Create "{searchQuery}"
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 focus-visible:ring-0 focus-visible:outline-none">
                <div className="space-y-3">
                    <Input
                        placeholder="Enter player name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        variant="luxury"
                        onKeyPress={(e) => e.key === 'Enter' && !isCreating && handleCreatePlayer()}
                        className="h-10 sm:h-12"
                    />
                </div>
                <Button
                    onClick={handleCreatePlayer}
                    disabled={!newPlayerName.trim() || isCreating}
                    variant="luxury"
                    className="w-full h-10 sm:h-12"
                >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add New Player'}
                </Button>
            </TabsContent>
        </Tabs>
    );

    if (mode === "dialog") {
        return (
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="outline" className={className}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {triggerButtonText}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6 bg-background/80 backdrop-blur-xl border-border/50">
                    <DialogHeader className="p-0 mb-4 text-left">
                        <DialogTitle className="font-luxury uppercase tracking-widest text-lg">Add Player</DialogTitle>
                        <DialogDescription>
                            Select from registry or create new profile.
                        </DialogDescription>
                    </DialogHeader>
                    {Content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div className={className}>
            {Content}
        </div>
    );
};
