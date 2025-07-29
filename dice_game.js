const crypto = require('crypto');
const readline = require('readline');

const args = process.argv.slice(2);
const DICE_FACES = 6;

if (args.length < 3) {
  console.log("Error: You must provide at least 3 dice.");
  console.log("Example: node dice_game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
  process.exit(1);
}

const dice = [];
for (const arg of args) {
  const faces = arg.split(',').map(x => parseInt(x.trim(), 10));
  if (faces.length !== DICE_FACES || faces.some(isNaN)) {
    console.log("Error: Each dice must have exactly 6 integers, comma separated.");
    console.log("Example: 2,2,4,4,9,9");
    process.exit(1);
  }
  dice.push(faces);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hmacSha3(key, msg) {
  return crypto.createHmac('sha3-256', key).update(msg).digest('hex');
}

function secureRandomInt(max) {
  while (true) {
    const buf = crypto.randomBytes(4);
    const num = buf.readUInt32BE(0);
    if (num < 0xFFFFFFFF - (0xFFFFFFFF % max)) {
      return num % max;
    }
  }
}

async function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function fairRandom(max, label) {
  const key = crypto.randomBytes(32);
  const compNum = secureRandomInt(max);
  const hmac = hmacSha3(key, compNum.toString());

  console.log(`\n[${label}] Computer committed number HMAC: ${hmac}`);
  let userNum;
  while (true) {
    const input = await ask(`Enter your number (0-${max - 1}): `);
    userNum = parseInt(input.trim(), 10);
    if (!isNaN(userNum) && userNum >= 0 && userNum < max) break;
    console.log(`Invalid input. Enter an integer between 0 and ${max - 1}.`);
  }

  const result = (compNum + userNum) % max;

  console.log(`Computer secret number: ${compNum}`);
  console.log(`Computer secret key: ${key.toString('hex')}`);
  console.log(`You entered: ${userNum}`);
  console.log(`Result (computer + user) mod ${max} = ${result}\n`);

  return result;
}

function compareDice(d1, d2) {
  let win = 0, lose = 0;
  for (let a of d1) {
    for (let b of d2) {
      if (a > b) win++;
      else if (a < b) lose++;
    }
  }
  if (win > lose) return 1;
  if (lose > win) return -1;
  return 0;
}

function showProbabilities() {
  const n = dice.length;
  const header = ['Dice'].concat(Array.from({length: n}, (_, i) => i.toString()));
  const rows = [];

  for (let i = 0; i < n; i++) {
    const row = [i.toString()];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push('-');
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

  // Print table
  const colWidths = header.map((h, i) =>
    Math.max(h.length, ...rows.map(r => r[i].length))
  );

  function pad(str, len) {
    return str + ' '.repeat(len - str.length);
  }

  let line = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  console.log(line);
  console.log(
    '|' +
    header.map((h, i) => ' ' + pad(h, colWidths[i]) + ' ').join('|') +
    '|'
  );
  console.log(line);
  for (const r of rows) {
    console.log(
      '|' +
      r.map((c, i) => ' ' + pad(c, colWidths[i]) + ' ').join('|') +
      '|'
    );
  }
  console.log(line);
}

async function main() {
  console.log("Dice configurations:");
  dice.forEach((d, i) => console.log(`Die ${i}: ${d.join(', ')}`));

  const firstMove = await fairRandom(2, 'First move');
  const userStarts = firstMove === 0;
  console.log(userStarts ? "You start first." : "Computer starts first.");

  while (true) {
    console.log("\nMenu:\n0 - Exit\n1 - Help\n2 - Play");

    const choice = await ask("Choose an option: ");
    if (choice.trim() === '0') break;

    if (choice.trim() === '1') {
      showProbabilities();
      continue;
    }

    if (choice.trim() === '2') {
      console.log("Choose your die:");
      dice.forEach((d, i) => console.log(`${i}: ${d.join(', ')}`));
      console.log(`${dice.length}: Exit`);

      const userDieInput = await ask(`Select your die (0-${dice.length}): `);
      const userDieIndex = parseInt(userDieInput.trim(), 10);
      if (isNaN(userDieIndex) || userDieIndex < 0 || userDieIndex > dice.length) {
        console.log("Invalid die selection.");
        continue;
      }
      if (userDieIndex === dice.length) {
        console.log("Exiting to main menu.");
        continue;
      }

      let compDieIndex = await fairRandom(dice.length, 'Computer die choice');
      while (compDieIndex === userDieIndex) {
        compDieIndex = await fairRandom(dice.length, 'Computer die choice (re-roll to avoid tie)');
      }
      console.log(`Computer chose die: ${compDieIndex}`);

      const userRoll = await fairRandom(DICE_FACES, 'Your roll');
      const compRoll = await fairRandom(DICE_FACES, 'Computer roll');

      const userFace = dice[userDieIndex][userRoll];
      const compFace = dice[compDieIndex][compRoll];

      console.log(`You rolled face: ${userFace}`);
      console.log(`Computer rolled face: ${compFace}`);

      if (userFace > compFace) console.log("You win!");
      else if (userFace < compFace) console.log("Computer wins!");
      else console.log("It's a draw!");

      continue;
    }

    console.log("Unknown option. Try again.");
  }

  rl.close();
  console.log("Game ended.");
}

main();
