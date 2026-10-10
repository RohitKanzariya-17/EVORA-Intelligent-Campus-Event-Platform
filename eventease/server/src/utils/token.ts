import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '../config/env';

/**
 * Generate a deterministic opaque raw token for a registration.
 * Contains NO personal data, NO JWT, NO password.
 * Unforgeable without TICKET_SECRET.
 */
export const deriveRegistrationToken = (
  registrationId: string,
  studentId: string,
  registeredAt: Date | number
): string => {
  const timeMs = registeredAt instanceof Date ? registeredAt.getTime() : registeredAt;
  const payload = `eventease:ticket:${registrationId}:${studentId}:${timeMs}`;
  return crypto.createHmac('sha256', config.TICKET_SECRET).update(payload).digest('hex');
};

/**
 * Compute SHA-256 hash of an opaque raw token.
 * This hash is the ONLY value persisted in the database.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
};

/**
 * Generate a QR code base64 Data URL encoding ONLY the opaque raw token.
 */
export const generateQRCodeDataUrl = async (rawToken: string): Promise<string> => {
  return QRCode.toDataURL(rawToken, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#1e1b4b', // deep indigo
      light: '#ffffff',
    },
  });
};
