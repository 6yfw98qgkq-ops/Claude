# 🎮 High-Low Number Guessing Game

A fun and challenging number guessing game where you try to guess a randomly selected number between 1 and 100,000 in 10 guesses or less!

## 📋 Features

- **Wide Range**: Guess numbers from 1 to 100,000
- **Limited Attempts**: You have 10 guesses to find the secret number
- **Real-time Feedback**: Get instant feedback if your guess is too high or too low
- **Performance Tracking**: Track your number of guesses and time taken
- **Leaderboard**: Compete against yourself and others with a persistent leaderboard
- **Game History**: View all past games with detailed statistics
- **Timed Games**: See how quickly you can guess the number

## 🚀 Getting Started

### Prerequisites

- Python 3.6 or higher

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd Claude
```

2. Make the game executable (optional):
```bash
chmod +x high_low_game.py
```

### Running the Game

Simply run the main game file:

```bash
python3 high_low_game.py
```

Or if you made it executable:

```bash
./high_low_game.py
```

## 🎯 How to Play

1. **Start the Game**: Run the game and enter your name
2. **Make Your Guess**: Enter a number between 1 and 100,000
3. **Get Feedback**: You'll be told if your guess is too high or too low
4. **Keep Trying**: You have up to 10 guesses to find the number
5. **Win**: Guess correctly to win and save your score to the leaderboard!

## 📊 Game Features

### Leaderboard

The leaderboard ranks players based on:
1. **Number of Guesses** (fewer is better)
2. **Time Taken** (faster is better, as a tiebreaker)

Access the leaderboard from the main menu after playing a game.

### Game History

View all past games sorted by most recent. The history shows:
- Player name
- Number of guesses used
- Time taken
- Date and time of the game

### Statistics Tracked

For each game, the following information is recorded:
- **Player Name**: Your chosen username
- **Guesses**: How many attempts it took
- **Time Taken**: Duration in seconds from start to finish
- **Timestamp**: When the game was played

## 📁 Files

- `high_low_game.py` - Main game logic and interface
- `leaderboard.py` - Leaderboard and history management
- `game_history.json` - Persistent storage for game records (auto-created)
- `README.md` - This file

## 🎲 Game Strategy

With a range of 1-100,000 and 10 guesses, the optimal strategy is to use binary search:

1. Start with 50,000
2. Based on the feedback, eliminate half the remaining range
3. Continue halving the range with each guess

Mathematically, you can find any number in this range within 17 guesses using binary search (log₂(100,000) ≈ 16.6). With 10 guesses, you'll need both strategy and a bit of luck!

## 🏆 Example Gameplay

```
==============================================================
🎮 Welcome to High-Low Number Guessing Game! 🎮
==============================================================

I'm thinking of a number between 1 and 100,000.
You have 10 guesses to find it!

Enter your name: Alice

Guess #1: 50000
Too low! You have 9 guess(es) remaining.

Guess #2: 75000
Too high! You have 8 guess(es) remaining.

Guess #3: 62500
Too low! You have 7 guess(es) remaining.

Guess #4: 68750
🎉 Correct! You guessed it in 4 guess(es) and 12.34 seconds!

✨ Your score has been added to the leaderboard! ✨
```

## 💾 Data Storage

Game records are stored in `game_history.json` in JSON format. This file is created automatically on the first game and persists across sessions.

Example record structure:
```json
{
  "player_name": "Alice",
  "guesses": 4,
  "time_taken": 12.34,
  "timestamp": "2026-01-24T12:34:56",
  "date_display": "2026-01-24 12:34:56"
}
```

## 🤝 Contributing

Feel free to fork this repository and submit pull requests with improvements!

## 📝 License

This project is open source and available for educational purposes.

## 🎉 Have Fun!

Good luck with your guessing! Can you make it to the top of the leaderboard?
