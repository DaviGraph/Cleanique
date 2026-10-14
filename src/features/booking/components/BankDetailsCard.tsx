import React, { useState, useEffect } from 'react';
import { getBankDetails } from '../lib/bookingApi';
import type { BankDetails } from '../types';
import { SparklesIcon, CheckIcon } from './Icons';

interface BankDetailsCardProps {
  reference: string;
}

export const BankDetailsCard: React.FC<BankDetailsCardProps> = ({ reference }) => {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getBankDetails()
      .then((details) => {
        if (isMounted) {
          setBankDetails(details);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="cq-bank-card" style={{ minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cq-spinner-sm" />
      </div>
    );
  }

  if (!bankDetails) {
    return (
      <div className="cq-bank-card">
        <p className="cq-error-msg">Unable to load payment details. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="cq-bank-card">
      <div className="cq-bank-header">
        <div className="cq-bank-icon-wrap">
          <SparklesIcon size={20} color="#102A29" />
        </div>
        <div>
          <h4 className="cq-bank-title">Official Cleanique Bank Account</h4>
          <p className="cq-bank-subtitle">
            Transfer your 50% deposit via online banking or mobile app to the account below.
          </p>
        </div>
      </div>

      <div className="cq-bank-fields-list">
        {/* Bank Name */}
        <div className="cq-bank-field-row">
          <div className="cq-bank-field-meta">
            <span className="cq-bank-label">Bank Name</span>
            <span className="cq-bank-val">{bankDetails.bankName}</span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(bankDetails.bankName, 'bank')}
            aria-label="Copy Bank Name"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copiedKey === 'bank' ? <><CheckIcon size={13} color="#2ECDBF" /> Copied</> : 'Copy'}
          </button>
        </div>

        {/* Account Name */}
        <div className="cq-bank-field-row">
          <div className="cq-bank-field-meta">
            <span className="cq-bank-label">Account Name</span>
            <span className="cq-bank-val">{bankDetails.accountName}</span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(bankDetails.accountName, 'name')}
            aria-label="Copy Account Name"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copiedKey === 'name' ? <><CheckIcon size={13} color="#2ECDBF" /> Copied</> : 'Copy'}
          </button>
        </div>

        {/* Account Number */}
        <div className="cq-bank-field-row cq-bank-field-row-acc">
          <div className="cq-bank-field-meta">
            <span className="cq-bank-label">Account Number</span>
            <span className="cq-bank-val cq-bank-val-acc">{bankDetails.accountNumber}</span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(bankDetails.accountNumber, 'acc')}
            aria-label="Copy Account Number"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copiedKey === 'acc' ? <><CheckIcon size={13} color="#2ECDBF" /> Copied</> : 'Copy'}
          </button>
        </div>
      </div>

      {/* Transfer Narration Requirement */}
      <div className="cq-narration-box">
        <span className="cq-narration-badge">IMPORTANT NARRATION</span>
        <p className="cq-narration-text">
          Please use your booking reference{' '}
          <strong className="cq-narration-ref">{reference}</strong> as the transfer description
          or payment narration so Cleanique can identify and match your transaction immediately.
        </p>
      </div>
    </div>
  );
};
