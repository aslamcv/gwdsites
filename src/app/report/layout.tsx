import React from 'react';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  // This layout uses a specific font for Malayalam characters
  return <div className="font-malayalam">{children}</div>;
}
