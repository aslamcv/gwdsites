import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {actions && <div>{actions}</div>}
    </div>
  );
}
