import React, { useState, useRef, useEffect } from 'react';
import { submitReceipt } from '../lib/bookingApi';
import { CheckIcon, SparklesIcon } from './Icons';

interface ReceiptUploadProps {
  reference: string;
  accessToken: string;
  onUploadSuccess?: () => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  reference,
  accessToken,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Format file size nicely (e.g. 1.25 MB)
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setUploadError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type strictly using file.type (not merely file extension)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload JPG, PNG, or PDF receipts only.');
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    // Validate max 5MB size
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setFileError(`File size (${formatFileSize(file.size)}) exceeds the 5MB limit. Please upload a smaller file.`);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // Generate preview for JPG/PNG images
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file.type === 'image/jpeg' || file.type === 'image/png') {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading || successMessage) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      // Submit through bookingApi
      const res = await submitReceipt(reference, accessToken, selectedFile);
      setSuccessMessage(res.message);
      onUploadSuccess?.();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Receipt upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cq-receipt-upload-card">
      <div className="cq-receipt-header">
        <h4 className="cq-receipt-title">Upload Payment Receipt</h4>
        <p className="cq-receipt-subtitle">
          Attach proof of transfer (mobile app transfer screenshot, bank debit alert, or PDF receipt).
          Allowed: JPG, PNG, PDF (Max 5MB).
        </p>
      </div>

      {successMessage ? (
        <div className="cq-receipt-success-banner" role="status">
          <div className="cq-receipt-success-icon">
            <CheckIcon size={24} color="#102A29" />
          </div>
          <div className="cq-receipt-success-text">
            {/* EXACT required text mandated by AGENT_RULES.md */}
            {successMessage}
          </div>
        </div>
      ) : (
        <div className="cq-receipt-upload-body">
          {/* File Picker Area */}
          <div
            className={`cq-dropzone ${selectedFile ? 'has-file' : ''} ${fileError ? 'has-error' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="receipt-file-input"
            />

            {!selectedFile ? (
              <div className="cq-dropzone-prompt">
                <div className="cq-dropzone-icon">
                  <SparklesIcon size={28} color="#2ECDBF" />
                </div>
                <div className="cq-dropzone-text">
                  <span className="cq-dropzone-highlight">Click to select receipt</span> or drag and drop
                </div>
                <div className="cq-dropzone-formats">JPG, PNG, PDF • Up to 5MB</div>
              </div>
            ) : (
              <div className="cq-dropzone-preview">
                {previewUrl ? (
                  <div className="cq-image-preview-box">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="cq-receipt-img-preview"
                    />
                  </div>
                ) : (
                  <div className="cq-pdf-badge-box">
                    <span className="cq-pdf-icon-tag">PDF</span>
                  </div>
                )}

                <div className="cq-file-info-box">
                  <div className="cq-file-name">{selectedFile.name}</div>
                  <div className="cq-file-size">{formatFileSize(selectedFile.size)}</div>
                  <div className="cq-change-file-hint">Click to choose a different receipt</div>
                </div>
              </div>
            )}
          </div>

          {/* Validation Error */}
          {fileError && <p className="cq-error-msg cq-receipt-error">{fileError}</p>}
          {uploadError && <p className="cq-error-msg cq-receipt-error">{uploadError}</p>}

          {/* Upload Button */}
          <div className="cq-receipt-action">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="cq-btn cq-btn-primary cq-upload-submit-btn"
              id="upload-receipt-btn"
            >
              {isUploading ? (
                <>
                  <div className="cq-spinner-sm" />
                  <span>Uploading Receipt...</span>
                </>
              ) : (
                'Submit Payment Receipt'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
