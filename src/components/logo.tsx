import { Asterisk } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-xl font-semibold font-headline"
    >
      <div className="flex items-center justify-center p-2 rounded-md bg-primary/10 text-primary">
        <Asterisk className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="hidden sm:inline-block">Castillo Health</span>
        <span className="hidden text-sm sm:inline-block text-muted-foreground">& Aesthetics</span>
      </div>
       <span className="sm:hidden">CHA</span>
    </Link>
  );
}
