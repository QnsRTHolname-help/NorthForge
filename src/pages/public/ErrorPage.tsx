import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { Logo } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/"><Logo size={34} showWord /></Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-4xl mx-auto flex items-center justify-center text-white animate-clay-float" style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)', boxShadow: 'var(--clay)' }}>
            <Compass size={28} />
          </div>
          <p className="mt-6 font-display font-black text-content text-4xl tracking-tight">404</p>
          <h1 className="mt-2 font-display font-black text-content text-2xl">This page doesn't exist.</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">The address may have changed, or the page may have been moved. Let's get you back on track.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">Back to NorthForge <ArrowRight size={16} /></Link>
            <Link to="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
