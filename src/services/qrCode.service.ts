import QRCode from "qrcode";
import crypto from "crypto";

export class QRCodeService {
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        scale: 8,
      });
      return qrCode;
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }

  static generateTicketHash(
    eventId: string,
    userId: string,
    timestamp: number
  ): string {
    const data = `${eventId}:${userId}:${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static async generateTicketQRCode(
    eventId: string,
    userId: string,
    ticketId: string
  ): Promise<{ qrCode: string; hash: string }> {
    const timestamp = Date.now();
    const hash = this.generateTicketHash(eventId, userId, timestamp);
    const qrData = JSON.stringify({
      ticketId,
      hash,
      timestamp,
      eventId,
      userId,
    });

    const qrCode = await this.generateQRCode(qrData);

    return { qrCode, hash };
  }

  static validateQRCode(qrData: string, expectedHash: string): boolean {
    try {
      const data = JSON.parse(qrData);
      const calculatedHash = this.generateTicketHash(
        data.eventId,
        data.userId,
        data.timestamp
      );
      return calculatedHash === expectedHash;
    } catch (error) {
      return false;
    }
  }
}
