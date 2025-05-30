import React from 'react';
import styled from 'styled-components';

const NFTContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const NFTTitle = styled.h2`
  margin-bottom: 1rem;
  color: #FF69B4;
`;

const NFTImage = styled.img`
  max-width: 300px;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const NFTDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const NFTProperty = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PropertyLabel = styled.span`
  font-weight: 600;
  color: #9370DB;
`;

const PropertyValue = styled.span`
  color: white;
  word-break: break-all;
`;

const ViewButton = styled.a`
  background-color: #9370DB;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1.5rem;
  text-decoration: none;
  display: inline-block;

  &:hover {
    background-color: #7d5dbe;
  }
`;

interface NFTDisplayProps {
  imageUrl: string;
  nftId: string;
}

const NFTDisplay: React.FC<NFTDisplayProps> = ({ imageUrl, nftId }) => {
  return (
    <NFTContainer>
      <NFTTitle>Your SheExcels NFT</NFTTitle>
      <NFTImage src={imageUrl} alt="SheExcels NFT" />
      
      <NFTDetails>
        <NFTProperty>
          <PropertyLabel>NFT ID:</PropertyLabel>
          <PropertyValue>{nftId}</PropertyValue>
        </NFTProperty>
        
        <NFTProperty>
          <PropertyLabel>Type:</PropertyLabel>
          <PropertyValue>Proof of Participation</PropertyValue>
        </NFTProperty>
        
        <NFTProperty>
          <PropertyLabel>Event:</PropertyLabel>
          <PropertyValue>SheExcels Sui StartHERs</PropertyValue>
        </NFTProperty>
      </NFTDetails>
      
      <ViewButton 
        href={`https://explorer.sui.io/object/${nftId}?network=mainnet`} 
        target="_blank" 
        rel="noopener noreferrer"
      >
        View on Sui Explorer
      </ViewButton>
    </NFTContainer>
  );
};

export default NFTDisplay;
