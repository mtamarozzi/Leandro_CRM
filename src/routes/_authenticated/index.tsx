import { createFileRoute } from '@tanstack/react-router';
import App from '@/src/App';

// ============================================================================
// / — Home (protegida)
// ============================================================================
// Como esta rota está dentro de _authenticated/, ela só é acessível após
// login. Renderiza o componente App atual (que contém Dashboard, Leads,
// Funil, Empreendimentos, Agenda — com dados mockados por enquanto).
//
// Na Etapa 3, vamos trocar o mockData por queries reais do Supabase.
// ============================================================================

export const Route = createFileRoute('/_authenticated/')({
  component: App,
});
