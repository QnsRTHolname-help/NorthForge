import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/"><Logo size={34} showWord /></Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-4xl mx-auto flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#DB2777)', boxShadow: 'var(--clay)' }}>
            <Lock size={28} />
          </div>
          <h1 className="mt-6 font-display font-black text-content text-3xl">You don't have access to this area.</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">Sign in with an account that has the right permission, or return to the NorthForge site.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary">Sign in <ArrowRight size={16} /></Link>
            <Link to="/" className="btn-outline">Back to NorthForge</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
