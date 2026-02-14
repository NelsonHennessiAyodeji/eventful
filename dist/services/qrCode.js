"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const generateQRCode = async (data) => {
    try {
        // Generate QR code as data URL
        const url = await qrcode_1.default.toDataURL(data);
        return url;
    }
    catch (err) {
        throw new Error("QR code generation failed");
    }
};
exports.generateQRCode = generateQRCode;
