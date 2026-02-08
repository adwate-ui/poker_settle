import { memo } from "react";
import { Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import LuxurySelectionCard from "./LuxurySelectionCard";
import { Player } from "@/types/poker";

interface AddPlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availablePlayers: Player[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    newPlayerName: string;
    onNewPlayerNameChange: (name: string) => void;
    onAddExisting: (player: Player) => void;
    onAddNew: () => void;
    isCreating: boolean;
}

const AddPlayerDialog = memo(({
    open,
    onOpenChange,
    availablePlayers,
    searchQuery,
    onSearchChange,
    newPlayerName,
    onNewPlayerNameChange,
    onAddExisting,
    onAddNew,
    isCreating
}: AddPlayerDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-xl p-6">
                <DialogHeader className="p-0 mb-6">
                    <DialogTitle>Add Player</DialogTitle>
                    <DialogDescription>
                        Search for an existing player or create a new one.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="existing" className="space-y-6">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger
                            value="existing"
                            className="text-[10px]"
                        >
                            Search
                        </TabsTrigger>
                        <TabsTrigger
                            value="new"
                            className="text-[10px]"
                        >
                            New
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input
                                placeholder="SEARCH PLAYERS..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                variant="luxury"
                                className="pl-10"
                            />
                        </div>

                        <ScrollArea className="h-[300px] sm:h-[350px]">
                            <div className="space-y-2">
                                {availablePlayers.length > 0 ? (
                                    availablePlayers.map((player) => (
                                        <LuxurySelectionCard
                                            key={player.id}
                                            player={player}
                                            onClick={() => onAddExisting(player)}
                                            size="sm"
                                        />
                                    ))
                                ) : (
                                    <div className="py-20 text-center border border-dashed border-border/40 rounded-lg bg-card/10">
                                        <p className="text-[10px] font-luxury uppercase tracking-widest text-muted-foreground">No players found.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-6">
                        <div className="space-y-3">
                            <Input
                                placeholder="ENTER PLAYER NAME"
                                value={newPlayerName}
                                onChange={(e) => onNewPlayerNameChange(e.target.value)}
                                variant="luxury"
                                onKeyPress={(e) => e.key === 'Enter' && !isCreating && onAddNew()}
                                autoFocus
                            />
                        </div>
                        <Button
                            onClick={onAddNew}
                            disabled={!newPlayerName.trim() || isCreating}
                            variant="luxury"
                            className="w-full h-11"
                        >
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add New Player'}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
});

AddPlayerDialog.displayName = "AddPlayerDialog";

export default AddPlayerDialog;
