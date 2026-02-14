import axios from "axios";

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export const initializeTransaction = async (
  email: string,
  amount: number,
  reference: string
) => {
  try {
    const response = await paystack.post("/transaction/initialize", {
      email,
      amount: amount * 100, // Paystack uses kobo
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
