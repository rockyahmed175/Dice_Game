// Import required modules
const crypto = require('crypto');        
const readline = require('readline');    

// Get command-line arguments (each die)
const args = process.argv.slice(2);
const DICE_FACES = 6; // Each die must have 6 faces

// Check if at least 3 dice are provided
if (args.length < 3) {
  console.log("Error: You must provide at least 3 dice.");
  console.log("Example: node dice_game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
  process.exit(1);
}

// Parse the dice input and validate each die
const dice = [];
for (const arg of args) {
  const faces = arg.split(',').map(x => parseInt(x.trim(), 10));
  if (faces.length !== DICE_FACES || faces.some(isNaN)) {
    console.log("Error: Each die must contain 6 valid integers.");
    process.exit(1);
  }
  dice.push(faces);
}

// Set up user input interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate HMAC using SHA3 to prove fairness
function hmacSha3(key, msg) {
  return crypto.createHmac('sha3-256', key).update(msg).digest('hex');
}

// Helper function to ask user input
async function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Secure random number generation with fairness (HMAC + user input)
async function fairRandom(max, label) {
  const key = crypto.randomBytes(32); // 256-bit secret key
  const compNum = await crypto.randomInt(max); // Computer picks a secret number
  const hmac = hmacSha3(key, compNum.toString()); // Hash the number

  console.log(`\n[${label}] Computer committed number HMAC: ${hmac}`);
  
  let userNum;
  while (true) {
    const input = await ask(`Enter your number (0-${max - 1}): `);
    userNum = parseInt(input.trim(), 10);
    if (!isNaN(userNum) && userNum >= 0 && userNum < max) break;
    console.log(`Invalid input. Enter an integer between 0 and ${max - 1}.`);
  }

  // Final random value based on both computer and user input
  const result = (compNum + userNum) % max;

  console.log(`Computer secret number: ${compNum}`);
  console.log(`Computer secret key: ${key.toString('hex')}`);
  console.log(`You entered: ${userNum}`);
  console.log(`Result = (computer + user) mod ${max} = ${result}\n`);

  return result;
}

// Show a table of win probabilities between all dice
function showProbabilities() {
  const n = dice.length;
  const header = ['Dice'].concat(Array.from({ length: n }, (_, i) => i.toString()));
  const rows = [];

  for (let i = 0; i < n; i++) {
    const row = [i.toString()];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push('-'); // Same die, skip
      } else {
        let winCount = 0;
        const d1 = dice[i];
        const d2 = dice[j];
        for (let a of d1) {
          for (let b of d2) {
            if (a > b) winCount++;
          }
        }
        const total = DICE_FACES * DICE_FACES;
        const percent = ((winCount / total) * 100).toFixed(1);
        row.push(percent + '%');
      }
    }
    rows.push(row);
  }

  // Calculate column widths for table formatting
  const colWidths = header.map((h, i) =>
    Math.max(h.length, ...rows.map(r => r[i].length))
  );

  function pad(str, len) {
    return str + ' '.repeat(len - str.length);
  }

  // Print the ASCII table
  let line = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  console.log(line);
  console.log(
    '|' + header.map((h, i) => ' ' + pad(h, colWidths[i]) + ' ').join('|') + '|'
  );
  console.log(line);
  for (const r of rows) {
    console.log(
      '|' + r.map((c, i) => ' ' + pad(c, colWidths[i]) + ' ').join('|') + '|'
    );
  }
  console.log(line);
}

// Main game logic
async function main() {
  console.log("Dice configurations:");
  dice.forEach((d, i) => console.log(`Die ${i}: ${d.join(', ')}`));

  // Decide who goes first using fair random method
  const firstMove = await fairRandom(2, 'First move');
  const userStarts = firstMove === 0;
  console.log(userStarts ? "You start first." : "Computer starts first.");

  while (true) {
    // Main menu
    console.log("\nMenu:\n0 - Exit\n1 - Help\n2 - Play");
    const choice = await ask("Choose an option: ");
    if (choice.trim() === '0') break;

    if (choice.trim() === '1') {
      showProbabilities();
      continue;
    }

    if (choice.trim() === '2') {
      // User chooses a die
      console.log("Choose your die:");
      dice.forEach((d, i) => console.log(`${i}: ${d.join(', ')}`));
      console.log(`${dice.length}: Cancel`);

      const userInput = await ask(`Select your die (0-${dice.length}): `);
      const userDie = parseInt(userInput.trim(), 10);
      if (isNaN(userDie) || userDie < 0 || userDie > dice.length) {
        console.log("Invalid selection.");
        continue;
      }
      if (userDie === dice.length) {
        console.log("Returning to menu.");
        continue;
      }

      // Computer fairly chooses a different die
      let compDie;
      do {
        compDie = await fairRandom(dice.length, 'Computer die choice');
      } while (compDie === userDie);

      console.log(`Computer chose die: ${compDie}`);

      // Both roll their dice
      const userRoll = await fairRandom(DICE_FACES, 'Your roll');
      const compRoll = await fairRandom(DICE_FACES, 'Computer roll');

      const userFace = dice[userDie][userRoll];
      const compFace = dice[compDie][compRoll];

      console.log(`You rolled: ${userFace}`);
      console.log(`Computer rolled: ${compFace}`);

      // Show who wins
      if (userFace > compFace) console.log("You win!");
      else if (userFace < compFace) console.log("Computer wins!");
      else console.log("It's a draw!");
    } else {
      console.log("Unknown option.");
    }
  }

  rl.close();
  console.log("Game ended.");
}

main();
