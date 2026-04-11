import { useState, useEffect } from 'react';
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
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'import', label: 'Importar', icon: Upload },
    { id: 'funnel', label: 'Funil', icon: Filter },
    { id: 'properties', label: 'Empreendimentos', icon: Building2 },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="topbar">
        <div className="logo-wrapper">
          <div className="logo-mark">LA</div>
          <div className="flex flex-col">
            <div className="logo-sub">creci 300771-F</div>
            <div className="logo-text">LEANDRO ALONSO</div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button 
            className="theme-toggle" 
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Button variant="ghost" size="icon" className="rounded-full text-secondary hover:text-primary">
            <Bell size={20} />
          </Button>
          <div className="avatar">
            M
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
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

  const COLORS = ['#00B4CC', '#00DFFC', '#343838', '#008C9E', '#8A9598', '#005F6B'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu negócio - abril de 2026</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="kpi-label font-medium">Empreendimentos</div>
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
                    <stop offset="0%" stopColor="#00DFFC" />
                    <stop offset="100%" stopColor="#008C9E" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0, 223, 252, 0.2)', boxShadow: 'var(--shadow-md)', background: 'var(--surface)', backdropFilter: 'blur(10px)' }}
                  cursor={{ fill: 'rgba(0, 95, 107, 0.05)' }}
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
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0, 223, 252, 0.2)', backgroundColor: 'var(--surface-solid)' }} />
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

function LeadsView() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = mockLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  const statusToSlug = (status: string) => {
    const map: Record<string, string> = {
      'Novo': 'novo',
      'Em Contato': 'contato',
      'Visita Agendada': 'visita',
      'Proposta': 'proposta',
      'Perdido': 'perdido',
      'Ganho': 'ganho'
    };
    return map[status] || 'novo';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">{mockLeads.length} leads encontrados</p>
        </div>
        <BtnPrimary>
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </BtnPrimary>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            className="pl-10 bg-white border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-white border-none shadow-sm">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="contato">Em Contato</SelectItem>
            <SelectItem value="visita">Visita Agendada</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-white border-none shadow-sm">
            <SelectValue placeholder="Todas as regiões" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as regiões</SelectItem>
            <SelectItem value="sul">Zona Sul</SelectItem>
            <SelectItem value="oeste">Zona Oeste</SelectItem>
            <SelectItem value="centro">Centro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="leads-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLeads.map((lead) => (
          <GlassCard key={lead.id} className="lead-card border-none hover:shadow-[0_8px_32px_rgba(0,180,204,0.12)] transition-all duration-300" data-status={statusToSlug(lead.status)}>
            <CardHeader className="pb-2 px-0 pt-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-display">{lead.name}</CardTitle>
                  <StatusBadge status={lead.status} className="mt-2" />
                </div>
                <div className="flex gap-1 -mt-1 -mr-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50 dark:hover:bg-black/20">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} className="text-primary/70" /> 
                  <span className="font-medium text-foreground/80">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} className="text-primary/70" /> 
                  <span className="font-medium text-foreground/80">{lead.email}</span>
                </div>
                <div className="pt-2 text-muted-foreground">
                  Interesse: <span className="font-medium text-foreground">{lead.interest}</span>
                </div>
                <div className="text-muted-foreground">
                  Faixa: <span className="font-medium text-foreground">{lead.valueRange}</span>
                </div>
                <div className="text-muted-foreground">
                  Região: <span className="font-medium text-foreground">{lead.region}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <CalendarIcon size={12} className="text-primary/50" /> Último contato: {lead.lastContact}
                </div>
              </div>

              {lead.notes && (
                <div className="bg-foreground/5 backdrop-blur-sm p-3 rounded-lg text-xs italic text-muted-foreground border border-border/50">
                  <MessageSquare size={12} className="inline mr-1 text-primary/50" /> {lead.notes}
                </div>
              )}

              <BtnWhatsapp className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
              </BtnWhatsapp>
            </CardContent>
          </GlassCard>
        ))}
      </div>
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

      <div className="grid gap-8 md:grid-cols-2">
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
          <ol className="how-to">
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

function FunnelView() {
  const columns: LeadStatus[] = ['Novo', 'Em Contato', 'Visita Agendada', 'Proposta', 'Perdido'];
  
  const getLeadsByStatus = (status: LeadStatus) => mockLeads.filter(l => l.status === status);

  const statusToSlug = (status: string) => {
    const map: Record<string, string> = {
      'Novo': 'novo',
      'Em Contato': 'contato',
      'Visita Agendada': 'visita',
      'Proposta': 'proposta',
      'Perdido': 'perdido',
      'Fechado': 'perdido'
    };
    return map[status] || 'novo';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Funil de Vendas</h2>
        <p className="text-muted-foreground">Arraste e solte os leads entre as etapas do funil</p>
      </div>

      <div className="kanban">
        {columns.map((column) => (
          <div key={column} className="kanban-column" data-stage={statusToSlug(column)}>
            <div className="kanban-column__header">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-foreground">{column}</h3>
              <div className="col-count">{getLeadsByStatus(column).length}</div>
            </div>
            
            <div className="flex-1 p-3 space-y-3 bg-foreground/5 relative z-10 rounded-b-[var(--radius-lg)]">
              {getLeadsByStatus(column).map((lead) => (
                <div key={lead.id} className="mini-card cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                  <strong>{lead.name}</strong>
                  <div className="info flex items-center gap-1">
                    <Phone size={10} /> {lead.phone}
                  </div>
                  <div className="price">{lead.interest} · {lead.valueRange}</div>
                </div>
              ))}
              {getLeadsByStatus(column).length === 0 && (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl text-xs text-muted-foreground">
                  Sem leads nesta etapa
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <GlassCard className="border-none">
        <CardHeader>
          <CardTitle className="font-display">Estatísticas do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="funnel-meter">
            {columns.map((col) => {
              const count = getLeadsByStatus(col).length;
              if (count === 0) return null;
              const percentage = ((count / mockLeads.length) * 100).toFixed(1);
              return (
                <div 
                  key={col} 
                  className="seg" 
                  style={{ 
                    '--w': `${percentage}%`, 
                    background: `var(--status-${statusToSlug(col)})` 
                  } as React.CSSProperties}
                  title={`${col}: ${count} leads (${percentage}%)`}
                >
                  <span className="hidden md:inline">{col} · {count}</span>
                  <span className="inline md:hidden">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}

function PropertiesView() {
  const statusToTagClass = (status: Property['status']) => {
    const map: Record<Property['status'], string> = {
      'Em Obras': 'tag--em-obras',
      'Lançamento': 'tag--lancamento',
      'Pronto': 'tag--pronto',
    };
    return map[status];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Empreendimentos</h2>
          <p className="text-muted-foreground">{mockProperties.length} empreendimentos cadastrados</p>
        </div>
        <BtnPrimary>
          <Plus className="mr-2 h-4 w-4" /> Novo Empreendimento
        </BtnPrimary>
      </div>

      <div className="emp-grid">
        {mockProperties.map((prop, idx) => {
          const mockClass = `emp-${(idx % 3) + 1}`;
          return (
            <div key={prop.id} className="emp-card">
              <div className="emp-image">
                <div className={`emp-image-mock ${mockClass}`} />
                <div className="tag-stack">
                  <span className={`tag ${statusToTagClass(prop.status)}`}>{prop.status}</span>
                  {prop.isFeatured && (
                    <span className="tag tag--destaque">
                      <Star size={10} className="inline mr-1 -mt-0.5 fill-current" />
                      Destaque
                    </span>
                  )}
                </div>
              </div>
              <div className="emp-body">
                <div className="emp-name">{prop.name}</div>
                <div className="emp-builder">{prop.developer}</div>
                <div className="emp-info">
                  <div>
                    <small>📍 Localização</small>
                    <div className="emp-info-value">{prop.region}</div>
                  </div>
                  <div>
                    <small>💰 Preço</small>
                    <div className="emp-price">{prop.priceRange}</div>
                  </div>
                  <div>
                    <small>🏠 Tipologia</small>
                    <div className="emp-info-value">{prop.units}</div>
                  </div>
                </div>
                <p className="emp-desc">{prop.description}</p>
                <button type="button" className="btn-material">
                  Ver Material de Vendas
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
          <p className="text-muted-foreground">abril de 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white border-none shadow-sm">Anterior</Button>
          <Button variant="outline" className="bg-white border-none shadow-sm">Hoje</Button>
          <Button variant="outline" className="bg-white border-none shadow-sm">Próximo</Button>
          <Button className="bg-primary hover:bg-primary/90 ml-2">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="bg-slate-50 p-2 text-center text-[10px] font-bold uppercase text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const hasEvent = mockEvents.some(e => e.date === `2026-04-${day.toString().padStart(2, '0')}`);
                return (
                  <div 
                    key={i} 
                    className={`bg-white min-h-[100px] p-2 border-t border-l border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer ${
                      day === 10 ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${day === 10 ? 'text-primary' : 'text-slate-600'}`}>
                      {day}
                    </span>
                    {hasEvent && (
                      <div className="mt-1 space-y-1">
                        {mockEvents.filter(e => e.date === `2026-04-${day.toString().padStart(2, '0')}`).map(e => (
                          <div 
                            key={e.id} 
                            className={`text-[9px] p-1 rounded border-l-2 truncate ${
                              e.type === 'Follow-up' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                              e.type === 'Visita' ? 'bg-purple-50 border-purple-400 text-purple-700' :
                              'bg-blue-50 border-blue-400 text-blue-700'
                            }`}
                          >
                            {e.time} {e.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockEvents.map((event) => (
                <div key={event.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 relative group">
                  <div className="flex justify-between items-start">
                    <Badge className={`${
                      event.type === 'Follow-up' ? 'bg-yellow-100 text-yellow-700' :
                      event.type === 'Visita' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    } border-none text-[10px]`}>
                      {event.type}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm">{event.title}</h4>
                  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarIcon size={10} /> {event.date} às {event.time}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {mockLeads.find(l => l.id === event.leadId)?.name}</span>
                    {event.propertyId && (
                      <span className="flex items-center gap-1"><Building2 size={10} /> {mockProperties.find(p => p.id === event.propertyId)?.name}</span>
                    )}
                  </div>
                  {event.notes && (
                    <p className="text-[10px] italic text-muted-foreground pt-1 border-t border-slate-200">
                      {event.notes}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
