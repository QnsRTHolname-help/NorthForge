import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useHasClientRecord } from './pages/client/useClient';
import { adminNav, clientNav } from './routes/nav';
import { AppShell } from './layouts/AppShell';
import { BootLoader, PageLoader } from './components/Loader';

// Public
const Landing = lazy(() => import('./pages/public/Landing'));
const AdminLogin = lazy(() => import('./pages/public/AdminLogin'));
const ClientLogin = lazy(() => import('./pages/public/ClientLogin'));

// Admin pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Proposals = lazy(() => import('./pages/Proposals'));
const FollowUps = lazy(() => import('./pages/FollowUps'));
const Outreach = lazy(() => import('./pages/Outreach'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Projects = lazy(() => import('./pages/Projects'));
const Websites = lazy(() => import('./pages/Websites'));
const WebsiteDetail = lazy(() => import('./pages/WebsiteDetail'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SEO = lazy(() => import('./pages/SEO'));
const Conversions = lazy(() => import('./pages/Conversions'));
const AIAssistants = lazy(() => import('./pages/AIAssistants'));
const WhatsApp = lazy(() => import('./pages/WhatsApp'));
const Workflows = lazy(() => import('./pages/Workflows'));
const WorkflowDetail = lazy(() => import('./pages/WorkflowDetail'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Payments = lazy(() => import('./pages/Payments'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Plans = lazy(() => import('./pages/Plans'));
const ServicesPage = lazy(() => import('./pages/Services'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ActivityPage = lazy(() => import('./pages/ActivityLog'));
const Support = lazy(() => import('./pages/Support'));
const Requests = lazy(() => import('./pages/Requests'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Settings = lazy(() => import('./pages/Settings'));

// Client portal
const CDashboard = lazy(() => import('./pages/client/CDashboard'));
const CProfile = lazy(() => import('./pages/client/CProfile'));
const CWebsite = lazy(() => import('./pages/client/CWebsite'));
const CProject = lazy(() => import('./pages/client/CProject'));
const CLeads = lazy(() => import('./pages/client/CLeads'));
const CAnalytics = lazy(() => import('./pages/client/CAnalytics'));
const CWhatsApp = lazy(() => import('./pages/client/CWhatsApp'));
const CAI = lazy(() => import('./pages/client/CAI'));
const CBookings = lazy(() => import('./pages/client/CBookings'));
const CSubscription = lazy(() => import('./pages/client/CSubscription'));
const CInvoices = lazy(() => import('./pages/client/CInvoices'));
const CSupport = lazy(() => import('./pages/client/CSupport'));
const CRequests = lazy(() => import('./pages/client/CRequests'));
const CSettings = lazy(() => import('./pages/client/CSettings'));

function Guard({ role, children }: { role: 'admin' | 'client'; children: React.ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/app' : '/portal'} replace />;
  return <>{children}</>;
}

// Ensures the authenticated client's business record exists before portal pages
// render. Guarantees useClientData().client is present downstream.
function ClientDataGuard({ children }: { children: React.ReactNode }) {
  const has = useHasClientRecord();
  const { logout } = useAuth();
  if (!has) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 text-center">
        <div className="card p-10 max-w-sm">
          <h2 className="font-display font-black text-content text-lg">Account not linked</h2>
          <p className="text-sm text-muted mt-2">We couldn't find a business linked to your account. Please sign in again or contact NorthForge.</p>
          <button className="btn-primary mt-5" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem('nf.booted') === '1');
  useEffect(() => { if (booted) sessionStorage.setItem('nf.booted', '1'); }, [booted]);

  if (!booted) return <BootLoader onDone={() => setBooted(true)} />;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-surface"><PageLoader /></div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/client-login" element={<ClientLogin />} />

        {/* Admin */}
        <Route path="/app/*" element={
          <Guard role="admin">
            <AppShell nav={adminNav} variant="admin">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="leads/:id" element={<LeadDetail />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="proposals" element={<Proposals />} />
                  <Route path="follow-ups" element={<FollowUps />} />
                  <Route path="outreach" element={<Outreach />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="websites" element={<Websites />} />
                  <Route path="websites/:id" element={<WebsiteDetail />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="seo" element={<SEO />} />
                  <Route path="conversions" element={<Conversions />} />
                  <Route path="ai" element={<AIAssistants />} />
                  <Route path="whatsapp" element={<WhatsApp />} />
                  <Route path="workflows" element={<Workflows />} />
                  <Route path="workflows/:id" element={<WorkflowDetail />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="requests" element={<Requests />} />
                  <Route path="support" element={<Support />} />
                  <Route path="system-health" element={<SystemHealth />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
          </Guard>
        } />

        {/* Client portal */}
        <Route path="/portal/*" element={
          <Guard role="client">
            <ClientDataGuard>
            <AppShell nav={clientNav} variant="client">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route index element={<CDashboard />} />
                  <Route path="profile" element={<CProfile />} />
                  <Route path="website" element={<CWebsite />} />
                  <Route path="project" element={<CProject />} />
                  <Route path="leads" element={<CLeads />} />
                  <Route path="analytics" element={<CAnalytics />} />
                  <Route path="whatsapp" element={<CWhatsApp />} />
                  <Route path="ai" element={<CAI />} />
                  <Route path="bookings" element={<CBookings />} />
                  <Route path="subscription" element={<CSubscription />} />
                  <Route path="invoices" element={<CInvoices />} />
                  <Route path="requests" element={<CRequests />} />
                  <Route path="support" element={<CSupport />} />
                  <Route path="settings" element={<CSettings />} />
                  <Route path="*" element={<Navigate to="/portal" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
            </ClientDataGuard>
          </Guard>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
