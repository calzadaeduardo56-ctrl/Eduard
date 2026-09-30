import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { User, SnailPayResponse } from './types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const simpleHash = (str: string) => btoa(str); // Simulación de hashing para contraseñas

export const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Campos Registro / Login
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Campos SnailPay
  const [cardNum, setCardNum] = useState('1234123412341234');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('543');
  const [amount, setAmount] = useState('100');
  const [simulateFail, setSimulateFail] = useState(false);
  const [payStatus, setPayStatus] = useState<{ type: string; msg: string } | null>(null);

  useEffect(() => {
    const activeEmail = localStorage.getItem('active_user_email');
    if (activeEmail) {
      const savedUser = localStorage.getItem(`user_${activeEmail}`);
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setAuthError('Todos los campos son obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }
    if (localStorage.getItem(`user_${email}`)) {
      setAuthError('El correo electrónico ya se encuentra registrado.');
      return;
    }

    const newUser: User = {
      fullName,
      email,
      passwordHash: simpleHash(password),
      balance: 0.0,
    };
    localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
    localStorage.setItem('active_user_email', email);
    setUser(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const saved = localStorage.getItem(`user_${email}`);
    if (!saved) {
      setAuthError('Usuario no encontrado.');
      return;
    }
    const userData: User = JSON.parse(saved);
    if (userData.passwordHash !== simpleHash(password)) {
      setAuthError('Contraseña incorrecta.');
      return;
    }
    localStorage.setItem('active_user_email', email);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_user_email');
    setUser(null);
  };

  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayStatus(null);
    if (!user) return;

    try {
      const res = await fetch('http://localhost:3001/api/snailpay/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardNum,
          expiryDate: expiry,
          cvv,
          fullName: user.fullName,
          amount: parseFloat(amount),
          payerId: user.email,
          payerEmail: user.email,
          simulateSystemError: simulateFail,
        }),
      });

      const data: SnailPayResponse = await res.json();

      // Auditoría ficticia requerida en localStorage
      const auditTrail = JSON.parse(localStorage.getItem('snailpay_audit') || '[]');
      auditTrail.push(data);
      localStorage.setItem('snailpay_audit', JSON.stringify(auditTrail));

      if (res.ok && data.status === 'approved') {
        const newBal = user.balance + data.transaction_amount;
        const updatedUser = { ...user, balance: newBal };
        setUser(updatedUser);
        localStorage.setItem(`user_${user.email}`, JSON.stringify(updatedUser));
        setPayStatus({ type: 'success', msg: `¡Aprobado! Nuevo saldo: $${newBal.toFixed(2)}` });
      } else {
        setPayStatus({ type: 'error', msg: `[${data.status.toUpperCase()}] ${data.status_detail}` });
      }
    } catch (err) {
      setPayStatus({ type: 'error', msg: 'Error de conexión con el servicio SnailPay.' });
    }
  };

  // Datos Gráficas Simuladas
  const donutData = {
    labels: ['Apuestas Ganadas', 'Apuestas Perdidas'],
    datasets: [{ data: [12, 8], backgroundColor: ['#10B981', '#EF4444'] }],
  };

  const barData = {
    labels: ['Rayo', 'Centella', 'Veloz', 'Snailx', 'Turbo', 'Lento'],
    datasets: [
      {
        label: 'Victorias del Día (6 Carreras)',
        data: [2, 1, 1, 1, 1, 0],
        backgroundColor: '#3B82F6',
      },
    ],
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial, sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>{isRegistering ? 'Registro' : 'Inicio de Sesión'}</h2>
        {authError && <p style={{ color: 'red' }}>{authError}</p>}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div style={{ marginBottom: '10px' }}>
              <label>Nombre Completo:</label>
              <input type="text" style={{ width: '100%', padding: '8px' }} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div style={{ marginBottom: '10px' }}>
            <label>Correo Electrónico:</label>
            <input type="email" style={{ width: '100%', padding: '8px' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Contraseña:</label>
            <input type="password" style={{ width: '100%', padding: '8px' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {isRegistering && (
            <div style={{ marginBottom: '10px' }}>
              <label>Confirmar Contraseña:</label>
              <input type="password" style={{ width: '100%', padding: '8px' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          )}
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {isRegistering ? 'Registrar' : 'Ingresar'}
          </button>
        </form>
        <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer' }}>
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>Panel de Apuestas - Carreras de Caracoles</h2>
        <div>
          <span>Hola, <strong>{user.fullName}</strong> | Saldo: <strong style={{ color: '#10B981' }}>${user.balance.toFixed(2)}</strong></span>
          <button onClick={handleLogout} style={{ marginLeft: '15px', padding: '6px 12px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        {/* Gráficas */}
        <div style={{ flex: '2', minWidth: '300px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3>Estadísticas de Apuestas</h3>
              <Doughnut data={donutData} />
            </div>
            <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3>Victorias por Caracol</h3>
              <Bar data={barData} />
            </div>
          </div>
        </div>

        {/* Pasarela SnailPay */}
        <div style={{ flex: '1', minWidth: '280px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
          <h3>Cargar Saldo con SnailPay</h3>
          {payStatus && (
            <div style={{ padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: payStatus.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: payStatus.type === 'success' ? '#065F46' : '#991B1B' }}>
              {payStatus.msg}
            </div>
          )}
          <form onSubmit={handleCharge}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px' }}>Tarjeta:</label>
              <input type="text" style={{ width: '100%', padding: '6px' }} value={cardNum} onChange={(e) => setCardNum(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '12px' }}>Vencimiento:</label>
                <input type="text" style={{ width: '100%', padding: '6px' }} value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '12px' }}>CVV:</label>
                <input type="text" style={{ width: '100%', padding: '6px' }} value={cvv} onChange={(e) => setCvv(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px' }}>Monto a Recargar ($):</label>
              <input type="number" style={{ width: '100%', padding: '6px' }} value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#DC2626' }}>
                <input type="checkbox" checked={simulateFail} onChange={(e) => setSimulateFail(e.target.checked)} /> Simular Falla del Sistema (500)
              </label>
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Procesar Recarga
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};