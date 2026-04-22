# AI Agent Project Prompt — BUILD

IMPORTANT:
- Only focus on building the application
- Assume a clean, working implementation is expected
- Include a README with clear instructions on how to run the app

---

## Goal
Create a browser-based word guessing game that allows users to guess a hidden 5 letter word within a limit number of attempts.

---

## Technical Requirements
- Use HTML, CSS, and vanilla JavaScript only
- Must run by opening index.html in a browser
- No frameworks or external dependencies
- Keep the implementation simple and functional

---

## Features
The application must include:

- A clear user interface
- Instructions visible to the user
- At least 2 interactive features

Custom Features:
- Feature 1: Restart game button that allows users to start a new game with a random word. 
- Feature 2: Color coded feedback system that changes tile colors (green, yellow, gray) based on letter accuracy. 

---

## Behavior & Logic
- User action: The user types a 5 letter word into the input button and clicks the submit button. 
- System response: The game checks the guess against the hidden word and updates the board with colors:
    Green: correct letters in the correct position
    Yellow: correct letters in the wrong position
    Gray: letter not in word 
- Success condition: The user correctly guesses the 5 letter word before using all 6 attempts. 

---

## File Structure
Generate exactly these files:

- index.html
- styles.css
- script.js
- README.md

Ensure:
- All files are properly linked
- Code runs without console errors

---

## README Requirements
Create a README.md that includes:

- Project title
- Description of what the app does
- Features list
- Step-by-step instructions to run the app
- Requirements (browser, any dependencies if used)
- File structure overview


---

## Output Format
Provide:

1. Code for each file in separate sections
2. README.md
3. A short explanation of how the app works