import { useState } from "react";
import { Player, SeatPosition } from "@/types/poker";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import PokerTableView from "./PokerTableView";

interface TablePositionEditorProps {
  players: Player[];
  currentPositions?: SeatPosition[];
  onSave: (positions: SeatPosition[]) => void;
  onCancel: () => void;
}

const TablePositionEditor = ({
  players,
  currentPositions = [],
  onSave,
  onCancel,
}: TablePositionEditorProps) => {
  const [positions, setPositions] = useState<SeatPosition[]>(currentPositions);

  // Get available players (not already seated)
  const seatedPlayerIds = positions.map(p => p.player_id);
  const availablePlayers = players.filter(p => !seatedPlayerIds.includes(p.id));

  // Generate all seat numbers based on total players in game (fixed seats)
  const allSeats = Array.from({ length: players.length }, (_, i) => i + 1);
  
  // Create a map of seat to player for easy lookup
  const seatToPlayer = new Map<number, SeatPosition>();
  positions.forEach(pos => seatToPlayer.set(pos.seat, pos));

  const handlePlayerSelect = (seat: number, playerId: string) => {
    if (!playerId) {
      // If empty selection, remove the player from this seat
      setPositions(positions.filter(p => p.seat !== seat));
      return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Remove this player from any other seat they might occupy
    const updatedPositions = positions.filter(p => p.player_id !== playerId && p.seat !== seat);
    
    // Add the player to the new seat
    updatedPositions.push({
      seat,
      player_id: player.id,
      player_name: player.name,
    });
    
    setPositions(updatedPositions.sort((a, b) => a.seat - b.seat));
  };

  const handleSave = () => {
    if (positions.length === 0) {
      return;
    }
    onSave(positions);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Set Table Positions</h3>
        <p className="text-sm text-muted-foreground">
          Assign players to seat numbers (1-{players.length}). Select a player for each seat from the dropdown.
        </p>
      </div>

      {/* Table Preview */}
      {positions.length > 0 && (
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Drag and drop players to rearrange their positions
          </p>
          <PokerTableView 
            positions={positions} 
            enableDragDrop={true}
            onPositionsChange={setPositions}
          />
        </div>
      )}

      {/* Seat Assignment Section - All seats shown with player dropdowns */}
      <div className="space-y-3">
        <h4 className="font-medium">Assign Players to Seats</h4>
        <p className="text-xs text-muted-foreground">
          Each seat is fixed. Select a player from the dropdown for each seat position.
        </p>
        
        <div className="space-y-2">
          {allSeats.map((seat) => {
            const currentPlayer = seatToPlayer.get(seat);
            const currentPlayerId = currentPlayer?.player_id || '';
            
            return (
              <div key={seat} className="grid grid-cols-[auto_1fr] gap-3 items-center">
                {/* Fixed Seat Number on the LEFT */}
                <div className="w-16 h-10 rounded-lg bg-primary/20 border-2 border-primary/40 flex items-center justify-center font-bold text-primary">
                  Seat {seat}
                </div>

                {/* Player selection on the RIGHT */}
                <Select 
                  value={currentPlayerId} 
                  onValueChange={(value) => handlePlayerSelect(seat, value)}
                >
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Select player..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="">
                      <span className="text-muted-foreground italic">- Empty seat -</span>
                    </SelectItem>
                    {players
                      .filter(p => !seatedPlayerIds.includes(p.id) || p.id === currentPlayerId)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={positions.length === 0}
          className="flex-1"
        >
          Save Table Position ({positions.length} seated)
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default TablePositionEditor;