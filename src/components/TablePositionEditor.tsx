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
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");

  // Get available players (not already seated)
  const seatedPlayerIds = positions.map(p => p.player_id);
  const availablePlayers = players.filter(p => !seatedPlayerIds.includes(p.id));

  // Generate seat numbers based on total players in game
  const allSeats = Array.from({ length: players.length }, (_, i) => i + 1);
  const occupiedSeats = positions.map(p => p.seat);
  const availableSeats = allSeats.filter(s => !occupiedSeats.includes(s));

  const handleAddPlayer = () => {
    if (!selectedPlayer || !selectedSeat) return;

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    const newPosition: SeatPosition = {
      seat: parseInt(selectedSeat),
      player_id: player.id,
      player_name: player.name,
    };

    setPositions([...positions, newPosition].sort((a, b) => a.seat - b.seat));
    setSelectedPlayer("");
    setSelectedSeat("");
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
          <PokerTableView positions={positions} />
        </div>
      )}

      {/* Add Player Section */}
      {availablePlayers.length > 0 && availableSeats.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Add Player to Table</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availablePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSeat} onValueChange={setSelectedSeat}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select seat" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {availableSeats.map((seat) => (
                  <SelectItem key={seat} value={seat.toString()}>
                    Seat {seat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddPlayer}
            disabled={!selectedPlayer || !selectedSeat}
            className="w-full sm:w-auto"
          >
            Add to Table
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