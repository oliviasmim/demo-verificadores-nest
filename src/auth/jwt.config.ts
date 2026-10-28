// Segredo lido em tempo de execução. O fallback existe só para facilitar o
// desenvolvimento local; em produção defina JWT_SECRET (ver .env.example).
const SEGREDO_DE_DESENVOLVIMENTO = 'segredo-apenas-para-desenvolvimento';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? SEGREDO_DE_DESENVOLVIMENTO;
}

export const JWT_EXPIRES_IN = '1h';
