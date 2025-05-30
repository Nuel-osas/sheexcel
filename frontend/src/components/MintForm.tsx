import React, { useState } from 'react';
import styled from 'styled-components';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  font-family: inherit;
`;

const TextArea = styled.textarea`
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
`;

const MintButton = styled.button`
  background-color: #FF69B4;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;

  &:hover {
    background-color: #d44d96;
  }

  &:disabled {
    background-color: #FF69B4;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface MintFormProps {
  onMint: (name: string, description: string, eventDate: string) => void;
  isLoading: boolean;
  isWalletConnected: boolean;
  alreadyMinted?: boolean;
}

const MintForm: React.FC<MintFormProps> = ({ onMint, isLoading, isWalletConnected, alreadyMinted = false }) => {
  const [name, setName] = useState('SheExcels Daily Event');
  const [description, setDescription] = useState('Proof of participation in the SheExcels Sui StartHERs onboarding event for women on Sui');
  const [eventDate, setEventDate] = useState('2025-05-31');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMint(name, description, eventDate);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </InputGroup>

      <InputGroup>
        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </InputGroup>

      <InputGroup>
        <Label htmlFor="eventDate">Event Date</Label>
        <Input
          id="eventDate"
          type="text"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </InputGroup>

      <MintButton 
        type="submit" 
        disabled={isLoading || !isWalletConnected || alreadyMinted}
      >
        {isLoading ? 'Minting...' : alreadyMinted ? 'Already Minted' : 'Mint NFT'}
      </MintButton>
      
      {!isWalletConnected && (
        <p style={{ color: '#FF69B4', fontSize: '0.9rem' }}>
          Please connect your wallet to mint an NFT
        </p>
      )}
      
      {alreadyMinted && (
        <p style={{ color: '#9370DB', fontSize: '0.9rem' }}>
          You have already minted your SheExcels NFT!
        </p>
      )}
    </Form>
  );
};

export default MintForm;
