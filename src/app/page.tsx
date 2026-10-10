import { Calculator } from '@/components/wealth-compass/calculator';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="font-headline text-3xl font-semibold">
            Retirement Savings Calculator
          </h1>
          <p className="text-muted-foreground">
            Visualize your journey to financial independence. See how each year&apos;s contribution builds your future wealth.
          </p>
        </div>
        <div className="mx-auto w-full max-w-6xl">
          <Calculator />
        </div>
      </main>
    </div>
  );
}
