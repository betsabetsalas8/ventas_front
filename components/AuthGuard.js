// components/AuthGuard.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, soloAdmin = false }) {
  const router  = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const raw  = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      router.push('/login');
      return;
    }
    if (soloAdmin && user.rol !== 'superusuario') {
      router.push('/clientes');
      return;
    }
    setOk(true);
  }, []);

  if (!ok) return null;
  return children;
}