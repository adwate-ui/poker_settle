
/**
 * Sanitizes a string for HTML output to prevent XSS.
 */
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m] || m));
};

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
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { format } from 'date-fns';
import { Game, Player, Settlement, SessionStats, DashboardGameHistory } from '@/types/poker';
import { HandWithDetails } from '@/hooks/useHandsHistory';
import { formatCurrency } from '@/utils/currencyUtils';
import { computeMonthlyStats, computeCumulativePnL } from '@/features/players/utils/playerStats';

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
 * Export hands history to CSV
 */
export function exportHandsToCSV(hands: HandWithDetails[]): void {
  const data = hands.map(hand => ({
    date: hand.game_date ? format(new Date(hand.game_date), 'yyyy-MM-dd') : '',
    handNumber: hand.hand_number,
    buttonPlayer: hand.button_player_name,
    winners: hand.winner_player_names.join(', '),
    potSize: hand.pot_size,
    heroPosition: hand.hero_position || '',
    finalStage: hand.final_stage || '',
    result: hand.is_split ? 'Split' : hand.is_hero_win === true ? 'Win' : hand.is_hero_win === false ? 'Loss' : '',
  }));

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'handNumber', label: 'Hand #' },
    { key: 'buttonPlayer', label: 'Button' },
    { key: 'winners', label: 'Winner(s)' },
    { key: 'potSize', label: 'Pot Size' },
    { key: 'heroPosition', label: 'Hero Position' },
    { key: 'finalStage', label: 'Final Stage' },
    { key: 'result', label: 'Result' },
  ];

  const csv = arrayToCSV(data, headers);
  const filename = `poker-hands-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
  const sortedPlayers = [...(game.game_players || [])].sort((a, b) => (b.net_amount || 0) - (a.net_amount || 0));

  const playersHTML = sortedPlayers.map(gp => {
    const netAmount = gp.net_amount || 0;
    const isProfit = netAmount >= 0;
    const profitClass = isProfit ? 'profit' : 'loss';
    return `
      <tr>
        <td>${escapeHtml(gp.player?.name || 'Unknown')}</td>
        <td class="number">${gp.buy_ins}</td>
        <td class="number">${formatCurrency(gp.buy_ins * game.buy_in_amount)}</td>
        <td class="number">${formatCurrency(gp.final_stack || 0)}</td>
        <td class="number ${profitClass}">${isProfit ? '+' : ''}${formatCurrency(netAmount)}</td>
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
            <td>${escapeHtml(s.from)}</td>
            <td>${escapeHtml(s.to)}</td>
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
      <title>Poker Game Report - ${escapeHtml(gameDate)}</title>
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
        <div class="date">${escapeHtml(gameDate)}</div>
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
        Generated by PokerSettle on ${escapeHtml(format(new Date(), 'PPP p'))}
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
        <td>${escapeHtml(player.name)}</td>
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
        <div class="date">Generated on ${escapeHtml(format(new Date(), 'PPPP'))}</div>
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
        Generated by PokerSettle on ${escapeHtml(format(new Date(), 'PPP p'))}
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

/**
 * Empty export for printGamesReport as it might be used via generic window.print() or future implementation
 */
export const printGamesReport = (_games: Game[]) => {
  window.print();
};

// Player Stats Export Utilities
// ==============================

/**
 * Export a player's full session history and stats to CSV / Excel
 */
export function exportPlayerStatsToCSV(
  playerName: string,
  history: DashboardGameHistory[],
  stats: SessionStats,
): void {
  if (history.length === 0) return;

  // Build summary block
  const summaryLines = [
    `"Player Stats Export — ${escapeHtml(playerName)}"`,
    `"Generated: ${format(new Date(), 'PPP p')}"`,
    '',
    '"SUMMARY"',
    `"Total Sessions","${stats.totalGames}"`,
    `"Total Profit/Loss","${formatCurrency(stats.totalProfit)}"`,
    `"Total Invested","${formatCurrency(stats.totalInvested)}"`,
    `"ROI","${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%"`,
    `"Win Rate","${stats.winRate.toFixed(1)}%"`,
    `"Avg Profit / Session","${formatCurrency(stats.avgProfitPerSession)}"`,
    `"Avg Buy-ins / Session","${stats.avgBuyinsPerSession.toFixed(1)}"`,
    `"Best Session","${formatCurrency(stats.biggestWin)}"`,
    `"Worst Session","${formatCurrency(stats.biggestLoss)}"`,
    '',
    '"SESSION HISTORY"',
  ].join('\n');

  // Session rows
  const sorted = [...history].sort(
    (a, b) => new Date(a.games.date).getTime() - new Date(b.games.date).getTime(),
  );
  let running = 0;
  const sessionData = sorted.map((g) => {
    running += g.net_amount;
    return {
      date: format(new Date(g.games.date), 'yyyy-MM-dd'),
      buyIns: g.buy_ins,
      totalInvested: g.buy_ins * g.games.buy_in_amount,
      finalStack: g.final_stack,
      netAmount: g.net_amount,
      runningTotal: running,
    };
  });

  const sessionHeaders = [
    { key: 'date', label: 'Date' },
    { key: 'buyIns', label: 'Buy-ins' },
    { key: 'totalInvested', label: 'Total Invested' },
    { key: 'finalStack', label: 'Final Stack' },
    { key: 'netAmount', label: 'Net P&L' },
    { key: 'runningTotal', label: 'Cumulative P&L' },
  ];

  const sessionCSV = arrayToCSV(sessionData as unknown as Record<string, unknown>[], sessionHeaders);

  // Monthly summary
  const monthly = computeMonthlyStats(history);
  const monthlyHeaders = [
    { key: 'month', label: 'Month' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'profit', label: 'Net P&L' },
    { key: 'winRate', label: 'Win Rate %' },
  ];
  const monthlyFormatted = monthly.map((m) => ({
    month: m.month,
    sessions: m.sessions,
    profit: m.profit,
    winRate: `${m.winRate.toFixed(1)}%`,
  }));
  const monthlyCSV = arrayToCSV(monthlyFormatted as unknown as Record<string, unknown>[], monthlyHeaders);

  const fullCSV = summaryLines + '\n' + sessionCSV + '\n\n"MONTHLY BREAKDOWN"\n' + monthlyCSV;
  const safeName = playerName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  downloadFile(fullCSV, `poker-player-${safeName}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

/**
 * Generate print-friendly HTML for a player's stats (PDF via browser print)
 */
export function generatePlayerStatsPrintHTML(
  player: Player,
  history: DashboardGameHistory[],
  stats: SessionStats,
): string {
  const monthly = computeMonthlyStats(history);
  const cumulative = computeCumulativePnL(history);

  const isProfit = stats.totalProfit >= 0;
  const profitClass = isProfit ? 'profit' : 'loss';
  const profitSign = isProfit ? '+' : '';

  const sessionRows = cumulative.map((point, idx) => {
    const isWin = point.sessionPnl > 0;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(point.date)}</td>
        <td class="number ${isWin ? 'profit' : 'loss'}">${isWin ? '+' : ''}${formatCurrency(point.sessionPnl)}</td>
        <td class="number ${point.cumulative >= 0 ? 'profit' : 'loss'}">${point.cumulative >= 0 ? '+' : ''}${formatCurrency(point.cumulative)}</td>
      </tr>
    `;
  }).join('');

  const monthlyRows = monthly.map((m) => {
    const isMonthProfit = m.profit >= 0;
    return `
      <tr>
        <td>${escapeHtml(m.month)}</td>
        <td class="number">${m.sessions}</td>
        <td class="number ${isMonthProfit ? 'profit' : 'loss'}">${isMonthProfit ? '+' : ''}${formatCurrency(m.profit)}</td>
        <td class="number">${m.winRate.toFixed(0)}%</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Player Stats — ${escapeHtml(player.name)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.5;
          background: #faf8f3;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #d4af37;
        }
        .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 4px; }
        .header .subtitle { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 30px;
        }
        .stat {
          text-align: center;
          padding: 14px 12px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e8e0cc;
        }
        .stat-label { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 600; color: #1a1a1a; }
        .profit { color: #059669; font-weight: 600; }
        .loss { color: #dc2626; font-weight: 600; }
        h3 { font-size: 16px; margin: 24px 0 12px; color: #1a1a1a; border-bottom: 1px solid #e8e0cc; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th, td { padding: 9px 12px; text-align: left; border-bottom: 1px solid #f0ebe0; }
        th { background: #f5f0e4; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
        .number { text-align: right; font-variant-numeric: tabular-nums; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e0cc; text-align: center; font-size: 11px; color: #aaa; }
        @media print { body { padding: 20px; background: white; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(player.name)}</h1>
        <div class="subtitle">Poker Player Statistics — Generated ${escapeHtml(format(new Date(), 'PPP'))}</div>
      </div>

      <div class="stats-grid">
        <div class="stat">
          <div class="stat-label">Total P&L</div>
          <div class="stat-value ${profitClass}">${profitSign}${formatCurrency(stats.totalProfit)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">ROI</div>
          <div class="stat-value ${stats.roi >= 0 ? 'profit' : 'loss'}">${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Win Rate</div>
          <div class="stat-value">${stats.winRate.toFixed(1)}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Sessions</div>
          <div class="stat-value">${stats.totalGames}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Invested</div>
          <div class="stat-value">${formatCurrency(stats.totalInvested)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Avg / Session</div>
          <div class="stat-value ${stats.avgProfitPerSession >= 0 ? 'profit' : 'loss'}">${stats.avgProfitPerSession >= 0 ? '+' : ''}${formatCurrency(stats.avgProfitPerSession)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Best Session</div>
          <div class="stat-value profit">${stats.biggestWin > 0 ? '+' + formatCurrency(stats.biggestWin) : '—'}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Worst Session</div>
          <div class="stat-value loss">${stats.biggestLoss < 0 ? formatCurrency(stats.biggestLoss) : '—'}</div>
        </div>
      </div>

      <h3>Monthly Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th class="number">Sessions</th>
            <th class="number">Net P&L</th>
            <th class="number">Win Rate</th>
          </tr>
        </thead>
        <tbody>${monthlyRows}</tbody>
      </table>

      <h3>Session History</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th class="number">Session P&L</th>
            <th class="number">Cumulative P&L</th>
          </tr>
        </thead>
        <tbody>${sessionRows}</tbody>
      </table>

      <div class="footer">
        Generated by PokerSettle on ${escapeHtml(format(new Date(), 'PPP p'))}
      </div>
    </body>
    </html>
  `;
}

/**
 * Opens the browser print dialog for a player's stats report (Save as PDF)
 */
export function printPlayerStatsReport(
  player: Player,
  history: DashboardGameHistory[],
  stats: SessionStats,
): void {
  const html = generatePlayerStatsPrintHTML(player, history, stats);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
