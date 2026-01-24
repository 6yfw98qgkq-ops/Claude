#!/usr/bin/env python3
"""
Leaderboard management for the High-Low game.
Handles storing and displaying game records.
"""

import json
import os
from datetime import datetime
from typing import List, Dict


class Leaderboard:
    """Manages game history and leaderboard."""

    HISTORY_FILE = "game_history.json"

    def __init__(self):
        """Initialize the leaderboard."""
        self.records = self._load_records()

    def _load_records(self) -> List[Dict]:
        """Load game records from file."""
        if not os.path.exists(self.HISTORY_FILE):
            return []

        try:
            with open(self.HISTORY_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []

    def _save_records(self):
        """Save game records to file."""
        try:
            with open(self.HISTORY_FILE, 'w') as f:
                json.dump(self.records, f, indent=2)
        except IOError as e:
            print(f"Error saving records: {e}")

    def add_record(self, player_name: str, guesses: int, time_taken: float, timestamp: datetime):
        """
        Add a new game record.

        Args:
            player_name: Name of the player
            guesses: Number of guesses used
            time_taken: Time taken in seconds
            timestamp: When the game was played
        """
        record = {
            'player_name': player_name,
            'guesses': guesses,
            'time_taken': round(time_taken, 2),
            'timestamp': timestamp.isoformat(),
            'date_display': timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.records.append(record)
        self._save_records()

    def get_top_records(self, limit: int = 10) -> List[Dict]:
        """
        Get top records sorted by fewest guesses, then by time taken.

        Args:
            limit: Maximum number of records to return

        Returns:
            List of top game records
        """
        sorted_records = sorted(
            self.records,
            key=lambda x: (x['guesses'], x['time_taken'])
        )
        return sorted_records[:limit]

    def get_all_records(self) -> List[Dict]:
        """
        Get all records sorted by most recent first.

        Returns:
            List of all game records
        """
        return sorted(
            self.records,
            key=lambda x: x['timestamp'],
            reverse=True
        )

    def display_leaderboard(self, limit: int = 10):
        """
        Display the leaderboard.

        Args:
            limit: Number of top records to display
        """
        print("\n" + "=" * 80)
        print("🏆 LEADERBOARD - TOP PLAYERS 🏆")
        print("=" * 80)

        if not self.records:
            print("\nNo games played yet. Be the first to set a record!\n")
            return

        top_records = self.get_top_records(limit)

        print(f"\n{'Rank':<6} {'Player':<20} {'Guesses':<10} {'Time':<12} {'Date':<20}")
        print("-" * 80)

        for idx, record in enumerate(top_records, 1):
            rank = f"#{idx}"
            player = record['player_name'][:19]
            guesses = str(record['guesses'])
            time_str = f"{record['time_taken']:.2f}s"
            date = record['date_display']

            print(f"{rank:<6} {player:<20} {guesses:<10} {time_str:<12} {date:<20}")

        print("=" * 80)

    def display_history(self, limit: int = 20):
        """
        Display recent game history.

        Args:
            limit: Number of recent games to display
        """
        print("\n" + "=" * 80)
        print("📜 GAME HISTORY - RECENT GAMES 📜")
        print("=" * 80)

        if not self.records:
            print("\nNo games played yet.\n")
            return

        recent_records = self.get_all_records()[:limit]

        print(f"\n{'Player':<20} {'Guesses':<10} {'Time':<12} {'Date':<20}")
        print("-" * 80)

        for record in recent_records:
            player = record['player_name'][:19]
            guesses = str(record['guesses'])
            time_str = f"{record['time_taken']:.2f}s"
            date = record['date_display']

            print(f"{player:<20} {guesses:<10} {time_str:<12} {date:<20}")

        total_games = len(self.records)
        if total_games > limit:
            print(f"\n... and {total_games - limit} more game(s)")

        print("=" * 80)

    def get_statistics(self) -> Dict:
        """
        Get overall game statistics.

        Returns:
            Dictionary containing statistics
        """
        if not self.records:
            return {}

        total_games = len(self.records)
        avg_guesses = sum(r['guesses'] for r in self.records) / total_games
        avg_time = sum(r['time_taken'] for r in self.records) / total_games
        best_game = min(self.records, key=lambda x: (x['guesses'], x['time_taken']))

        return {
            'total_games': total_games,
            'average_guesses': round(avg_guesses, 2),
            'average_time': round(avg_time, 2),
            'best_game': best_game
        }
