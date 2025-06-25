import process from 'process';

export function validateEnv() {
  const jwt = process.env.JWT_SECRET;
  const twofa = process.env.TWOFA_ENCRYPTION_KEY;
  let ok = true;
  if (!jwt || jwt.length < 32 || jwt === 'changeme') {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters.');
    ok = false;
  }
  if (!twofa || twofa.length < 32) {
    console.error('FATAL: TWOFA_ENCRYPTION_KEY must be set and at least 32 characters.');
    ok = false;
  }
  if (!ok) process.exit(1);
} 