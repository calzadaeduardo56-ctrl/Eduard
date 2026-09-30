import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from './App';

test('Renderiza la aplicación sin errores', () => {
  const { getByText } = render(<App />);
  const titleElement = getByText(/Inicio de Sesión/i);
  expect(titleElement).toBeInTheDocument();
});