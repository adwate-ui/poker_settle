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
import { X } from "lucide-react";
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
  // Arrays to hold multiple player/seat selections
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Get available players (not already seated)
  const seatedPlayerIds = positions.map(p => p.player_id);
  const availablePlayers = players.filter(p => !seatedPlayerIds.includes(p.id));

  // Generate seat numbers based on total players in game
  const allSeats = Array.from({ length: players.length }, (_, i) => i + 1);
  const occupiedSeats = positions.map(p => p.seat);
  const availableSeats = allSeats.filter(s => !occupiedSeats.includes(s));
  
  // Number of unseated players
  const unseatedCount = availablePlayers.length;

  const handlePlayerSelect = (index: number, playerId: string) => {
    const newSelection = [...selectedPlayers];
    newSelection[index] = playerId;
    setSelectedPlayers(newSelection);
  };

  const handleSeatSelect = (index: number, seat: string) => {
    const newSelection = [...selectedSeats];
    newSelection[index] = seat;
    setSelectedSeats(newSelection);
  };

  const handleAddPlayers = () => {
    const newPositions: SeatPosition[] = [];
    
    for (let i = 0; i < unseatedCount; i++) {
      const playerId = selectedPlayers[i];
      const seatStr = selectedSeats[i];
      
      if (playerId && seatStr) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          newPositions.push({
            seat: parseInt(seatStr),
            player_id: player.id,
            player_name: player.name,
          });
        }
      }
    }
    
    if (newPositions.length > 0) {
      setPositions([...positions, ...newPositions].sort((a, b) => a.seat - b.seat));
      setSelectedPlayers([]);
      setSelectedSeats([]);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setPositions(positions.filter(p => p.player_id !== playerId));
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
          Assign players to seat numbers (1-{players.length}). The table will display {positions.length} seated players.
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

      {/* Add Player Section */}
      {availablePlayers.length > 0 && availableSeats.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Add Players to Table ({unseatedCount} unseated)</h4>
          
          <div className="space-y-2">
            {Array.from({ length: unseatedCount }).map((_, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={selectedPlayers[index] || ''} onValueChange={(value) => handlePlayerSelect(index, value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={`Select player ${index + 1}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {availablePlayers
                      .filter(p => !selectedPlayers.includes(p.id) || selectedPlayers[index] === p.id)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSeats[index] || ''} onValueChange={(value) => handleSeatSelect(index, value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={`Select seat ${index + 1}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {availableSeats
                      .filter(s => !selectedSeats.includes(s.toString()) || selectedSeats[index] === s.toString())
                      .map((seat) => (
                        <SelectItem key={seat} value={seat.toString()}>
                          Seat {seat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleAddPlayers}
            disabled={selectedPlayers.filter(p => p).length === 0 || selectedSeats.filter(s => s).length === 0}
            className="w-full sm:w-auto"
          >
            Add {selectedPlayers.filter(p => p).length || 0} Player(s) to Table
          </Button>
        </div>
      )}

      {/* Seated Players List */}
      {positions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Seated Players ({positions.length})</h4>
          <div className="space-y-2">
            {positions.map((position) => (
              <div
                key={position.player_id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {position.seat}
                  </div>
                  <span className="font-medium">{position.player_name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePlayer(position.player_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={positions.length === 0}
          className="flex-1"
        >
          Save Table Position
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default TablePositionEditor;