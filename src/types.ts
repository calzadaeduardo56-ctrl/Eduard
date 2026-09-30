export interface User {
  fullName: string;
  email: string;
  passwordHash: string;
  balance: number;
}

export interface SnailPayRequest {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  fullName: string;
  amount: number;
  payerId: string;
  payerEmail: string;
  simulateSystemError?: boolean;
}

export interface SnailPayResponse {
  id: string;
  status: 'approved' | 'rejected' | 'error';
  status_detail: string;
  transaction_amount: number;
  date_created: string;
  authorization_code?: string;
  reference: string;
  payer_id: string;
  payer_email: string;
  masked_card: string;
  cvv_masked: string;
}