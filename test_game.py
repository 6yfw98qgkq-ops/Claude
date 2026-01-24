#!/usr/bin/env python3
"""
Simple automated tests for the High-Low game.
"""

import os
import json
from high_low_game import HighLowGame
from leaderboard import Leaderboard
from datetime import datetime


def test_game_basic():
    """Test basic game functionality."""
    print("Testing basic game functionality...")

    game = HighLowGame()
    game.start()

    # Test that secret number is within range
    assert HighLowGame.MIN_NUMBER <= game.secret_number <= HighLowGame.MAX_NUMBER
    print(f"✓ Secret number is within range: {game.secret_number}")

    # Test guess outside range
    message, is_correct, game_over = game.make_guess(0)
    assert not is_correct
    assert not game_over
    print("✓ Correctly rejects guess outside range")

    # Test correct guess
    correct_guess = game.secret_number
    message, is_correct, game_over = game.make_guess(correct_guess)
    assert is_correct
    assert game_over
    print("✓ Correctly identifies correct guess")

    stats = game.get_stats()
    assert stats['won'] == True
    assert stats['guesses'] == 1
    print("✓ Stats correctly recorded")

    print("✓ Basic game tests passed!\n")


def test_game_too_many_guesses():
    """Test game over after max guesses."""
    print("Testing max guesses limit...")

    game = HighLowGame()
    game.start()

    # Make 10 wrong guesses
    wrong_guess = game.secret_number + 1 if game.secret_number < HighLowGame.MAX_NUMBER else game.secret_number - 1

    for i in range(HighLowGame.MAX_GUESSES):
        message, is_correct, game_over = game.make_guess(wrong_guess)
        if i < HighLowGame.MAX_GUESSES - 1:
            assert not game_over
        else:
            assert game_over
            assert not is_correct

    print("✓ Game correctly ends after max guesses\n")


def test_high_low_feedback():
    """Test high/low feedback."""
    print("Testing high/low feedback...")

    game = HighLowGame()
    game.start()

    # Test too low
    if game.secret_number > 1:
        message, is_correct, game_over = game.make_guess(1)
        assert "low" in message.lower()
        print("✓ Correctly identifies guess as too low")

    # Test too high
    if game.secret_number < HighLowGame.MAX_NUMBER:
        message, is_correct, game_over = game.make_guess(HighLowGame.MAX_NUMBER)
        assert "high" in message.lower()
        print("✓ Correctly identifies guess as too high")

    print()


def test_leaderboard():
    """Test leaderboard functionality."""
    print("Testing leaderboard functionality...")

    # Clean up any existing test history
    if os.path.exists("game_history.json"):
        os.remove("game_history.json")

    leaderboard = Leaderboard()

    # Add test records
    leaderboard.add_record("Player1", 3, 10.5, datetime.now())
    leaderboard.add_record("Player2", 5, 15.2, datetime.now())
    leaderboard.add_record("Player3", 3, 8.7, datetime.now())

    # Test top records (should be sorted by guesses, then time)
    top_records = leaderboard.get_top_records(3)
    assert len(top_records) == 3
    assert top_records[0]['player_name'] == "Player3"  # 3 guesses, 8.7s
    assert top_records[1]['player_name'] == "Player1"  # 3 guesses, 10.5s
    assert top_records[2]['player_name'] == "Player2"  # 5 guesses, 15.2s
    print("✓ Leaderboard sorting works correctly")

    # Test statistics
    stats = leaderboard.get_statistics()
    assert stats['total_games'] == 3
    print(f"✓ Statistics calculated correctly: {stats}")

    print()


def run_all_tests():
    """Run all tests."""
    print("=" * 60)
    print("Running High-Low Game Tests")
    print("=" * 60)
    print()

    try:
        test_game_basic()
        test_game_too_many_guesses()
        test_high_low_feedback()
        test_leaderboard()

        print("=" * 60)
        print("✓ All tests passed successfully!")
        print("=" * 60)
        return True

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
