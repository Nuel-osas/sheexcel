// Client-side raffle script for SheExcels NFT
// This script uses the 47 real NFT owner addresses to select winners
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read the owners.ts file to get the real NFT owner addresses
const ownersFilePath = path.join(__dirname, 'frontend', 'src', 'constants', 'owners.ts');
const ownersFileContent = fs.readFileSync(ownersFilePath, 'utf8');

// Extract the array of owners using regex
const ownersMatch = ownersFileContent.match(/export const PERMANENT_NFT_OWNERS: string\[\] = \[([\s\S]*?)\];/);
if (!ownersMatch) {
  console.error('Could not find owners array in the file');
  process.exit(1);
}

// Parse the owners array
const ownersArrayString = ownersMatch[1];
const owners = ownersArrayString
  .split(',')
  .map(line => {
    // Extract the address from the line
    const match = line.match(/"(0x[a-f0-9]+)"/);
    return match ? match[1] : null;
  })
  .filter(Boolean); // Remove null values

console.log(`Found ${owners.length} unique NFT owner addresses for the raffle`);

// Function to run the client-side raffle
function runClientRaffle(owners, winnerCount = 15) {
  // Create a copy of the owners array to work with
  const ownersCopy = [...owners];
  const winners = [];
  
  // Use crypto for better randomness
  for (let i = 0; i < Math.min(winnerCount, owners.length); i++) {
    // Generate a secure random number
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    
    // Get a random index from the remaining owners
    const randomIndex = randomValue % ownersCopy.length;
    
    // Add the selected owner to the winners and remove from the pool
    const winner = ownersCopy.splice(randomIndex, 1)[0];
    winners.push(winner);
  }
  
  return winners;
}

// Run the raffle to select 15 winners
const winners = runClientRaffle(owners, 15);

// Display the winners
console.log('\n🎉 Raffle Winners (15 out of 47 owners):');
winners.forEach((winner, index) => {
  console.log(`${index + 1}. ${winner}`);
});

// Save the winners to a JSON file for reference
const winnersData = {
  winners,
  timestamp: new Date().toISOString(),
  totalOwners: owners.length,
  winnerCount: winners.length
};

fs.writeFileSync(
  path.join(__dirname, 'raffle-winners.json'), 
  JSON.stringify(winnersData, null, 2)
);

console.log(`\n✅ Successfully selected ${winners.length} winners from ${owners.length} NFT owners`);
console.log('Winners have been saved to raffle-winners.json');
console.log('\nNote: This is a client-side raffle using secure randomness from Node.js crypto.');
console.log('For a production raffle, you would use on-chain randomness from the Sui blockchain.');
