import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ContactSection component text formatting and grammar', () => {
  const contactSectionPath = path.resolve(__dirname, './ContactSection.tsx');
  const fileContent = fs.readFileSync(contactSectionPath, 'utf8');

  it('contains corrected grammar in direct message form description', () => {
    expect(fileContent).toContain("We'll answer promptly with customized recommendations.");
    expect(fileContent).not.toContain("We'll answer prompt with customized recommendations.");
  });

  it('has separated labels and values for WhatsApp contact block', () => {
    expect(fileContent).toContain('<span className="cq-contact-label">WhatsApp Fast Response</span>');
    expect(fileContent).toContain('<span className="cq-contact-val">+234 916 219 2102</span>');
  });

  it('has separated labels and values for Direct Phone Line block', () => {
    expect(fileContent).toContain('<span className="cq-contact-label">Direct Phone Line</span>');
    expect(fileContent).toContain('0916 219 2102');
  });

  it('has separated labels and values for Operating Schedule block', () => {
    expect(fileContent).toContain('<span className="cq-contact-label">Operating Schedule</span>');
    expect(fileContent).toContain('<span className="cq-contact-val">Mon – Sat: 7:30 AM – 7:00 PM</span>');
    expect(fileContent).toContain('<span className="cq-contact-subval">Sunday: 9:00 AM – 5:00 PM</span>');
  });

  it('has separated labels and values for Official PalmPay Account block', () => {
    expect(fileContent).toContain('<span className="cq-contact-label">Official PalmPay Payment Account</span>');
    expect(fileContent).toContain('<span className="cq-contact-val">Precious Onyekachukwu Gold</span>');
    expect(fileContent).toContain('<span className="cq-contact-subval">PalmPay • 9162192102</span>');
  });
});
