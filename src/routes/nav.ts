import {
  LayoutDashboard, Users, GitBranch, FileText, Bell, UserPlus, LayoutGrid,
  FolderKanban, Globe, ListTodo, CalendarDays, BarChart3, Search as SearchIcon,
  TrendingUp, Bot, MessageCircle, Workflow, CalendarClock, CreditCard, Receipt,
  FileStack, Package, ScrollText, Activity, Settings, LifeBuoy, Target, Send,
  Home, User, BadgeIndianRupee, Inbox, ShieldCheck,
} from 'lucide-react';

export interface NavItem { label: string; to: string; icon: any; }
export interface NavGroup { title: string; items: NavItem[]; }

export const adminNav: NavGroup[] = [
  { title: 'Overview', items: [{ label: 'Dashboard', to: '/app', icon: LayoutDashboard }] },
  { title: 'Sales', items: [
    { label: 'Leads', to: '/app/leads', icon: Users },
    { label: 'Pipeline', to: '/app/pipeline', icon: GitBranch },
    { label: 'Proposals', to: '/app/proposals', icon: FileText },
    { label: 'Follow-ups', to: '/app/follow-ups', icon: Send },
    { label: 'Outreach', to: '/app/outreach', icon: Target },
  ]},
  { title: 'Clients', items: [
    { label: 'All Clients', to: '/app/clients', icon: LayoutGrid },
    { label: 'Requests', to: '/app/requests', icon: Inbox },
    { label: 'Onboarding', to: '/app/onboarding', icon: UserPlus },
  ]},
  { title: 'Delivery', items: [
    { label: 'Projects', to: '/app/projects', icon: FolderKanban },
    { label: 'Websites', to: '/app/websites', icon: Globe },
    { label: 'Tasks', to: '/app/tasks', icon: ListTodo },
    { label: 'Calendar', to: '/app/calendar', icon: CalendarDays },
  ]},
  { title: 'Growth', items: [
    { label: 'Analytics', to: '/app/analytics', icon: BarChart3 },
    { label: 'SEO', to: '/app/seo', icon: SearchIcon },
    { label: 'Conversions', to: '/app/conversions', icon: TrendingUp },
  ]},
  { title: 'Automation', items: [
    { label: 'AI Assistants', to: '/app/ai', icon: Bot },
    { label: 'WhatsApp', to: '/app/whatsapp', icon: MessageCircle },
    { label: 'Workflows', to: '/app/workflows', icon: Workflow },
    { label: 'Bookings', to: '/app/bookings', icon: CalendarClock },
  ]},
  { title: 'Billing', items: [
    { label: 'Subscriptions', to: '/app/subscriptions', icon: CreditCard },
    { label: 'Payments', to: '/app/payments', icon: BadgeIndianRupee },
    { label: 'Invoices', to: '/app/invoices', icon: Receipt },
    { label: 'Plans', to: '/app/plans', icon: FileStack },
    { label: 'Services', to: '/app/services', icon: Package },
  ]},
  { title: 'System', items: [
    { label: 'Notifications', to: '/app/notifications', icon: Bell },
    { label: 'Activity', to: '/app/activity', icon: Activity },
    { label: 'Support', to: '/app/support', icon: LifeBuoy },
    { label: 'System Health', to: '/app/system-health', icon: ShieldCheck },
    { label: 'Settings', to: '/app/settings', icon: Settings },
  ]},
];

export const clientNav: NavGroup[] = [
  { title: 'Overview', items: [
    { label: 'Overview', to: '/portal', icon: Home },
    { label: 'Business Profile', to: '/portal/profile', icon: User },
  ]},
  { title: 'My Website', items: [
    { label: 'Website', to: '/portal/website', icon: Globe },
    { label: 'Project', to: '/portal/project', icon: FolderKanban },
  ]},
  { title: 'Growth', items: [
    { label: 'Leads', to: '/portal/leads', icon: Users },
    { label: 'Analytics', to: '/portal/analytics', icon: BarChart3 },
  ]},
  { title: 'Engage', items: [
    { label: 'WhatsApp', to: '/portal/whatsapp', icon: MessageCircle },
    { label: 'AI Assistant', to: '/portal/ai', icon: Bot },
    { label: 'Bookings', to: '/portal/bookings', icon: CalendarClock },
  ]},
  { title: 'Account', items: [
    { label: 'Requests', to: '/portal/requests', icon: Inbox },
    { label: 'Subscription', to: '/portal/subscription', icon: CreditCard },
    { label: 'Invoices', to: '/portal/invoices', icon: Receipt },
    { label: 'Support', to: '/portal/support', icon: LifeBuoy },
    { label: 'Settings', to: '/portal/settings', icon: Settings },
  ]},
];

export { ScrollText };
