import express, { Request, Response } from 'express';
import cors from 'cors';
import { SnailPayRequest, SnailPayResponse } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.post('/api/snailpay/charge', (req: Request<{}, {}, SnailPayRequest>, res: Response<SnailPayResponse | { message: string }>) => {
  const { cardNumber, expiryDate, cvv, fullName, amount, payerId, payerEmail, simulateSystemError } = req.body;

  const now = new Date().toISOString();
  const maskedCard = cardNumber ? `**** **** **** ${cardNumber.slice(-4)}` : '****';
  const maskedCvv = '***';
  const ref = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  const opId = `SP-${Date.now()}`;

  // 1. Error del Sistema (500)
  if (simulateSystemError) {
    return res.status(500).json({
      id: opId,
      status: 'error',
      status_detail: 'Error interno del servidor de SnailPay. Simulación activada.',
      transaction_amount: amount,
      date_created: now,
      reference: ref,
      payer_id: payerId,
      payer_email: payerEmail,
      masked_card: maskedCard,
      cvv_masked: maskedCvv
    });
  }

  // Validaciones
  if (!fullName || amount <= 0) {
    return res.status(400).json({
      id: opId,
      status: 'rejected',
      status_detail: 'Monto o nombre completo inválidos.',
      transaction_amount: amount,
      date_created: now,
      reference: ref,
      payer_id: payerId,
      payer_email: payerEmail,
      masked_card: maskedCard,
      cvv_masked: maskedCvv
    });
  }

  // 2. Rechazo por fondos o CVV
  const cleanCard = cardNumber.replace(/\s+/g, '');
  if (cleanCard === '4000000000000002') {
    return res.status(402).json({
      id: opId,
      status: 'rejected',
      status_detail: 'Fondos insuficientes en la tarjeta.',
      transaction_amount: amount,
      date_created: now,
      reference: ref,
      payer_id: payerId,
      payer_email: payerEmail,
      masked_card: maskedCard,
      cvv_masked: maskedCvv
    });
  }

  if (cleanCard === '5500000000000003' || cvv === '000') {
    return res.status(402).json({
      id: opId,
      status: 'rejected',
      status_detail: 'Código de seguridad (CVV) inválido.',
      transaction_amount: amount,
      date_created: now,
      reference: ref,
      payer_id: payerId,
      payer_email: payerEmail,
      masked_card: maskedCard,
      cvv_masked: maskedCvv
    });
  }

  // 3. Cobro Exitoso (200)
  if (cleanCard === '1234123412341234' && expiryDate === '12/26' && cvv === '543') {
    return res.status(200).json({
      id: opId,
      status: 'approved',
      status_detail: 'Transacción aprobada con éxito.',
      transaction_amount: amount,
      date_created: now,
      authorization_code: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      reference: ref,
      payer_id: payerId,
      payer_email: payerEmail,
      masked_card: maskedCard,
      cvv_masked: maskedCvv
    });
  }

  // Por defecto, aprobación simulada para tarjetas válidas no clasificadas
  return res.status(200).json({
    id: opId,
    status: 'approved',
    status_detail: 'Transacción procesada correctamente.',
    transaction_amount: amount,
    date_created: now,
    authorization_code: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
    reference: ref,
    payer_id: payerId,
    payer_email: payerEmail,
    masked_card: maskedCard,
    cvv_masked: maskedCvv
  });
});

app.listen(PORT, () => {
  console.log(`Servidor SnailPay corriendo en http://localhost:${PORT}`);
});