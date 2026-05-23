'use client';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function RedirectContent() {
  const searchParams = useSearchParams();
  useEffect(() => {
    redirect('/pumping-test/open-well-entry?' + searchParams.toString());
  }, [searchParams]);
  return null;
}

export default function RedirectPage() {
  return <Suspense><RedirectContent /></Suspense>;
}
