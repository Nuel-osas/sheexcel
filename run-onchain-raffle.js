// Script to run the on-chain raffle using the Sui CLI
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PACKAGE_ID = '0x0b56beff63a11614a1aa1ce6b925cbd72bd7ce7cdfad0c32c7ad8fe1cff0f9c7';
const WINNER_COUNT = 15;

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

// Function to execute Sui CLI commands
function executeSuiCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    if (error.stdout) console.error(`stdout: ${error.stdout}`);
    if (error.stderr) console.error(`stderr: ${error.stderr}`);
    throw error;
  }
}

// Function to find the RaffleCap object ID
function findRaffleCap() {
  console.log('Finding RaffleCap object...');
  
  // Use the specific RaffleCap object ID we already know from the package publish output
  const raffleCapId = "0xcefae7b71afaac72cc806fe59b93c25770dd776e23f205bd9993dc81857a5642";
  console.log(`Using known RaffleCap ID: ${raffleCapId}`);
  return raffleCapId;
}

// Function to find the NFT owner registry object ID
function findNFTOwnerRegistry() {
  console.log("Finding NFTOwnerRegistry object...");
  
  // Use the specific NFTOwnerRegistry object ID we already know from the package publish output
  const registryId = "0xaf1e5aa255b90f675dbcac894c8bdc251e35b0041cf8494004cf40321efd1624";
  console.log(`Using known NFTOwnerRegistry ID: ${registryId}`);
  return registryId;
}

// Main function to run the raffle
async function runRaffle() {
  try {
    // Step 1: Find the RaffleCap object ID
    const raffleCapId = findRaffleCap();
    console.log(`Found RaffleCap: ${raffleCapId}`);

    // Step 2: Find or create the NFTOwnerRegistry
    let registryId;
    try {
      registryId = findNFTOwnerRegistry();
      console.log(`Found existing NFTOwnerRegistry: ${registryId}`);
    } catch (error) {
      console.log('NFTOwnerRegistry not found, it will be created during initialization');
      console.log('Publishing the package to create the registry...');
      
      // Publish the package to create the registry
      const publishCommand = `cd ${path.join(__dirname, 'she_excel')} && sui client publish --gas-budget 50000000`;
      const publishOutput = executeSuiCommand(publishCommand);
      console.log('Package published successfully!');
      console.log(publishOutput);
      
      // Try to find the registry again after publishing
      try {
        registryId = findOwnerRegistry();
        console.log(`Found NFTOwnerRegistry after publishing: ${registryId}`);
      } catch (innerError) {
        console.log('Still cannot find NFTOwnerRegistry. Please check the package ID and try again.');
        return;
      }
    }
    
    if (!registryId) {
      console.log('Cannot proceed without a registry. Please make sure the registry is created first.');
      return;
    }
    
    // Step 3: Initialize the registry with all 47 owner addresses
    console.log('Initializing owner registry with all 47 addresses...');
    const ownersArg = owners.map(addr => `"${addr}"`).join(',');
    const initCommand = `sui client call --package ${PACKAGE_ID} --module raffle --function initialize_owner_registry --args ${raffleCapId} ${registryId} "[${ownersArg}]" --gas-budget 50000000`;
    
    try {
      const initOutput = executeSuiCommand(initCommand);
      console.log('Registry initialization successful!');
      console.log(initOutput);
    } catch (error) {
      console.log('Registry initialization failed. It might already be initialized.');
      console.error(error.message);
    }
    
    // Step 4: Finalize the registry
    console.log('Finalizing owner registry...');
    const finalizeCommand = `sui client call --package ${PACKAGE_ID} --module raffle --function finalize_owner_registry --args ${raffleCapId} ${registryId} --gas-budget 50000000`;
    
    try {
      const finalizeOutput = executeSuiCommand(finalizeCommand);
      console.log('Registry finalization successful!');
      console.log(finalizeOutput);
    } catch (error) {
      console.log('Registry finalization failed. It might already be finalized.');
      console.error(error.message);
    }
    
    // Step 5: Run the on-chain raffle
    console.log(`Running on-chain raffle to select ${WINNER_COUNT} winners...`);
    const raffleCommand = `sui client call --package ${PACKAGE_ID} --module raffle --function run_raffle --args ${raffleCapId} ${registryId} ${WINNER_COUNT} --gas-budget 50000000`;
    
    const raffleOutput = executeSuiCommand(raffleCommand);
    console.log('Raffle completed successfully!');
    console.log(raffleOutput);
    
    // Step 6: Parse the transaction response to find the winners
    console.log('Raffle transaction completed. The winners have been selected and stored on-chain.');
    console.log('You can now view the winners in the web frontend.');
    
  } catch (error) {
    console.error('Error running the raffle:', error);
  }
}

// Run the raffle
runRaffle();
