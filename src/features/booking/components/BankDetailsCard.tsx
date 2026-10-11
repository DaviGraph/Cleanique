import React, { useState } from 'react';
import { CLEANIQUE_BANK_DETAILS } from '../lib/bankDetails';
import { SparklesIcon } from './Icons';

interface BankDetailsCardProps {
  reference: string;
}

export const BankDetailsCard: React.FC<BankDetailsCardProps> = ({ reference }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

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
            <span className="cq-bank-val">{CLEANIQUE_BANK_DETAILS.bankName}</span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(CLEANIQUE_BANK_DETAILS.bankName, 'bank')}
            aria-label="Copy Bank Name"
          >
            {copiedKey === 'bank' ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Account Name */}
        <div className="cq-bank-field-row">
          <div className="cq-bank-field-meta">
            <span className="cq-bank-label">Account Name</span>
            <span className="cq-bank-val">{CLEANIQUE_BANK_DETAILS.accountName}</span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(CLEANIQUE_BANK_DETAILS.accountName, 'name')}
            aria-label="Copy Account Name"
          >
            {copiedKey === 'name' ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Account Number */}
        <div className="cq-bank-field-row cq-bank-field-row-acc">
          <div className="cq-bank-field-meta">
            <span className="cq-bank-label">Account Number</span>
            <span className="cq-bank-val cq-bank-val-acc">
              {CLEANIQUE_BANK_DETAILS.accountNumber}
            </span>
          </div>
          <button
            type="button"
            className="cq-copy-btn cq-bank-copy-btn"
            onClick={() => copyToClipboard(CLEANIQUE_BANK_DETAILS.accountNumber, 'acc')}
            aria-label="Copy Account Number"
          >
            {copiedKey === 'acc' ? '✓ Copied' : 'Copy'}
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
