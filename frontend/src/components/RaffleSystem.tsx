import React, { useState, useEffect } from "react";
import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PERMANENT_NFT_OWNERS } from '../constants/owners';
import { 
  RAFFLE_PACKAGE_ID,
  RAFFLE_CAP_ID,
  NFT_OWNER_REGISTRY_ID,
  RAFFLE_RESULT_ID,
  RAFFLE_WINNERS,
  ADMIN_ADDRESS,
  WINNER_COUNT,
  RAFFLE_METADATA
} from '../constants/raffle-config';
import styled from "styled-components";

const RaffleContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1400px;
`;

const RaffleTitle = styled.h2`
  margin-bottom: 1rem;
  color: #ff69b4;
`;

const RaffleSubtitle = styled.p`
  margin-bottom: 1rem;
  color: #9370db;
  font-style: italic;
`;

const RaffleButton = styled.button`
  background-color: #9370db;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 1rem 0;

  &:hover {
    background-color: #7d5dbe;
  }

  &:disabled {
    background-color: #9370db;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WinnersList = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const WinnerCard = styled.div`
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WinnerAddress = styled.div`
  font-size: 0.9rem;
  word-break: break-all;
  text-align: center;
  margin-top: 0.5rem;
`;

const OwnersList = styled.div`
  margin-top: 1.5rem;
  max-height: 700px;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  width: 100%;

  @media (max-width: 1600px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #9370db;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #7d5dbe;
  }
`;

const OwnerItem = styled.div`
  padding: 1.2rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-size: 1rem;
  word-break: break-all;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    background-color: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #ff69b4;
  margin-bottom: 0.3rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
`;

const RaffleSystem: React.FC = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  // Use the permanent list of 47 owners instead of fetching
  const [owners] = useState<string[]>(PERMANENT_NFT_OWNERS);
  // Use the winners from our constants file (from on-chain raffle)
  const [winners, setWinners] = useState<string[]>(RAFFLE_WINNERS);
  const [isRaffleLoading, setIsRaffleLoading] = useState(false);
  const [error, setError] = useState("");
  const [raffleStatus, setRaffleStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("success"); // Set to success since raffle is already completed
  const [onchainWinners, setOnchainWinners] = useState<string[]>(RAFFLE_WINNERS);
  const [lastRaffleTimestamp, setLastRaffleTimestamp] = useState<string>(RAFFLE_METADATA.date);
  // Use hardcoded object IDs from our constants file
  const [registryId, setRegistryId] = useState<string>(NFT_OWNER_REGISTRY_ID);
  const [raffleResultId, setRaffleResultId] = useState<string>(RAFFLE_RESULT_ID);
  const [registryInitialized, setRegistryInitialized] = useState(true); // Registry is already initialized

  // Debug effect to log the permanent owners when component mounts
  useEffect(() => {
    console.log("Using permanent list of NFT owners:", owners);
    console.log(`Total NFT owners: ${owners.length}`);

    // Log each owner for debugging
    owners.forEach((owner, index) => {
      console.log(`Owner ${index + 1}: ${owner}`);
    });

    // Check if registry exists and fetch raffle results when component mounts
    checkRegistryStatus();
    fetchRaffleResults();
  }, []);

  // Check if the owner registry has been initialized on-chain
  const checkRegistryStatus = async () => {
    try {
      // Query for NFTOwnerRegistry object
      const objects = await suiClient.getOwnedObjects({
        owner: RAFFLE_PACKAGE_ID,
        options: { showContent: true },
        filter: { StructType: `${RAFFLE_PACKAGE_ID}::raffle::NFTOwnerRegistry` },
      });

      if (objects.data && objects.data.length > 0) {
        // Found registry
        const registry = objects.data[0];
        setRegistryId(registry.data?.objectId || "");

        // Check if it's initialized with owners
        if (registry.data?.content) {
          const content = registry.data.content as any;
          if (content.fields && content.fields.finalized) {
            setRegistryInitialized(true);
            console.log("Registry is initialized and finalized");
          } else {
            console.log("Registry exists but is not finalized");
          }
        }
      } else {
        console.log("Registry not found, will need to be created");
      }
    } catch (err) {
      console.error("Error checking registry status:", err);
    }
  };

  // Check if current account is admin (simplified check - would need proper verification)
  const isAdmin = () => {
    // Replace with the actual admin address for the SheExcels NFT
    const adminAddress = ADMIN_ADDRESS; // Package publisher
    return currentAccount?.address === adminAddress;
  };

  // Fetch past raffle results from on-chain storage
  const fetchRaffleResults = async () => {
    try {
      // Query for RaffleResult objects using getOwnedObjects instead of queryObjects
      const raffleResultObjects = await suiClient.getOwnedObjects({
        owner: "Shared",
        options: { showContent: true },
        filter: { StructType: `${RAFFLE_PACKAGE_ID}::raffle::RaffleResult` },
      });

      if (raffleResultObjects.data && raffleResultObjects.data.length > 0) {
        // Get the most recent raffle result
        const latestRaffle = raffleResultObjects.data[0];
        if (latestRaffle.data?.content) {
          const content = latestRaffle.data.content as any;
          if (content.fields) {
            const winners = content.fields.winners as string[];
            const timestamp = content.fields.timestamp as string;
            const raffleId = content.fields.raffle_id as string;

            setRaffleResultId(latestRaffle.data.objectId);
            setOnchainWinners(winners);
            setLastRaffleTimestamp(
              new Date(Number(timestamp) * 1000).toLocaleString()
            );
            setWinners(winners); // Also update the UI winners
            setRaffleStatus("success"); // Mark as successful since we found results

            console.log(
              `Found raffle result with ID ${raffleId} and ${winners.length} winners`
            );
          }
        }
      } else {
        console.log("No raffle results found");
      }
    } catch (err) {
      console.error("Error fetching raffle results:", err);
      // If we can't fetch on-chain winners, we'll fall back to client-side selection
    }
  };

  // Initialize the owner registry with the permanent list of 47 owners (admin only)
  const initializeOwnerRegistry = async () => {
    if (!currentAccount) {
      setError("You need to connect your wallet first");
      return;
    }

    if (!isAdmin()) {
      setError("Only the admin can initialize the registry");
      return;
    }

    if (owners.length === 0) {
      setError("No NFT owners available");
      return;
    }

    setIsRaffleLoading(true);
    setRaffleStatus("pending");
    setError("");

    try {
      // Use the hardcoded RaffleCap ID from our constants file
      const adminCapId = RAFFLE_CAP_ID;
      console.log("Using RaffleCap:", adminCapId);

      // Use the hardcoded NFT_OWNER_REGISTRY_ID from our constants file
      const registryId = NFT_OWNER_REGISTRY_ID;
      console.log("Using NFT Owner Registry:", registryId);
      setRegistryId(registryId);

      // Create transaction block to initialize the registry
      const txb = new TransactionBlock();

      // Call the initialize_owner_registry function
      txb.moveCall({
        target: `${RAFFLE_PACKAGE_ID}::raffle::initialize_owner_registry`,
        arguments: [
          txb.object(adminCapId), // Admin cap
          txb.object(registryId), // Registry object
          txb.pure(owners), // List of 47 owner addresses
          txb.pure([]), // Empty arguments for ctx
        ],
      });

      // Sign and execute the transaction
      const response = await signAndExecute({
        transactionBlock: txb,
      });

      console.log("Registry initialization transaction executed:", response);

      // Now finalize the registry
      const txbFinalize = new TransactionBlock();

      txbFinalize.moveCall({
        target: `${RAFFLE_PACKAGE_ID}::raffle::finalize_owner_registry`,
        arguments: [
          txbFinalize.object(adminCapId), // Admin cap
          txbFinalize.object(registryId), // Registry object
          txbFinalize.pure([]), // Empty arguments for ctx
        ],
      });

      const finalizeResponse = await signAndExecute({
        transactionBlock: txbFinalize,
      });

      console.log(
        "Registry finalization transaction executed:",
        finalizeResponse
      );
      setRegistryInitialized(true);
      setRaffleStatus("success");
    } catch (err) {
      console.error("Error initializing registry:", err);
      setError(
        `Error initializing registry: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setRaffleStatus("error");
    } finally {
      setIsRaffleLoading(false);
    }
  };

  // Run raffle using on-chain randomness (for admin)
  const runOnchainRaffle = async () => {
    if (!currentAccount) {
      setError("You need to connect your wallet first");
      return;
    }

    if (!isAdmin()) {
      setError("Only the admin can run the on-chain raffle");
      return;
    }

    if (owners.length === 0) {
      setError("No NFT owners available");
      return;
    }

    if (!registryInitialized) {
      setError("Owner registry must be initialized first");
      return;
    }

    setIsRaffleLoading(true);
    setRaffleStatus("pending");
    setError("");

    try {
      // Use the hardcoded RaffleCap ID from our constants file
      const adminCapId = RAFFLE_CAP_ID;
      console.log("Using RaffleCap:", adminCapId);

      // Determine how many winners to select (15 or less if there aren't enough owners)
      const numWinners = Math.min(15, owners.length);

      // Create transaction block
      const txb = new TransactionBlock();

      // Call the run_raffle function
      txb.moveCall({
        target: `${RAFFLE_PACKAGE_ID}::raffle::run_raffle`,
        arguments: [
          txb.object(adminCapId), // Admin cap
          txb.object(registryId), // Registry object
          txb.pure(numWinners), // Number of winners to select
          txb.pure([]), // Empty arguments for ctx
        ],
      });

      // Sign and execute the transaction
      const response = await signAndExecute({
        transactionBlock: txb,
      });

      console.log("Raffle transaction executed:", response);
      setRaffleStatus("success");

      // Fetch the updated winners from on-chain
      await fetchRaffleResults();
    } catch (err) {
      console.error("Error running on-chain raffle:", err);
      setError(
        `Error running on-chain raffle: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setRaffleStatus("error");
    } finally {
      setIsRaffleLoading(false);
    }
  };

  // Run client-side raffle (for non-admin users or as fallback)
  const runClientRaffle = () => {
    if (owners.length === 0) {
      setError("No NFT owners found. Please fetch owners first.");
      return;
    }

    setIsRaffleLoading(true);
    setError("");

    try {
      // Shuffle owners array randomly using Fisher-Yates algorithm
      const shuffled = [...owners];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Select the first 15 (or less) as winners
      const selectedWinners = shuffled.slice(0, Math.min(15, owners.length));
      setWinners(selectedWinners);
    } catch (err) {
      console.error("Error running client-side raffle:", err);
      setError(
        `Error running client-side raffle: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsRaffleLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <RaffleContainer>
      <RaffleTitle>SheExcels NFT Raffle Results</RaffleTitle>
      <RaffleSubtitle>
        {RAFFLE_METADATA.description} - {RAFFLE_METADATA.date}
      </RaffleSubtitle>
      <div style={{ marginBottom: '1rem', padding: '0.8rem', backgroundColor: 'rgba(147, 112, 219, 0.1)', borderRadius: '8px', border: '1px solid #9370db' }}>
        <p style={{ fontWeight: 'bold', color: '#ff69b4' }}>✨ Raffle Completed On-Chain ✨</p>
        <p>15 winners were selected from {owners.length} NFT holders using {RAFFLE_METADATA.randomnessSource}</p>
        <p>Results are permanently stored on the Sui blockchain</p>
        <p>Raffle Result Object ID: <a href={`https://suiexplorer.com/object/${RAFFLE_RESULT_ID}?network=mainnet`} target="_blank" rel="noopener noreferrer" style={{ color: '#9370db' }}>{RAFFLE_RESULT_ID}</a></p>
      </div>

      <StatsContainer>
        <StatItem>
          <StatLabel>Total NFT Owners</StatLabel>
          <StatValue>{owners.length}</StatValue>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#9370DB",
              marginTop: "0.2rem",
            }}
          >
            Live Data
          </div>
        </StatItem>
        <StatItem>
          <StatLabel>Winners Selected</StatLabel>
          <StatValue>{winners.length} / 15</StatValue>
        </StatItem>
      </StatsContainer>

      {isAdmin() && !registryInitialized && (
        <RaffleButton
          onClick={initializeOwnerRegistry}
          disabled={isRaffleLoading}
        >
          {isRaffleLoading
            ? "Initializing Registry..."
            : "Initialize Owner Registry"}
        </RaffleButton>
      )}

      <RaffleButton
        onClick={isAdmin() ? runOnchainRaffle : runClientRaffle}
        disabled={
          isRaffleLoading ||
          owners.length === 0 ||
          (isAdmin() && !registryInitialized)
        }
      >
        {isRaffleLoading
          ? "Running Raffle..."
          : isAdmin()
          ? "Select Winners On-Chain"
          : "Preview Winners (Client-Side)"}
      </RaffleButton>

      {lastRaffleTimestamp && (
        <div
          style={{
            fontSize: "0.9rem",
            color: "#9370DB",
            marginTop: "0.5rem",
            textAlign: "center",
            padding: "0.5rem",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <span style={{ fontWeight: "bold" }}>Official Raffle Results</span>
          <br />
          Conducted on: {lastRaffleTimestamp}
          <br />
          {raffleResultId && (
            <a
              href={`https://explorer.sui.io/object/${raffleResultId}?network=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#FF69B4", textDecoration: "underline" }}
            >
              View on Sui Explorer
            </a>
          )}
        </div>
      )}

      {raffleStatus === "success" && (
        <div
          style={{
            color: "#4CAF50",
            margin: "1rem 0",
            padding: "0.8rem",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderRadius: "8px",
          }}
        >
          On-chain raffle completed successfully! The results are now
          permanently recorded on the Sui blockchain.
        </div>
      )}

      {raffleStatus === "pending" && (
        <div
          style={{
            color: "#FF9800",
            margin: "1rem 0",
            padding: "0.8rem",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          Processing on-chain raffle... Please confirm the transaction in your
          wallet.
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#f44336",
            margin: "1rem 0",
            padding: "0.8rem",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <h3 style={{ color: '#ff69b4', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(147, 112, 219, 0.3)', paddingBottom: '0.5rem' }}>
          🏆 Official Raffle Winners (15) 🏆
        </h3>
        <WinnersList>
          {winners.map((winner, index) => (
            <WinnerCard key={index} style={{ border: '1px solid rgba(147, 112, 219, 0.3)', backgroundColor: 'rgba(255, 105, 180, 0.05)' }}>
              <div style={{ fontWeight: 'bold', color: '#ff69b4', fontSize: '1.1rem' }}>Winner #{index + 1}</div>
              <WinnerAddress>
                <a
                  href={`https://suiexplorer.com/address/${winner}?network=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#9370db', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  {winner.substring(0, 10)}...{winner.substring(winner.length - 10)}
                </a>
              </WinnerAddress>
            </WinnerCard>
          ))}
        </WinnersList>
      </div>

      {owners.length > 0 && (
        <>
          <RaffleTitle>All NFT Owners ({owners.length})</RaffleTitle>
          <OwnersList>
            {owners.map((owner, index) => (
              <OwnerItem key={owner}>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    fontSize: "1.1rem",
                    color: "#FF69B4",
                    textAlign: "center",
                    padding: "5px 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  Owner #{index + 1}
                </div>
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                    marginBottom: "12px",
                    fontSize: "1rem",
                  }}
                >
                  {formatAddress(owner)}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "auto",
                  }}
                >
                  <a
                    href={`https://explorer.sui.io/address/${owner}?network=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "white",
                      backgroundColor: "#9370DB",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      transition: "all 0.3s ease",
                      flex: "1",
                      textAlign: "center",
                      marginRight: "8px",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#7d5dbe")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#9370DB")
                    }
                  >
                    View on Explorer
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(owner)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      color: "white",
                      transition: "all 0.3s ease",
                    }}
                    title="Copy address"
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.2)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)")
                    }
                  >
                    📋
                  </button>
                </div>
              </OwnerItem>
            ))}
          </OwnersList>
        </>
      )}
    </RaffleContainer>
  );
};

export default RaffleSystem;
