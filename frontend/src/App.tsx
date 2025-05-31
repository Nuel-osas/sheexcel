import { useState, useEffect } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import NFTDisplay from "./components/NFTDisplay";
import MintForm from "./components/MintForm";
import EventBanner from "./components/EventBanner";
import RaffleSystem from "./components/RaffleSystem";
import "@mysten/dapp-kit/dist/index.css";

// NFT image IPFS URL
const NFT_IMAGE_URL =
  "https://ipfs.io/ipfs/bafybeihigtndth4zrl3hakmnvy23s6ahxb4hg237fzp7j7e73kw7sokare";

// Package ID from the deployed contract
const PACKAGE_ID =
  "0xcbb141ec2c86792fc25af511f0bc610fe4d8a4f1520068b281e57d336d716893";

function App() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const suiClient = useSuiClient();
  const [mintStatus, setMintStatus] = useState<
    "idle" | "loading" | "checking" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [mintedNFT, setMintedNFT] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false);
  
  // Style for the wallet connection container
  const walletContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0.5rem',
    marginBottom: '0.5rem'
  };
  
  // Check if user already has a SheExcels NFT when wallet connects
  useEffect(() => {
    const checkExistingNFT = async () => {
      if (!currentAccount) return;
      
      setMintStatus("checking");
      setStatusMessage("Checking if you already have a SheExcels NFT...");
      
      try {
        // Query owned objects to see if user already has an NFT from this collection
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showType: true,
            showContent: true,
          },
        });
        
        // Check if any of the objects is our NFT
        const hasNFT = ownedObjects.data.some(item => {
          return item.data && 
                 item.data.type && 
                 item.data.type.includes(`${PACKAGE_ID}::she_excel::SheExcelsNFT`);
        });
        
        if (hasNFT) {
          setHasAlreadyMinted(true);
          setStatusMessage("You have already minted a SheExcels NFT!");
          
          // Find the NFT to display it
          const nft = ownedObjects.data.find(item => 
            item.data && item.data.type && item.data.type.includes(`${PACKAGE_ID}::she_excel::SheExcelsNFT`)
          );
          
          if (nft && nft.data) {
            setMintedNFT({
              id: nft.data.objectId,
              url: NFT_IMAGE_URL,
            });
            setMintStatus("success");
          }
        } else {
          setHasAlreadyMinted(false);
          setMintStatus("idle");
          setStatusMessage("");
        }
      } catch (error) {
        console.error("Error checking for existing NFT:", error);
        setMintStatus("idle");
        setStatusMessage("");
      }
    };
    
    checkExistingNFT();
  }, [currentAccount, suiClient]);
  
  const handleMint = async (
    name: string,
    description: string,
    eventDate: string
  ) => {
    if (!currentAccount) {
      setStatusMessage("Please connect your wallet first");
      setMintStatus("error");
      return;
    }
    
    // Prevent minting if user already has an NFT
    if (hasAlreadyMinted) {
      setStatusMessage("You have already minted a SheExcels NFT!");
      setMintStatus("error");
      return;
    }

    setMintStatus("loading");
    setStatusMessage("Minting your NFT...");

    try {
      // Create a new transaction block
      const tx = new TransactionBlock();
      
      // Call the self_mint function from the SheExcels module
      tx.moveCall({
        target: `${PACKAGE_ID}::she_excel::self_mint`,
        arguments: [
          tx.pure(name),
          tx.pure(description),
          tx.pure(eventDate)
        ],
      });
      
      // Execute the transaction using the mutate function with callbacks
      signAndExecuteTransactionBlock(
        {
          transactionBlock: tx,
          options: {
            showEffects: true,
            showEvents: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            
            // Extract the NFT object ID from the transaction result
            let nftObjectId = "";
            
            try {
              // Look for created objects in the transaction effects
              if (result.effects?.created && result.effects.created.length > 0) {
                // Loop through created objects to find our NFT
                for (const obj of result.effects.created) {
                  // Use type assertion to handle the TypeScript error
                  const typedObj = obj as any;
                  
                  // Check if this looks like our NFT object
                  if (typedObj && 
                      typedObj.owner && 
                      typedObj.reference && 
                      typedObj.reference.objectId &&
                      typedObj.type && 
                      typeof typedObj.type === 'string' && 
                      typedObj.type.includes(`${PACKAGE_ID}::she_excel::SheExcelsNFT`)) {
                    
                    nftObjectId = typedObj.reference.objectId;
                    console.log("Found NFT object ID:", nftObjectId);
                    break;
                  }
                }
              }
              
              // If we didn't find it with the first approach, try another way
              if (!nftObjectId && result.events) {
                // Look for NFT creation events
                for (const event of result.events) {
                  // Use type assertion to handle the TypeScript error
                  const typedEvent = event as any;
                  
                  if (typedEvent && 
                      typedEvent.type && 
                      typedEvent.type.includes(`${PACKAGE_ID}::she_excel::NFTMinted`)) {
                    
                    // The NFT ID should be in the event data
                    if (typedEvent.parsedJson && typedEvent.parsedJson.nft_id) {
                      nftObjectId = typedEvent.parsedJson.nft_id;
                      console.log("Found NFT ID from event:", nftObjectId);
                      break;
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error extracting NFT object ID:", error);
            }
            
            // Update the UI with the minted NFT
            setMintedNFT({
              id: nftObjectId || result.digest || 'unknown',
              url: NFT_IMAGE_URL,
            });

            setMintStatus("success");
            setStatusMessage("Successfully minted your SheExcels NFT!");
          },
          onError: (error) => {
            console.error("Error minting NFT:", error);
            setMintStatus("error");
            setStatusMessage(
              `Error minting NFT: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      );
    } catch (error) {
      console.error("Error preparing transaction:", error);
      setMintStatus("error");
      setStatusMessage(
        `Error preparing transaction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  return (
    <div className="container">
      <EventBanner />

      <div style={walletContainerStyle}>
        <ConnectButton />
      </div>

      <div className="mint-section">
        <div className="card">
          <h2>Mint Your SheExcels NFT</h2>
          <p>
            Mint your proof of participation NFT for the Sui StartHERs event!
          </p>

          <MintForm
            onMint={handleMint}
            isLoading={mintStatus === "loading" || mintStatus === "checking"}
            isWalletConnected={!!currentAccount}
            alreadyMinted={hasAlreadyMinted}
          />

          {statusMessage && (
            <div
              className={`status-message ${
                mintStatus === "success"
                  ? "success"
                  : mintStatus === "error"
                  ? "error"
                  : ""
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {mintedNFT && (
        <NFTDisplay imageUrl={mintedNFT.url} nftId={mintedNFT.id} />
      )}
      
      {currentAccount && (
        <div className="raffle-section">
          <RaffleSystem />
        </div>
      )}
    </div>
  );
}

export default App;
