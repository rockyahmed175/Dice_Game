🎲 Fair Dice Game (Node.js)
This is a secure, interactive command-line dice game built with Node.js, featuring:

Fair randomness using HMAC (SHA3-256)

Custom dice configurations

Non-transitive dice logic

Probability comparison table

User vs Computer gameplay

The game is designed to ensure that neither the user nor the computer can cheat, thanks to HMAC-based commitment to hidden random values.

🚀 Features
✅ Launch with 3 or more custom 6-sided dice

🔐 Fair random number generation with HMAC validation

🧠 Computer chooses its die after committing to a secret number

🎮 Fully interactive gameplay (user vs computer)

📊 View help table showing pairwise win probabilities

❌ Graceful error handling for invalid input

📦 Requirements
Node.js v12 or later

🧪 Example Usage
Start game with 3 non-transitive dice:
bash
Copy
Edit
node dice_game.js 2,2,4,4,9,9 1,1,6,6,8,8 3,3,5,5,7,7
Start game with 4 identical dice:
bash
Copy
Edit
node dice_game.js 1,2,3,4,5,6 1,2,3,4,5,6 1,2,3,4,5,6 1,2,3,4,5,6
📋 Menu Options
0: Exit

1: View help table (win probabilities between dice)

2: Play a game (user vs computer)

🔐 How Fairness Works
The game uses HMAC-SHA3-256 to commit the computer’s choice before the user responds. This proves that the computer didn’t change its number after seeing the user’s input.

Steps:

Computer generates a random number and secret key

Displays HMAC of the number using the key

User enters their number

Computer reveals the secret and key

Both inputs are combined: (compNum + userNum) % max

Used in:

Who plays first

Computer die selection

Dice face rolls

❌ Error Handling Examples
The game handles and exits with an error message for:

No dice provided

Less than 3 dice

Dice with more or less than 6 values

Dice with non-integer values
