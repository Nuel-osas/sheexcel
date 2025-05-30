import React from 'react';
import styled from 'styled-components';

const BannerContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const BannerImage = styled.div`
  width: 100%;
  height: 300px;
  background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://ipfs.io/ipfs/bafybeihigtndth4zrl3hakmnvy23s6ahxb4hg237fzp7j7e73kw7sokare');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const BannerContent = styled.div`
  text-align: center;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #FF69B4, #9370DB);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const EventDetails = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 0.9rem;
  color: #FF69B4;
  font-weight: 600;
  margin-bottom: 0.3rem;
`;

const DetailValue = styled.span`
  font-size: 1.1rem;
  font-weight: 500;
`;

const EventBanner: React.FC = () => {
  return (
    <BannerContainer>
      <BannerImage>
        <BannerContent>
          <Title>Sui StartHERs</Title>
          <Subtitle>A Technical Onboarding Event for Web3 Women</Subtitle>
          
          <EventDetails>
            <DetailItem>
              <DetailLabel>DATE</DetailLabel>
              <DetailValue>May 31st, 2025</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>TIME</DetailLabel>
              <DetailValue>10AM-3PM</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>LOCATION</DetailLabel>
              <DetailValue>Cafe 1, Enugu</DetailValue>
            </DetailItem>
          </EventDetails>
        </BannerContent>
      </BannerImage>
    </BannerContainer>
  );
};

export default EventBanner;
