import React, { useState } from "react";
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

// Styled Components
const RaffleContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1400px;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin-top: 1rem;
    margin-bottom: 2rem;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 0.8rem;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    width: calc(100% + 1rem);
  }
`;

const RaffleTitle = styled.h2`
  margin-bottom: 1rem;
  color: #ff69b4;
`;

const RaffleSubtitle = styled.p`
  margin-bottom: 1rem;
  color: #9370db;
  font-style: italic;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
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
  width: auto;

  &:hover {
    background-color: #7d5dbe;
  }

  &:disabled {
    background-color: #9370db;
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    width: 100%;
  }
  
  @media (max-width: 480px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
`;

const WinnersList = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const WinnerCard = styled.div`
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0.8rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.8rem;
    width: 100%;
  }
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
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  
  @media (max-width: 768px) {
    flex: 1 0 45%;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    margin-bottom: 0.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #9370db;
  margin-bottom: 0.3rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #ff69b4;
`;

const AddressLink = styled.a`
  color: #9370db;
  text-decoration: none;
  transition: color 0.3s;
  word-break: break-all;
  
  &:hover {
    color: #ff69b4;
    text-decoration: underline;
  }
`;

const CopyButton = styled.button`
  background-color: transparent;
  border: 1px solid #9370db;
  color: #9370db;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  margin-top: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
  
  &:hover {
    background-color: rgba(147, 112, 219, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4d;
  background-color: rgba(255, 77, 77, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid rgba(255, 77, 77, 0.3);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ToggleButton = styled.button`
  background-color: transparent;
  border: 1px solid #9370db;
  color: #9370db;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(147, 112, 219, 0.1);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.3);
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  svg {
    transition: transform 0.3s ease;
  }
`;

const SectionContent = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  animation: ${props => props.isOpen ? 'fadeIn 0.3s ease' : 'none'};
  margin-top: 1rem;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
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
  
  // State for dropdown toggles - both hidden by default
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [isOwnersOpen, setIsOwnersOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = currentAccount && currentAccount.address === ADMIN_ADDRESS;

  // Function to initialize the owner registry
  const initializeRegistry = async () => {
    if (!currentAccount) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can initialize the registry");
      return;
    }

    setIsRaffleLoading(true);
    setError("");

    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${RAFFLE_PACKAGE_ID}::raffle::initialize_owner_registry`,
        arguments: [
          tx.object(RAFFLE_CAP_ID),
          tx.object(NFT_OWNER_REGISTRY_ID),
          tx.pure(owners),
        ],
      });

      await signAndExecute(
        {
          transactionBlock: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Registry initialized successfully:", result);
            setRegistryInitialized(true);
            setRaffleStatus("success");
          },
          onError: (err) => {
            console.error("Error initializing registry:", err);
            setError(`Error initializing registry: ${err.message}`);
            setRaffleStatus("error");
          },
        }
      );
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      setError(`Error creating transaction: ${err.message}`);
      setRaffleStatus("error");
    } finally {
      setIsRaffleLoading(false);
    }
  };

  // Function to run the raffle
  const runRaffle = async () => {
    if (!currentAccount) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can run the raffle");
      return;
    }

    if (!registryInitialized) {
      setError("Registry must be initialized first");
      return;
    }

    setIsRaffleLoading(true);
    setError("");
    setRaffleStatus("pending");

    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${RAFFLE_PACKAGE_ID}::raffle::run_raffle`,
        arguments: [
          tx.object(RAFFLE_CAP_ID),
          tx.object(NFT_OWNER_REGISTRY_ID),
          tx.pure(WINNER_COUNT),
        ],
      });

      await signAndExecute(
        {
          transactionBlock: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Raffle completed successfully:", result);
            setRaffleResultId(result.digest);
            setRaffleStatus("success");
            setLastRaffleTimestamp(new Date().toISOString());
            
            // In a real implementation, we would fetch the winners from the blockchain
            // But for now, we'll just use our hardcoded winners
            setOnchainWinners(RAFFLE_WINNERS);
          },
          onError: (err) => {
            console.error("Error running raffle:", err);
            setError(`Error running raffle: ${err.message}`);
            setRaffleStatus("error");
          },
        }
      );
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      setError(`Error creating transaction: ${err.message}`);
      setRaffleStatus("error");
    } finally {
      setIsRaffleLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <RaffleContainer>
      <RaffleTitle>SheExcels NFT Raffle Results</RaffleTitle>
      <RaffleSubtitle>
        {RAFFLE_METADATA.description} - {RAFFLE_METADATA.date}
      </RaffleSubtitle>
      
      {/* Raffle Completion Banner */}
      <div style={{ 
        backgroundColor: 'rgba(147, 112, 219, 0.1)', 
        border: '1px solid #9370DB', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem', 
        textAlign: 'center',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
      }}>
        <h3 style={{ 
          color: '#9370DB', 
          marginTop: 0,
          fontSize: 'clamp(1.2rem, 4vw, 1.5rem)'
        }}>🏆 Raffle Completed - Winners Selected 🏆</h3>
        <p>On-chain raffle completed successfully! The results are now permanently recorded on the Sui blockchain.</p>
        <p>The raffle was completed on {RAFFLE_METADATA.date}, selecting 15 winners from 47 NFT owners using secure on-chain randomness.</p>
        <p style={{ 
          marginTop: '1rem', 
          fontWeight: 'bold',
          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
        }}>
          Raffle Result Object ID: <br/>
          <a 
            href={`https://suiexplorer.com/object/${RAFFLE_RESULT_ID}?network=mainnet`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              color: '#FF69B4', 
              wordBreak: 'break-all',
              fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {RAFFLE_RESULT_ID}
          </a>
        </p>
      </div>

      {/* Raffle Stats */}
      <StatsContainer>
        <StatItem>
          <StatLabel>Total NFT Owners</StatLabel>
          <StatValue>{owners.length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Winners Selected</StatLabel>
          <StatValue>{winners.length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Raffle Date</StatLabel>
          <StatValue>{RAFFLE_METADATA.date}</StatValue>
        </StatItem>
      </StatsContainer>

      {/* Error Display */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Admin Actions - Disabled since raffle is completed */}
      {isAdmin && (
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <RaffleButton 
            onClick={initializeRegistry} 
            disabled={isRaffleLoading || raffleStatus === "success"}
          >
            Initialize Owner Registry
          </RaffleButton>
          <RaffleButton 
            onClick={runRaffle} 
            disabled={isRaffleLoading || !registryInitialized || raffleStatus === "success"}
            style={{ marginLeft: '1rem' }}
          >
            Run Raffle
          </RaffleButton>
        </div>
      )}

      {/* Winners Section */}
      {raffleStatus === "success" && (
        <>
          <SectionHeader>
            <RaffleTitle>Official Winners (15)</RaffleTitle>
            <ToggleButton onClick={() => setIsWinnersOpen(!isWinnersOpen)}>
              {isWinnersOpen ? 'Hide Winners ▲' : 'Show Winners ▼'}
            </ToggleButton>
          </SectionHeader>
          
          <SectionContent isOpen={isWinnersOpen}>
            <WinnersList>
              {winners.map((winner, index) => (
                <WinnerCard key={`winner-${index}`}>
                  <div style={{ 
                    backgroundColor: '#ff69b4', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '30px', 
                    height: '30px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    {index + 1}
                  </div>
                  <WinnerAddress>
                    <AddressLink 
                      href={`https://suiexplorer.com/address/${winner}?network=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatAddress(winner)}
                    </AddressLink>
                  </WinnerAddress>
                  <CopyButton onClick={() => copyToClipboard(winner)}>
                    Copy Address
                  </CopyButton>
                </WinnerCard>
              ))}
            </WinnersList>
          </SectionContent>

          {/* All NFT Owners Section */}
          <SectionHeader>
            <RaffleTitle>All NFT Owners ({owners.length})</RaffleTitle>
            <ToggleButton onClick={() => setIsOwnersOpen(!isOwnersOpen)}>
              {isOwnersOpen ? 'Hide Owners ▲' : 'Show Owners ▼'}
            </ToggleButton>
          </SectionHeader>
          
          <SectionContent isOpen={isOwnersOpen}>
            <OwnersList>
              {owners.map((owner, index) => (
                <OwnerItem key={`owner-${index}`}>
                  <AddressLink 
                    href={`https://suiexplorer.com/address/${owner}?network=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatAddress(owner)}
                  </AddressLink>
                  <CopyButton onClick={() => copyToClipboard(owner)}>
                    Copy Address
                  </CopyButton>
                </OwnerItem>
              ))}
            </OwnersList>
          </SectionContent>
        </>
      )}
    </RaffleContainer>
  );
};

export default RaffleSystem;
