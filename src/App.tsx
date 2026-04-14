import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Upload, 
  Kanban, 
  Building2, 
  Calendar as CalendarIcon,
  Search,
  Plus,
  Bell,
  Settings,
  Menu,
  X,
  MessageSquare,
  Phone,
  Mail,
  Filter,
  TrendingUp,
  ArrowRight,
  Star,
  PieChart,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCurrentProfile } from '@/src/hooks/useCurrentProfile';
import { useProperties } from '@/src/hooks/useProperties';
import { useLeads, useUpdateLeadStatus } from '@/src/hooks/useLeads';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { PropertyWizardModal } from '@/components/property-wizard/PropertyWizardModal';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import {
  PROPERTY_KIND_LABELS,
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_STATUS_LABELS,
  type PropertyPurpose,
} from '@/src/lib/schemas/property-schema';
import {
  LEAD_ORIGINS,
  LEAD_ORIGIN_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadOrigin,
  type LeadStatus,
} from '@/src/lib/schemas/lead-schema';
import type { Database } from '@/src/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { BtnWhatsapp } from '@/components/ui/btn-whatsapp';
import { BtnPrimary } from '@/components/ui/btn-primary';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { mockLeads, mockProperties, mockEvents } from './mockData';
import { Lead, Property, Event, LeadStatus } from './types';

export default function App() {
  const { signOut } = useAuth();
  const { profile } = useCurrentProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate({ to: '/login' });
    } catch (error) {
      console.error('[App] Erro ao sair:', error);
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'import', label: 'Importar', icon: Upload },
    { id: 'funnel', label: 'Funil', icon: Filter },
    { id: 'properties', label: 'Imóveis', icon: Building2 },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="topbar">
        <div className="logo-wrapper">
          <img
            src="/imagens/logo-preta.png"
            alt="Leandro Alonso — Corretor de Imóveis"
            className="logo-img"
          />
        </div>

        {/* Desktop Nav */}
        <nav className="nav hidden lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button 
            className="icon-btn theme-toggle" 
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="icon-btn" aria-label="Notificações">
            <Bell size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label="Configurações"
            title="Configurações"
            onClick={() => navigate({ to: '/configuracoes' })}
          >
            <Settings size={18} />
          </button>
          <div className="avatar" title={profile?.full_name ?? ''}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <button
            className="icon-btn"
            aria-label="Sair"
            onClick={handleSignOut}
            title="Sair"
          >
            <LogOut size={18} />
          </button>
          <button 
            className="icon-btn lg:hidden flex"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-4 md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl text-lg font-medium ${
                    activeTab === item.id 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-slate-100'
                  }`}
                >
                  <item.icon size={24} />
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'leads' && <LeadsView />}
            {activeTab === 'import' && <ImportView />}
            {activeTab === 'funnel' && <FunnelView />}
            {activeTab === 'properties' && <PropertiesView />}
            {activeTab === 'agenda' && <AgendaView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function DashboardView() {
  const funnelData = [
    { name: 'Novo', value: mockLeads.filter(l => l.status === 'Novo').length },
    { name: 'Em Contato', value: mockLeads.filter(l => l.status === 'Em Contato').length },
    { name: 'Visita Agendada', value: mockLeads.filter(l => l.status === 'Visita Agendada').length },
    { name: 'Proposta', value: mockLeads.filter(l => l.status === 'Proposta').length },
    { name: 'Perdido', value: mockLeads.filter(l => l.status === 'Perdido').length },
  ];

  const sourceData = [
    { name: 'Google', value: 17 },
    { name: 'Instagram', value: 17 },
    { name: 'Facebook', value: 17 },
    { name: 'WhatsApp', value: 17 },
    { name: 'Indicação', value: 17 },
    { name: 'Tráfego pago', value: 17 },
  ];

  const COLORS = ['#D4A017', '#E8C547', '#1F1F1F', '#B8860B', '#808080', '#8B6914'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu negócio - abril de 2026</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger">
        <GlassCard className="kpi-card kpi-card--primary border-none">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="kpi-label font-medium">Total de Leads</div>
            <div className="kpi-icon"><Users size={20} /></div>
          </div>
          <div className="kpi-value">{mockLeads.length}</div>
          <div className="kpi-foot flex items-center justify-between">
            <span>Todos os tempos</span>
            <span className="text-emerald-500 font-bold ml-1 text-[10px]">↗ +12%</span>
          </div>
        </GlassCard>

        <GlassCard className="kpi-card kpi-card--cyan border-none">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="kpi-label font-medium">Leads do Mês</div>
            <div className="kpi-icon"><Plus size={20} /></div>
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-foot flex items-center justify-between">
            <span>Novos este mês</span>
            <span className="text-emerald-500 font-bold ml-1 text-[10px]">↗ +2</span>
          </div>
        </GlassCard>

        <GlassCard className="kpi-card kpi-card--teal border-none">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="kpi-label font-medium">Taxa de Conversão</div>
            <div className="kpi-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-value">0.0%</div>
          <div className="kpi-foot">0 vendas fechadas</div>
        </GlassCard>

        <GlassCard className="kpi-card kpi-card--dark border-none">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="kpi-label font-medium">Imóveis</div>
            <div className="kpi-icon"><Building2 size={20} /></div>
          </div>
          <div className="kpi-value">{mockProperties.length}</div>
          <div className="kpi-foot">Cadastrados</div>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="border-none">
          <CardHeader>
            <CardTitle className="font-display">Leads por Etapa do Funil</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8C547" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(232, 197, 71, 0.2)', boxShadow: 'var(--shadow-md)', background: 'var(--surface)', backdropFilter: 'blur(10px)' }}
                  cursor={{ fill: 'rgba(139, 105, 20, 0.05)' }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 4, 4]} className="dashboard-bar-chart" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>

        <GlassCard className="border-none">
          <CardHeader>
            <CardTitle className="font-display">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart className="pie-glow">
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(232, 197, 71, 0.2)', backgroundColor: 'var(--surface-solid)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard className="border-none">
        <CardHeader>
          <CardTitle className="font-display">Empreendimentos Mais Trabalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {mockProperties.map((prop) => (
              <div key={prop.id} className="prop-mini-card">
                <div>
                  <h4 className="font-semibold text-sm">{prop.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{prop.region}</p>
                </div>
                <div className="lead-pill">
                  <span>0</span>
                  <span>Leads</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}

type LeadRow = Database['public']['Tables']['leads']['Row'];

function formatLeadBudget(lead: LeadRow): string {
  if (!lead.budget_min && !lead.budget_max) return '—';
  const fmt = (v: number | null) =>
    v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) ??
    '—';
  return `${fmt(lead.budget_min)} – ${fmt(lead.budget_max)}`;
}

function formatLeadInterest(lead: LeadRow): string {
  const parts: string[] = [];
  if (lead.interest_purpose) parts.push(PROPERTY_PURPOSE_LABELS[lead.interest_purpose]);
  if (lead.interest_type) parts.push(lead.interest_type);
  return parts.join(' · ') || '—';
}

function formatLeadRegion(lead: LeadRow): string {
  return [lead.preferred_city, lead.preferred_region].filter(Boolean).join(', ') || '—';
}

function formatLastContact(lead: LeadRow): string {
  if (!lead.last_contact_at) return '—';
  return new Date(lead.last_contact_at).toLocaleDateString('pt-BR');
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D+/g, '');
}

function LeadsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [originFilter, setOriginFilter] = useState<LeadOrigin | 'all'>('all');
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(originFilter !== 'all' ? { origin: originFilter } : {}),
      ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
    }),
    [statusFilter, originFilter, searchTerm],
  );

  const leadsQuery = useLeads(filters);
  const leads = leadsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            {leadsQuery.isLoading
              ? 'Carregando…'
              : `${leads.length} ${leads.length === 1 ? 'lead encontrado' : 'leads encontrados'}`}
          </p>
        </div>
        <BtnPrimary onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo lead
        </BtnPrimary>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, telefone, email ou notas…"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm min-w-[180px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
        >
          <option value="all">Todos os status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm min-w-[180px]"
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value as LeadOrigin | 'all')}
        >
          <option value="all">Todas as origens</option>
          {LEAD_ORIGINS.map((o) => (
            <option key={o} value={o}>
              {LEAD_ORIGIN_LABELS[o]}
            </option>
          ))}
        </select>
      </div>

      {leadsQuery.isError && (
        <p className="text-destructive text-sm">
          Erro ao carregar leads: {(leadsQuery.error as Error).message}
        </p>
      )}

      {!leadsQuery.isLoading && leads.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum lead encontrado. Clique em <strong>Novo lead</strong> para começar.
          </p>
        </GlassCard>
      )}

      <div className="leads-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {leads.map((lead) => (
          <GlassCard
            key={lead.id}
            className="lead-card border-none hover:shadow-[0_8px_32px_rgba(212,160,23,0.12)] transition-all duration-300 p-5 pl-6 cursor-pointer"
            data-status={lead.status}
            onClick={() => setDetailId(lead.id)}
          >
            <CardHeader className="pb-1 px-0 pt-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-display">{lead.name}</CardTitle>
                  <span className={`tag tag--${lead.status}`}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {LEAD_ORIGIN_LABELS[lead.origin]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-0 pb-0 mt-2">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone size={12} className="text-primary/70" />
                  <span className="font-medium text-foreground/80">{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail size={12} className="text-primary/70" />
                    <span className="font-medium text-foreground/80">{lead.email}</span>
                  </div>
                )}
                <div className="flex gap-1.5 text-xs text-secondary pt-1">
                  <span className="w-[70px] text-muted-foreground">Interesse:</span>
                  <strong className="text-foreground font-semibold">{formatLeadInterest(lead)}</strong>
                </div>
                <div className="flex gap-1.5 text-xs text-secondary">
                  <span className="w-[70px] text-muted-foreground">Faixa:</span>
                  <strong className="text-foreground font-semibold">{formatLeadBudget(lead)}</strong>
                </div>
                <div className="flex gap-1.5 text-xs text-secondary">
                  <span className="w-[70px] text-muted-foreground">Região:</span>
                  <strong className="text-foreground font-semibold">{formatLeadRegion(lead)}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <CalendarIcon size={11} className="text-primary/50" />
                  Último contato: {formatLastContact(lead)}
                </div>
              </div>

              {lead.notes && (
                <div className="bg-foreground/5 backdrop-blur-sm p-2 rounded-lg text-[11px] italic text-muted-foreground border border-border/50 line-clamp-2">
                  <MessageSquare size={10} className="inline mr-1 text-primary/50" /> {lead.notes}
                </div>
              )}

              <BtnWhatsapp
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  const cleaned = cleanPhone(lead.phone);
                  if (cleaned) window.open(`https://wa.me/55${cleaned}`, '_blank');
                }}
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
              </BtnWhatsapp>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      <NewLeadModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => setDetailId(id)}
      />
      <LeadDetailModal
        open={detailId !== null}
        leadId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function ImportView() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Importar Leads</h2>
        <p className="text-muted-foreground">Adicione vários leads de uma vez</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 stagger">
        <GlassCard className="border-none">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Upload de Arquivo
            </CardTitle>
            <CardDescription>Faça upload de um arquivo .CSV ou .TXT com seus leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="dropzone">
              <div className="dropzone-icon">
                <Upload size={24} />
              </div>
              <div className="text-center relative z-10">
                <p className="font-semibold text-foreground">Clique para selecionar arquivo</p>
                <p className="text-xs text-muted-foreground mt-1">CSV ou TXT (máx. 5MB)</p>
              </div>
            </div>

            <div className="info-box mt-6">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Formato esperado:
              </h4>
              <p className="text-xs text-muted-foreground">
                Nome, Telefone, Email (opcional)<br />
                <span className="font-mono mt-1 block">Exemplo: João Silva, 11987654321, joao@email.com</span>
              </p>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="border-none">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Colar Lista Manualmente
            </CardTitle>
            <CardDescription>Cole uma lista de leads (um por linha)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea 
              className="paste-area"
              placeholder="João Silva, 11987654321, joao@email.com&#10;Maria Santos, 11976543210&#10;Pedro Costa, 11965432109, pedro@email.com"
            />
            <div className="info-box">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary shrink-0" /> Cada linha vira um novo lead. Separe os dados por vírgula, ponto e vírgula ou tab.
              </p>
            </div>
            <BtnPrimary className="w-full">Importar Leads</BtnPrimary>
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard className="border-none">
        <CardHeader>
          <CardTitle className="font-display">Como usar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="how-to stagger">
            <li className="how-to__step">
              <span className="how-to__num">1</span>
              <div>
                <strong className="text-sm">Formato mínimo</strong>
                <p className="text-xs text-muted-foreground mt-1">Nome e Telefone são obrigatórios. Email é opcional.</p>
              </div>
            </li>
            <li className="how-to__step">
              <span className="how-to__num">2</span>
              <div>
                <strong className="text-sm">Separadores aceitos</strong>
                <p className="text-xs text-muted-foreground mt-1">Vírgula (,), ponto e vírgula (;) ou Tab</p>
              </div>
            </li>
            <li className="how-to__step">
              <span className="how-to__num">3</span>
              <div>
                <strong className="text-sm">Detecção de duplicidade</strong>
                <p className="text-xs text-muted-foreground mt-1">O sistema verifica telefones já cadastrados e alerta você antes de importar.</p>
              </div>
            </li>
            <li className="how-to__step">
              <span className="how-to__num">4</span>
              <div>
                <strong className="text-sm">Status padrão</strong>
                <p className="text-xs text-muted-foreground mt-1">Todos os leads importados recebem o status "Novo" automaticamente.</p>
              </div>
            </li>
            <li className="how-to__step">
              <span className="how-to__num">5</span>
              <div>
                <strong className="text-sm">Enriquecimento posterior</strong>
                <p className="text-xs text-muted-foreground mt-1">Você pode editar os leads depois para adicionar mais informações (região, faixa de valor, etc).</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </GlassCard>
    </div>
  );
}

const MAIN_FUNNEL_COLUMNS: LeadStatus[] = ['novo', 'contato', 'visita', 'proposta'];
const SIDE_FUNNEL_COLUMNS: LeadStatus[] = ['ganho', 'perdido'];

function FunnelView() {
  const leadsQuery = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const [detailId, setDetailId] = useState<string | null>(null);

  const leads = leadsQuery.data ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, LeadRow[]> = {
      novo: [],
      contato: [],
      visita: [],
      proposta: [],
      ganho: [],
      perdido: [],
    };
    for (const lead of leads) {
      map[lead.status].push(lead);
    }
    return map;
  }, [leads]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const nextStatus = String(over.id) as LeadStatus;
    if (!LEAD_STATUSES.includes(nextStatus)) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === nextStatus) return;

    updateStatus.mutate(
      { id: leadId, nextStatus, previousStatus: lead.status },
      {
        onError: (err) => {
          toast.error(`Erro ao mudar status: ${err.message}`);
        },
        onSuccess: () => {
          toast.success(
            `Lead movido para "${LEAD_STATUS_LABELS[nextStatus]}".`,
          );
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Funil de Vendas</h2>
        <p className="text-muted-foreground">
          Arraste e solte os leads entre as etapas. Toque num card pra abrir detalhes.
        </p>
      </div>

      {leadsQuery.isError && (
        <p className="text-destructive text-sm">
          Erro ao carregar funil: {(leadsQuery.error as Error).message}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="funnel-layout">
          <div className="kanban stagger">
            {MAIN_FUNNEL_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsByStatus[status]}
                onCardClick={(id) => setDetailId(id)}
              />
            ))}
          </div>
          <aside className="funnel-side">
            {SIDE_FUNNEL_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsByStatus[status]}
                compact
                onCardClick={(id) => setDetailId(id)}
              />
            ))}
          </aside>
        </div>
      </DndContext>

      <GlassCard className="border-none">
        <CardHeader>
          <CardTitle className="font-display">Estatísticas do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="funnel-meter">
            {LEAD_STATUSES.map((status) => {
              const count = leadsByStatus[status].length;
              if (count === 0 || leads.length === 0) return null;
              const percentage = ((count / leads.length) * 100).toFixed(1);
              return (
                <div
                  key={status}
                  className="seg"
                  style={
                    {
                      '--w': `${percentage}%`,
                      background: `var(--status-${status})`,
                    } as React.CSSProperties
                  }
                  title={`${LEAD_STATUS_LABELS[status]}: ${count} leads (${percentage}%)`}
                >
                  <span className="hidden md:inline">
                    {LEAD_STATUS_LABELS[status]} · {count}
                  </span>
                  <span className="inline md:hidden">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </GlassCard>

      <LeadDetailModal
        open={detailId !== null}
        leadId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

interface KanbanColumnProps {
  status: LeadStatus;
  leads: LeadRow[];
  compact?: boolean;
  onCardClick: (leadId: string) => void;
}

function KanbanColumn({ status, leads, compact, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${compact ? 'kanban-column--compact' : ''} ${isOver ? 'kanban-column--over' : ''}`}
      data-stage={status}
    >
      <div className="kanban-column__header">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-foreground">
          {LEAD_STATUS_LABELS[status]}
        </h3>
        <div className="col-count">{leads.length}</div>
      </div>

      <div className="flex-1 p-3 space-y-3 bg-foreground/5 relative z-10 rounded-b-[var(--radius-lg)] min-h-[140px]">
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onOpen={() => onCardClick(lead.id)} />
        ))}
        {leads.length === 0 && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl text-xs text-muted-foreground">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  lead: LeadRow;
  onOpen: () => void;
}

function KanbanCard({ lead, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mini-card hover:shadow-md transition-all"
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onOpen();
        }
      }}
    >
      <strong>{lead.name}</strong>
      <div className="info flex items-center gap-1">
        <Phone size={10} /> {lead.phone}
      </div>
      <div className="price">{formatLeadInterest(lead)} · {formatLeadBudget(lead)}</div>
    </div>
  );
}

type PropertyRow = Database['public']['Tables']['properties']['Row'];

const PURPOSE_FILTERS: Array<{ value: PropertyPurpose | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'venda', label: 'Venda' },
  { value: 'locacao', label: 'Locação' },
  { value: 'lancamento', label: 'Lançamento' },
];

const PURPOSE_TAG_CLASS: Record<PropertyPurpose, string> = {
  venda: 'tag--pronto',
  locacao: 'tag--em-obras',
  lancamento: 'tag--lancamento',
};

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function getPropertyTitle(p: PropertyRow): string {
  if (p.purpose === 'lancamento' && p.development_name) return p.development_name;
  return `${PROPERTY_KIND_LABELS[p.kind]} em ${p.neighborhood}`;
}

function getPropertyPrice(p: PropertyRow): string {
  if (p.purpose === 'locacao') {
    return p.rent_price ? `${formatBRL(p.rent_price)}/mês` : '—';
  }
  return formatBRL(p.sale_price);
}

function getPropertyTypology(p: PropertyRow): string {
  const parts: string[] = [];
  if (p.bedrooms) parts.push(`${p.bedrooms} dorm${p.bedrooms > 1 ? 's' : ''}`);
  if (p.suites) parts.push(`${p.suites} suíte${p.suites > 1 ? 's' : ''}`);
  if (p.usable_area_m2) parts.push(`${p.usable_area_m2} m²`);
  return parts.length > 0 ? parts.join(' · ') : PROPERTY_KIND_LABELS[p.kind];
}

function PropertiesView() {
  const [purposeFilter, setPurposeFilter] = useState<PropertyPurpose | 'all'>('all');
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const filters = useMemo(
    () => ({
      ...(purposeFilter !== 'all' ? { purpose: purposeFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [purposeFilter, search],
  );

  const propertiesQuery = useProperties(filters);
  const properties = propertiesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Imóveis</h2>
          <p className="text-muted-foreground">
            {propertiesQuery.isLoading
              ? 'Carregando…'
              : `${properties.length} ${properties.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}`}
          </p>
        </div>
        <BtnPrimary onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo imóvel
        </BtnPrimary>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PURPOSE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setPurposeFilter(f.value)}
            className={`tag ${purposeFilter === f.value ? 'tag--destaque' : 'tag--pronto'} cursor-pointer`}
          >
            {f.label}
          </button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, bairro, endereço…"
          className="ml-auto max-w-xs"
        />
      </div>

      {propertiesQuery.isError && (
        <p className="text-destructive text-sm">
          Erro ao carregar imóveis: {(propertiesQuery.error as Error).message}
        </p>
      )}

      {!propertiesQuery.isLoading && properties.length === 0 && (
        <div className="emp-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="text-muted-foreground">
            Nenhum imóvel encontrado. Clique em <strong>Novo imóvel</strong> para começar.
          </p>
        </div>
      )}

      <div className="emp-grid stagger">
        {properties.map((prop, idx) => {
          const mockClass = `emp-${(idx % 3) + 1}`;
          const purposeLabel = PROPERTY_PURPOSE_LABELS[prop.purpose];
          const statusLabel = PROPERTY_STATUS_LABELS[prop.status];
          return (
            <div key={prop.id} className="emp-card">
              <div className="emp-image">
                <div className={`emp-image-mock ${mockClass}`} />
                <div className="tag-stack">
                  <span className={`tag ${PURPOSE_TAG_CLASS[prop.purpose]}`}>{purposeLabel}</span>
                  <span className="tag">{statusLabel}</span>
                  {prop.is_featured && (
                    <span className="tag tag--destaque">
                      <Star size={10} className="inline mr-1 -mt-0.5 fill-current" />
                      Destaque
                    </span>
                  )}
                </div>
              </div>
              <div className="emp-body">
                <div className="emp-name">{getPropertyTitle(prop)}</div>
                <div className="emp-builder">
                  {prop.developer ?? `Ref: ${prop.ref_code ?? '—'}`}
                </div>
                <div className="emp-info">
                  <div>
                    <small>📍 Localização</small>
                    <div className="emp-info-value">
                      {prop.neighborhood}, {prop.city}
                    </div>
                  </div>
                  <div>
                    <small>💰 {prop.purpose === 'locacao' ? 'Aluguel' : 'Preço'}</small>
                    <div className="emp-price">{getPropertyPrice(prop)}</div>
                  </div>
                  <div>
                    <small>🏠 Tipologia</small>
                    <div className="emp-info-value">{getPropertyTypology(prop)}</div>
                  </div>
                </div>
                {prop.highlights && <p className="emp-desc">{prop.highlights}</p>}
                <button type="button" className="btn-material">
                  Ver detalhes
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PropertyWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => {
          // mantém o modal aberto pra adicionar fotos; lista é invalidada pelo hook
        }}
      />
    </div>
  );
}

function AgendaView() {
  const typeMap = (type: string) => {
    if (type === 'Follow-up') return 'followup';
    if (type === 'Visita') return 'visita';
    if (type === 'Reunião') return 'reuniao';
    return type.toLowerCase();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">abril de 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">Anterior</button>
          <button className="btn-secondary">Hoje</button>
          <button className="btn-secondary">Próximo</button>
          <BtnPrimary className="ml-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Evento
          </BtnPrimary>
        </div>
      </div>

      <div className="agenda-grid stagger">
        <GlassCard className="cal-card border-none" data-glow="1">
          <div className="cal-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Calendário
          </div>
          <div className="cal-grid">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="cal-cell weekday">{day}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const isToday = day === 10;
              const hasEvent = mockEvents.some(e => e.date === `2026-04-${day.toString().padStart(2, '0')}`);
              return (
                <div key={i} className={`cal-cell ${isToday ? 'cal-cell--today' : ''}`}>
                  <span className="cal-day">{day}</span>
                  {hasEvent && mockEvents.filter(e => e.date === `2026-04-${day.toString().padStart(2, '0')}`).map(e => (
                    <div key={e.id} className="event-pill" data-type={typeMap(e.type)}>
                      {e.time} {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="upcoming-card border-none" data-glow="2">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Próximos Eventos
          </h3>

          {mockEvents.slice(0, 3).map((event) => {
            const lead = mockLeads.find(l => l.id === event.leadId);
            const property = mockProperties.find(p => p.id === event.propertyId);
            return (
              <div key={event.id} className="event-item" data-type={typeMap(event.type)}>
                <span className="event-type">{event.type}</span>
                <div className="event-title">{event.title}</div>
                <div className="event-meta">
                  <span>📅 {event.date} às {event.time}</span>
                  <span>👤 {lead?.name}</span>
                  {property && (
                    <span>📍 {property.name}</span>
                  )}
                  {event.notes && (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{event.notes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>
    </div>
  );
}
