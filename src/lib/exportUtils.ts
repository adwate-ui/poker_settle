/**
 * Export Utilities
 *
 * Provides CSV and PDF export functionality for games and player data.
 */

import { format } from 'date-fns';
import { Game, Player, GamePlayer, Settlement } from '@/types/poker';
import { formatCurrency } from '@/utils/currencyUtils';

// CSV Export Utilities
// =====================

/**
 * Converts an array of objects to CSV format
 */
function arrayToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  if (data.length === 0) return '';

  // Create header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    headers.map(h => {
      const value = row[h.key];
      // Handle different value types
      if (value === null || value === undefined) return '""';
      if (typeof value === 'number') return value.toString();
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a file download with the given content
 */
function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export games history to CSV
 */
export function exportGamesToCSV(games: Game[]): void {
  const data = games.map(game => {
    const playerCount = game.game_players?.length || 0;
    const totalBuyIns = game.game_players?.reduce((sum, gp) => sum + (gp.buy_ins || 0), 0) || 0;
    const totalPot = totalBuyIns * game.buy_in_amount;
    const playerNames = game.game_players?.map(gp => gp.player?.name || 'Unknown').join(', ') || '';

    return {
      date: format(new Date(game.date), 'yyyy-MM-dd'),
      buyInAmount: game.buy_in_amount,
      smallBlind: game.small_blind || '',
      bigBlind: game.big_blind || '',
      playerCount,
      totalBuyIns,
      totalPot,
      players: playerNames,
      isComplete: game.is_complete ? 'Yes' : 'No',
    };
  });

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'buyInAmount', label: 'Buy-in Amount' },
    { key: 'smallBlind', label: 'Small Blind' },
    { key: 'bigBlind', label: 'Big Blind' },
    { key: 'playerCount', label: 'Players' },
    { key: 'totalBuyIns', label: 'Total Buy-ins' },
    { key: 'totalPot', label: 'Total Pot' },
    { key: 'players', label: 'Player Names' },
    { key: 'isComplete', label: 'Completed' },
  ];

  const csv = arrayToCSV(data, headers);
  const filename = `poker-games-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csv, filename);
}

/**
 * Export players history to CSV
 */
export function exportPlayersToCSV(players: Player[]): void {
  const data = players.map(player => ({
    name: player.name,
    phone: player.phone_number || '',
    email: player.email || '',
    upiId: player.upi_id || '',
    paymentPreference: player.payment_preference || 'upi',
    totalGames: player.total_games || 0,
    totalProfit: player.total_profit || 0,
    profitFormatted: formatCurrency(player.total_profit || 0),
  }));

  const headers = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'upiId', label: 'UPI ID' },
    { key: 'paymentPreference', label: 'Payment Preference' },
    { key: 'totalGames', label: 'Games Played' },
    { key: 'totalProfit', label: 'Net Profit/Loss (Raw)' },
    { key: 'profitFormatted', label: 'Net Profit/Loss' },
  ];

  const csv = arrayToCSV(data, headers);
  const filename = `poker-players-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csv, filename);
}

/**
 * Export a single game's details to CSV
 */
export function exportGameDetailsToCSV(game: Game): void {
  // Export player results
  const playerData = game.game_players?.map(gp => ({
    player: gp.player?.name || 'Unknown',
    buyIns: gp.buy_ins,
    totalInvested: gp.buy_ins * game.buy_in_amount,
    finalStack: gp.final_stack,
    netAmount: gp.net_amount,
    netFormatted: formatCurrency(gp.net_amount),
  })) || [];

  const playerHeaders = [
    { key: 'player', label: 'Player' },
    { key: 'buyIns', label: 'Buy-ins' },
    { key: 'totalInvested', label: 'Total Invested' },
    { key: 'finalStack', label: 'Final Stack' },
    { key: 'netAmount', label: 'Net Amount (Raw)' },
    { key: 'netFormatted', label: 'Net Amount' },
  ];

  // Create game summary
  const totalPot = game.game_players?.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0) || 0;
  const gameInfo = [
    `Game Date: ${format(new Date(game.date), 'PPP')}`,
    `Buy-in Amount: ${formatCurrency(game.buy_in_amount)}`,
    `Small Blind: ${game.small_blind ? formatCurrency(game.small_blind) : 'N/A'}`,
    `Big Blind: ${game.big_blind ? formatCurrency(game.big_blind) : 'N/A'}`,
    `Total Players: ${game.game_players?.length || 0}`,
    `Total Pot: ${formatCurrency(totalPot)}`,
    '',
    'Player Results:',
  ].join('\n');

  const playerCSV = arrayToCSV(playerData, playerHeaders);

  // Add settlements if available
  let settlementsCSV = '';
  if (game.settlements && game.settlements.length > 0) {
    const settlementData = game.settlements.map(s => ({
      from: s.from,
      to: s.to,
      amount: s.amount,
      amountFormatted: formatCurrency(s.amount),
    }));

    const settlementHeaders = [
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      { key: 'amount', label: 'Amount (Raw)' },
      { key: 'amountFormatted', label: 'Amount' },
    ];

    settlementsCSV = '\n\nSettlements:\n' + arrayToCSV(settlementData, settlementHeaders);
  }

  const fullCSV = gameInfo + '\n' + playerCSV + settlementsCSV;
  const filename = `poker-game-${format(new Date(game.date), 'yyyy-MM-dd')}.csv`;
  downloadFile(fullCSV, filename);
}

// PDF Export Utilities (via browser print)
// ========================================

interface PrintableGameData {
  game: Game;
  totalPot: number;
  settlements: Settlement[];
}

/**
 * Generates a print-friendly HTML document for a game
 */
export function generateGamePrintHTML(data: PrintableGameData): string {
  const { game, totalPot, settlements } = data;
  const gameDate = format(new Date(game.date), 'PPPP');

  // Sort players by net amount (winners first)
  const sortedPlayers = [...(game.game_players || [])].sort((a, b) => b.net_amount - a.net_amount);

  const playersHTML = sortedPlayers.map(gp => {
    const isProfit = gp.net_amount >= 0;
    const profitClass = isProfit ? 'profit' : 'loss';
    return `
      <tr>
        <td>${gp.player?.name || 'Unknown'}</td>
        <td class="number">${gp.buy_ins}</td>
        <td class="number">${formatCurrency(gp.buy_ins * game.buy_in_amount)}</td>
        <td class="number">${formatCurrency(gp.final_stack)}</td>
        <td class="number ${profitClass}">${isProfit ? '+' : ''}${formatCurrency(gp.net_amount)}</td>
      </tr>
    `;
  }).join('');

  const settlementsHTML = settlements.length > 0 ? `
    <h3>Settlements</h3>
    <table>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${settlements.map(s => `
          <tr>
            <td>${s.from}</td>
            <td>${s.to}</td>
            <td class="number">${formatCurrency(s.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Poker Game Report - ${gameDate}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #d4af37;
        }
        .header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .header .date {
          font-size: 16px;
          color: #666;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat {
          text-align: center;
          padding: 15px 25px;
          background: #f8f8f8;
          border-radius: 8px;
          min-width: 120px;
        }
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }
        h3 {
          font-size: 18px;
          margin: 30px 0 15px;
          color: #1a1a1a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }
        .number {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .profit {
          color: #059669;
          font-weight: 600;
        }
        .loss {
          color: #dc2626;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Poker Game Report</h1>
        <div class="date">${gameDate}</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-label">Buy-in</div>
          <div class="stat-value">${formatCurrency(game.buy_in_amount)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Players</div>
          <div class="stat-value">${game.game_players?.length || 0}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Pot</div>
          <div class="stat-value">${formatCurrency(totalPot)}</div>
        </div>
        ${game.small_blind ? `
          <div class="stat">
            <div class="stat-label">Blinds</div>
            <div class="stat-value">${formatCurrency(game.small_blind)}/${formatCurrency(game.big_blind || game.small_blind * 2)}</div>
          </div>
        ` : ''}
      </div>

      <h3>Player Results</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th class="number">Buy-ins</th>
            <th class="number">Invested</th>
            <th class="number">Final Stack</th>
            <th class="number">Net P&L</th>
          </tr>
        </thead>
        <tbody>
          ${playersHTML}
        </tbody>
      </table>

      ${settlementsHTML}

      <div class="footer">
        Generated by Poker Settle on ${format(new Date(), 'PPP p')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Opens a print dialog for a game report
 */
export function printGameReport(game: Game, settlements: Settlement[] = []): void {
  const totalPot = game.game_players?.reduce((sum, gp) => sum + (gp.buy_ins * game.buy_in_amount), 0) || 0;
  const allSettlements = [...(game.settlements || []), ...settlements];

  const html = generateGamePrintHTML({
    game,
    totalPot,
    settlements: allSettlements,
  });

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Generates print-friendly HTML for all players
 */
export function generatePlayersPrintHTML(players: Player[]): string {
  const sortedPlayers = [...players].sort((a, b) => (b.total_profit || 0) - (a.total_profit || 0));
  const totalProfit = players.reduce((sum, p) => sum + (p.total_profit || 0), 0);
  const profitablePlayers = players.filter(p => (p.total_profit || 0) >= 0).length;

  const playersHTML = sortedPlayers.map((player, index) => {
    const profit = player.total_profit || 0;
    const isProfit = profit >= 0;
    const profitClass = isProfit ? 'profit' : 'loss';
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${player.name}</td>
        <td class="number">${player.total_games || 0}</td>
        <td class="number ${profitClass}">${isProfit ? '+' : ''}${formatCurrency(profit)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Player Statistics Report</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #d4af37;
        }
        .header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .header .date {
          font-size: 16px;
          color: #666;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat {
          text-align: center;
          padding: 15px 25px;
          background: #f8f8f8;
          border-radius: 8px;
          min-width: 120px;
        }
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }
        .number {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .profit {
          color: #059669;
          font-weight: 600;
        }
        .loss {
          color: #dc2626;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Player Statistics</h1>
        <div class="date">Generated on ${format(new Date(), 'PPPP')}</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total Players</div>
          <div class="stat-value">${players.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Profitable</div>
          <div class="stat-value">${profitablePlayers}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Net Flow</div>
          <div class="stat-value">${formatCurrency(totalProfit)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th class="number">Games</th>
            <th class="number">Net P&L</th>
          </tr>
        </thead>
        <tbody>
          ${playersHTML}
        </tbody>
      </table>

      <div class="footer">
        Generated by Poker Settle on ${format(new Date(), 'PPP p')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Opens a print dialog for player statistics
 */
export function printPlayersReport(players: Player[]): void {
  const html = generatePlayersPrintHTML(players);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
