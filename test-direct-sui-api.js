// Test script for fetching NFT owners using Sui JSON-RPC API directly
const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { bcs } = require('@mysten/sui.js/bcs');

async function testFetchNFTOwners() {
  console.log('Testing NFT owner fetching using direct Sui API...');
  
  // Create a Sui client
  const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
  
  // Define the NFT type - using the exact type provided
  const nftType = '0xcbb141ec2c86792fc25af511f0bc610fe4d8a4f1520068b281e57d336d716893::she_excel::SheExcelsNFT';
  const packageId = '0xcbb141ec2c86792fc25af511f0bc610fe4d8a4f1520068b281e57d336d716893';
  
  console.log('NFT Type:', nftType);
  console.log('Package ID:', packageId);
  
  // We'll use a set to store unique owner addresses
  const ownersSet = new Set();
  let foundAnyNFTs = false;
  
  try {
    // Approach 1: Query transaction blocks that interacted with the NFT package with pagination
    console.log('\nApproach 1: Querying transaction blocks that interacted with the NFT package...');
    
    let hasMoreTxs = true;
    let cursor = null;
    let txCount = 0;
    
    while (hasMoreTxs && txCount < 5) { // Limit to 5 pages to avoid too many requests
      txCount++;
      console.log(`Fetching transaction page ${txCount}...`);
      
      const txBlocks = await suiClient.queryTransactionBlocks({
        filter: { InputObject: packageId },
        options: { showEffects: true, showInput: true, showObjectChanges: true },
        limit: 100,
        cursor: cursor
      });
      
      console.log(`Found ${txBlocks.data.length} transaction blocks on page ${txCount}`);
      
      // Process each transaction to find NFT creations
      for (const tx of txBlocks.data) {
        if (tx.objectChanges) {
          for (const change of tx.objectChanges) {
            if (change.type === 'created' && change.objectType === nftType) {
              console.log(`Found NFT creation in transaction ${tx.digest}`);
              if (change.owner && typeof change.owner === 'object' && 'AddressOwner' in change.owner) {
                console.log(`Found owner: ${change.owner.AddressOwner}`);
                ownersSet.add(change.owner.AddressOwner);
                foundAnyNFTs = true;
              }
            }
          }
        }
      }
      
      // Check if there are more results to fetch
      if (txBlocks.hasNextPage && txBlocks.nextCursor) {
        cursor = txBlocks.nextCursor;
      } else {
        hasMoreTxs = false;
      }
    }
    
    // Approach 2: Query mint transactions specifically with pagination
    console.log('\nApproach 2: Querying mint transactions specifically...');
    
    hasMoreTxs = true;
    cursor = null;
    txCount = 0;
    
    while (hasMoreTxs && txCount < 5) { // Limit to 5 pages to avoid too many requests
      txCount++;
      console.log(`Fetching mint transaction page ${txCount}...`);
      
      const mintTxs = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: packageId,
            module: 'she_excel',
            function: 'mint'
          }
        },
        options: {
          showEffects: true,
          showInput: true,
          showObjectChanges: true,
        },
        limit: 100,
        cursor: cursor
      });
      
      console.log(`Found ${mintTxs.data.length} mint transactions on page ${txCount}`);
      
      // Process each mint transaction to find NFT owners
      for (const tx of mintTxs.data) {
        console.log(`Analyzing mint transaction ${tx.digest}`);
        
        // Check object changes for our NFT type
        if (tx.objectChanges) {
          for (const change of tx.objectChanges) {
            if (change.type === 'created' && change.objectType && change.objectType === nftType) {
              console.log(`Found NFT creation: ${change.objectType}`);
              if (change.owner && typeof change.owner === 'object' && 'AddressOwner' in change.owner) {
                console.log(`Found owner: ${change.owner.AddressOwner}`);
                ownersSet.add(change.owner.AddressOwner);
                foundAnyNFTs = true;
              }
            }
          }
        }
        
        // Also check the sender as they might be the minter
        if (tx.transaction?.data?.sender) {
          console.log(`Found sender/minter: ${tx.transaction.data.sender}`);
          ownersSet.add(tx.transaction.data.sender);
          foundAnyNFTs = true;
        }
      }
      
      // Check if there are more results to fetch
      if (mintTxs.hasNextPage && mintTxs.nextCursor) {
        cursor = mintTxs.nextCursor;
      } else {
        hasMoreTxs = false;
      }
    }
    
    // Approach 3: Query events related to minting with pagination
    console.log('\nApproach 3: Querying events related to minting...');
    
    hasMoreTxs = true;
    cursor = null;
    txCount = 0;
    
    while (hasMoreTxs && txCount < 5) { // Limit to 5 pages to avoid too many requests
      txCount++;
      console.log(`Fetching events page ${txCount}...`);
      
      const events = await suiClient.queryEvents({
        query: {
          MoveModule: {
            package: packageId,
            module: 'she_excel'
          }
        },
        limit: 100,
        cursor: cursor
      });
      
      console.log(`Found ${events.data.length} events on page ${txCount}`);
      
      // Process each event to find NFT owners
      for (const event of events.data) {
        console.log(`Analyzing event ${event.id.txDigest}`);
        if (event.sender) {
          console.log(`Found event sender: ${event.sender}`);
          ownersSet.add(event.sender);
          foundAnyNFTs = true;
        }
      }
      
      // Check if there are more results to fetch
      if (events.hasNextPage && events.nextCursor) {
        cursor = events.nextCursor;
      } else {
        hasMoreTxs = false;
      }
    }
    
    // Approach 4: Query all objects of the NFT type directly
    console.log('\nApproach 4: Querying all objects of the NFT type directly...');
    
    hasMoreTxs = true;
    cursor = null;
    txCount = 0;
    
    while (hasMoreTxs && txCount < 5) { // Limit to 5 pages to avoid too many requests
      txCount++;
      console.log(`Fetching NFT objects page ${txCount}...`);
      
      const objects = await suiClient.queryObjects({
        filter: {
          StructType: nftType
        },
        options: {
          showContent: true,
          showOwner: true
        },
        limit: 100,
        cursor: cursor
      });
      
      console.log(`Found ${objects.data.length} NFT objects on page ${txCount}`);
      
      // Process each NFT object to find its owner
      for (const obj of objects.data) {
        if (obj.owner && typeof obj.owner === 'object' && 'AddressOwner' in obj.owner) {
          console.log(`Found NFT with ID ${obj.objectId} owned by: ${obj.owner.AddressOwner}`);
          ownersSet.add(obj.owner.AddressOwner);
          foundAnyNFTs = true;
        }
      }
      
      // Check if there are more results to fetch
      if (objects.hasNextPage && objects.nextCursor) {
        cursor = objects.nextCursor;
      } else {
        hasMoreTxs = false;
      }
    }
    
  } catch (err) {
    console.error('Error querying Sui blockchain:', err);
  }
  
  // Fallback test addresses if we didn't find any NFT owners
  if (!foundAnyNFTs || ownersSet.size === 0) {
    console.log('No NFT owners found, adding fallback test addresses');
    ownersSet.add('0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    ownersSet.add('0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');
  }
  
  // Convert the set to an array
  const uniqueOwners = Array.from(ownersSet);
  console.log(`\nTotal unique NFT owners found: ${uniqueOwners.length}`);
  console.log('NFT Owners:', uniqueOwners);
  
  return uniqueOwners;
}

// Run the test
testFetchNFTOwners()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
