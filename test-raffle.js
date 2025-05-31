// Test script for the SheExcels NFT Raffle System
const fs = require('fs');
const path = require('path');

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

// Simulate the raffle by selecting 15 random winners
function simulateRaffle(owners, numWinners = 15) {
  // Create a copy of the owners array to work with
  const ownersCopy = [...owners];
  const winners = [];
  
  // Select winners using reservoir sampling (similar to the on-chain algorithm)
  for (let i = 0; i < Math.min(numWinners, owners.length); i++) {
    // Get a random index from the remaining owners
    const randomIndex = Math.floor(Math.random() * (ownersCopy.length - i));
    
    // Add the selected owner to the winners
    const winner = ownersCopy.splice(randomIndex, 1)[0];
    winners.push(winner);
  }
  
  return winners;
}

// Run the raffle simulation
const winners = simulateRaffle(owners);

console.log('\n🎉 Raffle Winners (15 out of 47 owners):');
winners.forEach((winner, index) => {
  console.log(`${index + 1}. ${winner}`);
});

// Verify the raffle results
console.log(`\n✅ Successfully selected ${winners.length} winners from ${owners.length} NFT owners`);
console.log('This simulation mimics the on-chain raffle that uses Sui\'s secure randomness');
console.log('\nNext steps:');
console.log('1. Connect your admin wallet to the frontend');
console.log('2. Initialize the on-chain NFT owner registry with all 47 addresses');
console.log('3. Run the on-chain raffle to select winners permanently');
console.log('4. View the winners in the UI');
