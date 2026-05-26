"use client";

import React, { useState, useEffect, useRef } from 'react';
import './Picker.css';
import { FaMagic, FaCopy } from 'react-icons/fa';
import { parseWinnerRows, type RaffleWinner } from './parseWinnerRows';

const Picker: React.FC = () => {
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState<string | null>(null); // New state for round number

  const pickSoundRef = useRef<HTMLAudioElement | null>(null);
  const copySoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const roundNumber = process.env.ROUND_NUMBER || 'undefined';
      setRoundNumber(roundNumber);
    }
  }, []);

  useEffect(() => {
    pickSoundRef.current = new Audio('/sounds/pick-sound.wav');
    copySoundRef.current = new Audio('/sounds/copy-sound.wav');
  }, []);

  const playSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    if (soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  };

  const fetchWinners = async () => {
    playSound(pickSoundRef);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/raffle');
      if (!response.ok) {
        throw new Error('Failed to fetch winners');
      }
      const responseData = await response.json();
      
      const topWinners = parseWinnerRows(responseData.data);
      if (topWinners.length > 0) {
        setWinners(topWinners);
      } else {
        setWinners([]);
        setError('Received unexpected data format');
      }
    } catch (err) {
      setWinners([]);
      setError('Failed to fetch winners. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllWinners = () => {
    playSound(copySoundRef);
    const winnersList = winners
      .map(winner =>
        winner.donationId
          ? `Donation ID: ${winner.donationId} | Tx: ${winner.txHash}`
          : `Tx: ${winner.txHash}`,
      )
      .join('\n');
    navigator.clipboard.writeText(winnersList)
      .then(() => alert('Winners copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const getRankNumber = (index: number): number => {
    return index + 1;
  };

  const isClient = typeof window !== 'undefined';

  return (
    <div className="picker-wrapper">
      <div className="twitter-picker">
        <h1>GIVBacks Winners</h1>
        {roundNumber && <h2>Round {roundNumber}</h2>}
        <div className="button-container">
          <button 
            className={`pick-button ${isLoading ? 'loading' : ''}`}
            onClick={fetchWinners}
            disabled={isLoading}
          >
            <FaMagic className="magic-icon" />
          </button>
          <button 
            className={`copy-button ${winners.length > 0 ? 'visible' : ''}`}
            onClick={copyAllWinners}
            disabled={winners.length === 0}
          >
            <FaCopy className="copy-icon" />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {winners.length > 0 && (
          <div className="winners-container">
            <h2 className="winners-title">Winners</h2>
            <ul className="winners-list">
              {winners.map((winner, index) => (
                <li
                  key={winner.donationId ? `${winner.donationId}-${winner.txHash}` : winner.txHash}
                  className="winner-item"
                >
                  <span className="winner-rank">{getRankNumber(index)}</span>
                  <span className="winner-details">
                    {winner.donationId && (
                      <span className="winner-donation-id">
                        Donation ID: {winner.donationId}
                      </span>
                    )}
                    <span className="winner-txhash">
                      Tx: {winner.txHash}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Picker;
