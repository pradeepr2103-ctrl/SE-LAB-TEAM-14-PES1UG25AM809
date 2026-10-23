# Number Guessing Repair Lab

This project is an interactive number deduction game using **Pygame**. It introduces students to string-to-integer parsing safety, boundary and input sanitization, dynamic range feedback, and text-input UI widgets within an object-oriented codebase.
---

## What's Provided

A working Number Guessing game with:

- A secret number generated randomly between 1 and 100 on game initialization and resets
- A custom `TextBox` input component handling digit typing, backspace, and active selection states
- Interactive guess submission via the `Return` / `Enter` key or clicking the `SUBMIT` button
- Dynamic hint feedback (`TOO LOW!`, `TOO HIGH!`, or `CORRECT!`) along with an attempt counter
- Win state handling and restart capability via the `R` key

It has **one deliberate bug** and **three optional features** left as tasks to implement. You are expected to **analyze**, **interact with an AI assistant**, and **complete/fix** the game to make it fully functional and more interesting.

### **Use an LLM (e.g. ChatGPT or Claude) as your debugging and pair-programming partner for this lab.**
---

## Getting Started

### Setup

1. Make sure you have Python 3.10+ installed.
2. Install dependencies:

```bash
pip install pygame
```

3. Run the game:

```bash
python main.py
```

**Controls:** Type digits into the text box and press Return (or click SUBMIT) to guess. Press R to start a new game after winning.


## Tasks to Complete

Each task must be completed using an iterative process involving LLM suggestions and your critical code review.

### Task 1: Fix the empty input crash bug

Submitting a guess without typing any numbers causes the application to crash immediately with a value parsing error. Ensure that empty submissions are safely handled with a warning prompt without terminating the program or consuming an attempt.

### Task 2: Implement dynamic search range display

The game currently only provides one-off high or low indicators without keeping track of the narrowing search window. Track the valid minimum and maximum boundaries established by previous guesses and display the narrowed range on screen to guide the player's next move

### Task 3: Implement Recent Guess History Tracker

Players have no visual record of previous numbers they have already tested. Add a history log panel displaying the last several guesses alongside color-coded directional indicators showing whether each was too high or too low.

### Task 4: Implement maximum Attempts Constraint & Failure State

Players currently enjoy unlimited guesses, removing stakes from deduction. Introduce a strict attempt limit that triggers a Game Over screen revealing the hidden number if the player runs out of tries.

---

## Expected Behavior

- Typing numbers into the text box and pressing Return or clicking SUBMIT registers a guess.
- Submitting an empty input box displays a warning message without crashing the game.
- The game accurately indicates whether the guess is too high or too low, incrementing the attempt count each time.
- Guessing the exact number displays the victory message and unlocks the R key restart option.
---

## Folder Structure

```
number_guess/
├── game/
│   ├── game_engine.py
│   └── text_box.py
├── main.py
└── README.md
```

## Submission Checklist

Submission is only the following three things:

- [] A 10-second video of gameplay **before** your changes, showing the bug/broken behavior
- [] A 10-second video of gameplay **after** your changes, showing the bug fixed and the new features working
- [] The Chat/LLM used page link, with the complete chat history
