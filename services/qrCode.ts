import QRCode from "qrcode";

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const url = await QRCode.toDataURL(data);
    return url;
  } catch (err) {
    throw new Error("QR code generation failed");
  }
};
