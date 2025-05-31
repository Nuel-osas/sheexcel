// Simple script to verify the owners list
const fs = require('fs');
const path = require('path');

// Read the owners.ts file
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
const ownersArray = ownersArrayString
  .split(',')
  .map(line => {
    // Extract the address from the line
    const match = line.match(/"(0x[a-f0-9]+)"/);
    return match ? match[1] : null;
  })
  .filter(Boolean); // Remove null values

console.log(`Found ${ownersArray.length} unique NFT owner addresses:`);
ownersArray.forEach((owner, index) => {
  console.log(`${index + 1}. ${owner}`);
});

// Verify we have exactly 47 owners
if (ownersArray.length === 47) {
  console.log('\n✅ Success! All 47 NFT owner addresses are correctly loaded.');
} else {
  console.error(`\n❌ Error: Expected 47 NFT owner addresses, but found ${ownersArray.length}.`);
}

// Check for duplicates
const uniqueOwners = new Set(ownersArray);
if (uniqueOwners.size !== ownersArray.length) {
  console.error(`\n⚠️ Warning: Found ${ownersArray.length - uniqueOwners.size} duplicate addresses.`);
} else {
  console.log('\n✅ No duplicate addresses found.');
}
