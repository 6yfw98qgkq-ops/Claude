#!/usr/bin/env python3
"""
High-Low Number Guessing Game
User guesses a number between 1 and 100,000 with up to 10 attempts.
"""

import random
import time
from datetime import datetime
from leaderboard import Leaderboard


class HighLowGame:
    """Main game class for the High-Low guessing game."""

    MIN_NUMBER = 1
    MAX_NUMBER = 100000
    MAX_GUESSES = 10

    def __init__(self):
        """Initialize a new game."""
        self.secret_number = random.randint(self.MIN_NUMBER, self.MAX_NUMBER)
        self.guesses_made = 0
        self.start_time = None
        self.end_time = None
        self.guess_history = []

    def start(self):
        """Start the game timer."""
        self.start_time = time.time()

    def make_guess(self, guess):
        """
        Process a player's guess.

        Args:
            guess: The number guessed by the player

        Returns:
            tuple: (result_message, is_correct, game_over)
        """
        if not isinstance(guess, int):
            return ("Please enter a valid number.", False, False)

        if guess < self.MIN_NUMBER or guess > self.MAX_NUMBER:
            return (f"Please guess a number between {self.MIN_NUMBER} and {self.MAX_NUMBER}.", False, False)

        self.guesses_made += 1
        self.guess_history.append(guess)

        if guess == self.secret_number:
            self.end_time = time.time()
            time_taken = self.end_time - self.start_time
            return (
                f"🎉 Correct! You guessed it in {self.guesses_made} guess(es) and {time_taken:.2f} seconds!",
                True,
                True
            )

        if self.guesses_made >= self.MAX_GUESSES:
            self.end_time = time.time()
            return (
                f"Game Over! You've used all {self.MAX_GUESSES} guesses. The number was {self.secret_number}.",
                False,
                True
            )

        remaining = self.MAX_GUESSES - self.guesses_made
        if guess < self.secret_number:
            return (
                f"Too low! You have {remaining} guess(es) remaining.",
                False,
                False
            )
        else:
            return (
                f"Too high! You have {remaining} guess(es) remaining.",
                False,
                False
            )

    def get_time_taken(self):
        """Get the time taken to complete the game."""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None

    def get_stats(self):
        """Get game statistics."""
        return {
            'guesses': self.guesses_made,
            'time_taken': self.get_time_taken(),
            'guess_history': self.guess_history.copy(),
            'won': self.guesses_made > 0 and self.guess_history[-1] == self.secret_number if self.guess_history else False
        }


def play_game():
    """Main game loop for interactive play."""
    print("=" * 60)
    print("🎮 Welcome to High-Low Number Guessing Game! 🎮")
    print("=" * 60)
    print(f"\nI'm thinking of a number between {HighLowGame.MIN_NUMBER:,} and {HighLowGame.MAX_NUMBER:,}.")
    print(f"You have {HighLowGame.MAX_GUESSES} guesses to find it!\n")

    player_name = input("Enter your name: ").strip()
    if not player_name:
        player_name = "Anonymous"

    game = HighLowGame()
    game.start()

    game_over = False
    won = False

    while not game_over:
        try:
            guess_input = input(f"\nGuess #{game.guesses_made + 1}: ")
            guess = int(guess_input)

            message, is_correct, game_over = game.make_guess(guess)
            print(message)

            if is_correct:
                won = True

        except ValueError:
            print("Invalid input! Please enter a number.")
        except KeyboardInterrupt:
            print("\n\nGame interrupted. Goodbye!")
            return

    if won:
        stats = game.get_stats()
        leaderboard = Leaderboard()
        leaderboard.add_record(
            player_name=player_name,
            guesses=stats['guesses'],
            time_taken=stats['time_taken'],
            timestamp=datetime.now()
        )
        print(f"\n✨ Your score has been added to the leaderboard! ✨")

    print("\n" + "=" * 60)
    show_menu(player_name)


def show_menu(last_player=None):
    """Display the main menu."""
    while True:
        print("\n📋 MENU")
        print("1. Play Again")
        print("2. View Leaderboard")
        print("3. View Game History")
        print("4. Exit")

        choice = input("\nSelect an option (1-4): ").strip()

        if choice == "1":
            play_game()
            break
        elif choice == "2":
            view_leaderboard()
        elif choice == "3":
            view_history()
        elif choice == "4":
            print("\n👋 Thanks for playing! Goodbye!\n")
            break
        else:
            print("Invalid option. Please choose 1-4.")


def view_leaderboard():
    """Display the leaderboard."""
    leaderboard = Leaderboard()
    leaderboard.display_leaderboard()


def view_history():
    """Display game history."""
    leaderboard = Leaderboard()
    leaderboard.display_history()


if __name__ == "__main__":
    try:
        play_game()
    except KeyboardInterrupt:
        print("\n\n👋 Thanks for playing! Goodbye!\n")
