'use client';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function RedirectContent() {
  const searchParams = useSearchParams();
  useEffect(() => {
    redirect('/ground-water-investigation/geological-survey/site-entry?' + searchParams.toString());
  }, [searchParams]);
  return null;
}

export default function RedirectPage() {
  return <Suspense><RedirectContent /></Suspense>;
}
