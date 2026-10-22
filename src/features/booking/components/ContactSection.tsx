import React, { useState } from 'react';
import {
  SparklesIcon,
  MessageCircleIcon,
  PhoneIcon,
  ClockIcon,
  CreditCardIcon,
  ExternalLinkIcon,
} from './Icons';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setIsSubmitting(true);
    // Simulate inquiry dispatch / WhatsApp redirect
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      // Optional: open WhatsApp with customer inquiry prefilled
      const text = encodeURIComponent(
        `Hello Cleanique, my name is ${name.trim()} (${phone.trim()}). I have an inquiry regarding ${inquiryType}: ${message.trim()}`
      );
      window.open(`https://wa.me/2349162192102?text=${text}`, '_blank');
    }, 400);
  };

  return (
    <section id="contact" className="cq-contact-section">
      <div className="cq-container">
        <div className="cq-section-header">
          <span className="cq-badge cq-badge-turquoise">Get In Touch</span>
          <h2 className="cq-section-title">Need More Information?</h2>
          <p className="cq-section-subtitle">
            Have questions about customized cleaning schedules, office contracts, or specific residential needs?
            Reach out directly and our facility hygiene supervisors will guide you.
          </p>
        </div>

        <div className="cq-contact-layout">
          {/* Left Column: Direct Channels & Hours */}
          <div className="cq-contact-info-col">
            <div className="cq-contact-card">
              <div className="cq-contact-card-icon cq-icon-whatsapp">
                <MessageCircleIcon size={22} color="#25D366" />
              </div>
              <div className="cq-contact-card-body">
                <span className="cq-contact-label">WhatsApp Fast Response</span>
                <span className="cq-contact-val">+234 916 219 2102</span>
                <p className="cq-contact-hint">Fastest response for quotes, availability & inquiries</p>
                <a
                  href="https://wa.me/2349162192102?text=Hello%20Cleanique,%20I%20would%20like%20to%20inquire%20about%20your%20services"
                  target="_blank"
                  rel="noreferrer"
                  className="cq-contact-action-btn cq-btn-wa"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLinkIcon size={14} />
                </a>
              </div>
            </div>

            <div className="cq-contact-card">
              <div className="cq-contact-card-icon">
                <PhoneIcon size={22} color="#2ECDBF" />
              </div>
              <div className="cq-contact-card-body">
                <span className="cq-contact-label">Direct Phone Line</span>
                <a href="tel:+2349162192102" className="cq-contact-val cq-contact-link">
                  0916 219 2102
                </a>
                <p className="cq-contact-hint">Monday – Saturday: 7:30 AM – 7:00 PM</p>
              </div>
            </div>

            <div className="cq-contact-card">
              <div className="cq-contact-card-icon">
                <ClockIcon size={22} color="#2ECDBF" />
              </div>
              <div className="cq-contact-card-body">
                <span className="cq-contact-label">Operating Schedule</span>
                <span className="cq-contact-val">Mon – Sat: 7:30 AM – 7:00 PM</span>
                <span className="cq-contact-subval">Sunday: 9:00 AM – 5:00 PM</span>
                <p className="cq-contact-hint">After-hours service available for commercial and corporate contracts</p>
              </div>
            </div>

            <div className="cq-contact-card">
              <div className="cq-contact-card-icon">
                <CreditCardIcon size={22} color="#2ECDBF" />
              </div>
              <div className="cq-contact-card-body">
                <span className="cq-contact-label">Official PalmPay Payment Account</span>
                <span className="cq-contact-val">Precious Onyekachukwu Gold</span>
                <span className="cq-contact-subval">PalmPay • 9162192102</span>
                <p className="cq-contact-hint">Only pay into official accounts verified on booking submission</p>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Message Form */}
          <div className="cq-contact-form-col">
            <div className="cq-contact-form-box">
              <div className="cq-contact-form-header">
                <h3 className="cq-contact-form-title">Send Us a Direct Message</h3>
                <p className="cq-contact-form-desc">
                  Leave your details and question. We'll answer promptly with customized recommendations.
                </p>
              </div>

              {submitted ? (
                <div className="cq-contact-success">
                  <div className="cq-contact-success-icon">
                    <SparklesIcon size={32} color="#102A29" />
                  </div>
                  <h4 className="cq-contact-success-title">Message Received!</h4>
                  <p className="cq-contact-success-text">
                    Thank you, <strong>{name}</strong>. We've opened WhatsApp to connect with our operations desk,
                    and our team has your inquiry on file.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setMessage('');
                    }}
                    className="cq-btn cq-btn-secondary"
                    style={{ marginTop: '16px' }}
                  >
                    Send Another Question
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="cq-contact-form">
                  <div className="cq-form-group">
                    <label htmlFor="cq-contact-name" className="cq-form-label">
                      Your Full Name <span className="cq-req">*</span>
                    </label>
                    <input
                      id="cq-contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="cq-input"
                    />
                  </div>

                  <div className="cq-form-group">
                    <label htmlFor="cq-contact-phone" className="cq-form-label">
                      Phone Number / WhatsApp <span className="cq-req">*</span>
                    </label>
                    <input
                      id="cq-contact-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0801 234 5678"
                      className="cq-input"
                    />
                  </div>

                  <div className="cq-form-group">
                    <label htmlFor="cq-contact-type" className="cq-form-label">
                      Inquiry Category
                    </label>
                    <select
                      id="cq-contact-type"
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="cq-select"
                    >
                      <option value="residential">Residential Cleaning Packages</option>
                      <option value="deep-clean">Deep Cleaning Consultation</option>
                      <option value="move-in-out">Move-in / Move-out Turnover</option>
                      <option value="post-construction">Post-Construction Detailing</option>
                      <option value="office-commercial">Office / Commercial Facility Care</option>
                      <option value="custom">General Questions & Pricing</option>
                    </select>
                  </div>

                  <div className="cq-form-group">
                    <label htmlFor="cq-contact-msg" className="cq-form-label">
                      How Can We Help You? <span className="cq-req">*</span>
                    </label>
                    <textarea
                      id="cq-contact-msg"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your space size, location, or questions..."
                      className="cq-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cq-btn cq-btn-primary cq-contact-submit-btn"
                  >
                    {isSubmitting ? 'Connecting...' : 'Send Inquiry via WhatsApp'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
