# Mapeamento de Breadcrumbs

## Componente

```tsx
import { Breadcrumbs, useBreadcrumbs, breadcrumbPresets } from '@/components/ui/Breadcrumbs';
```

## Uso Básico

```tsx
// Automático (baseado na rota)
<Breadcrumbs />

// Com items customizados
<Breadcrumbs items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'PDI', href: '/pdi' },
  { label: 'João Silva' },
]} />

// Com presets
<Breadcrumbs items={breadcrumbPresets.pdiDetails('João Silva')} />
```

---

## Hierarquia por Módulo

### PDI

| Rota | Breadcrumb |
|------|------------|
| `/pdi` | Dashboard > PDI |
| `/pdi/:id` | Dashboard > PDI > [Nome Usuário] |
| `/pdi/:id/competency/:compId` | Dashboard > PDI > [Nome Usuário] > Competência: [Nome] |
| `/pdi/new` | Dashboard > PDI > Novo PDI |

### Competências

| Rota | Breadcrumb |
|------|------------|
| `/competencies` | Dashboard > Competências |
| `/competencies/:id` | Dashboard > Competências > [Nome] |

### Mentoria

| Rota | Breadcrumb |
|------|------------|
| `/mentorship` | Dashboard > Mentoria |
| `/mentorship/schedule` | Dashboard > Mentoria > Agendar Sessão |
| `/mentorship/sessions` | Dashboard > Mentoria > Sessões |
| `/mentorship/session/:id` | Dashboard > Mentoria > Sessões > [Data/Título] |

### Bem-estar / Saúde Mental

| Rota | Breadcrumb |
|------|------------|
| `/mental-health` | Dashboard > Bem-estar |
| `/mental-health/checkin` | Dashboard > Bem-estar > Check-in Emocional |
| `/wellness` | Dashboard > Bem-estar |
| `/wellness-library` | Dashboard > Bem-estar > Biblioteca |
| `/wellness-admin` | Dashboard > Bem-estar > Administração |

### Calendário

| Rota | Breadcrumb |
|------|------------|
| `/hr-calendar` | Dashboard > Calendário |
| `/hr-calendar/event/:id` | Dashboard > Calendário > [Nome Evento] |
| `/calendar` | Dashboard > Calendário |

### Administração

| Rota | Breadcrumb |
|------|------------|
| `/administration` | Dashboard > Administração |
| `/administration/competencies` | Dashboard > Administração > Competências |
| `/user-management` | Dashboard > Administração > Usuários |
| `/team-management` | Dashboard > Administração > Equipes |
| `/career-track-management` | Dashboard > Administração > Trilha de Carreira |

### Perfil

| Rota | Breadcrumb |
|------|------------|
| `/profile` | Dashboard > Perfil |
| `/profile/settings` | Dashboard > Perfil > Configurações |

### Outras Páginas

| Rota | Breadcrumb |
|------|------------|
| `/analytics` | Dashboard > Analytics |
| `/quality-assurance` | Dashboard > Garantia de Qualidade |
| `/people-management` | Dashboard > Gestão de Pessoas |
| `/hr-area` | Dashboard > Área de RH |
| `/action-groups` | Dashboard > Grupos de Ações |
| `/evaluations` | Dashboard > Avaliações |

---

## Presets Disponíveis

```typescript
import { breadcrumbPresets } from '@/components/ui/Breadcrumbs';

// PDI
breadcrumbPresets.pdiList()
breadcrumbPresets.pdiDetails(userName?: string)
breadcrumbPresets.pdiCompetency(userName?: string, competencyName?: string)

// Competências
breadcrumbPresets.competenciesList()
breadcrumbPresets.competencyDetails(name?: string)

// Mentoria
breadcrumbPresets.mentorshipList()
breadcrumbPresets.mentorshipSchedule()

// Bem-estar
breadcrumbPresets.wellnessList()
breadcrumbPresets.wellnessCheckin()

// Calendário
breadcrumbPresets.calendar()
breadcrumbPresets.calendarEvent(eventName?: string)

// Administração
breadcrumbPresets.administration()
breadcrumbPresets.adminCompetencies()
breadcrumbPresets.adminUsers()

// Perfil
breadcrumbPresets.profile()
breadcrumbPresets.profileSettings()
```

---

## Integração com Rotas

### Hook useBreadcrumbs

```tsx
import { useBreadcrumbs } from '@/components/ui/Breadcrumbs';

const PDIDetailPage: React.FC = () => {
  const { pdi } = usePDI();
  
  const breadcrumbs = useBreadcrumbs({
    dynamicLabels: {
      pdi: pdi?.user?.name || 'Carregando...',
    }
  });

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      {/* ... */}
    </div>
  );
};
```

### BreadcrumbProvider (para labels dinâmicos globais)

```tsx
// Em App.tsx
import { BreadcrumbProvider } from '@/components/ui/Breadcrumbs';

<BreadcrumbProvider>
  <Routes>
    {/* ... */}
  </Routes>
</BreadcrumbProvider>

// Em um componente filho
import { useBreadcrumbContext } from '@/components/ui/Breadcrumbs';

const PDIPage: React.FC = () => {
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumbContext();
  
  useEffect(() => {
    if (pdi) {
      setDynamicLabel('pdi', pdi.user.name);
    }
    return () => clearDynamicLabel('pdi');
  }, [pdi]);
  
  // ...
};
```

---

## Comportamento Responsivo

### Desktop
```
Dashboard > PDI > João Silva > Competência: Liderança
```

### Mobile (colapsado)
```
Dashboard > ... > Competência: Liderança
```

---

## Acessibilidade

- [x] `<nav>` com `aria-label="Breadcrumbs"`
- [x] `<ol>` com `role="list"`
- [x] Último item com `aria-current="page"`
- [x] Links navegáveis por teclado (Tab)
- [x] Visualmente distinguível (link vs texto atual)

---

## Implementação na Layout

```tsx
// src/components/layout/Layout.tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const Layout: React.FC = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar />
      
      <main className="ml-64 p-6">
        {!isDashboard && (
          <div className="mb-6">
            <Breadcrumbs />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
```

---

## Customização

### Separador customizado

```tsx
<Breadcrumbs 
  separator={<span className="text-slate-400 mx-2">/</span>}
/>
```

### Sem ícone de home

```tsx
<Breadcrumbs showHomeIcon={false} />
```

### Controle de itens em mobile

```tsx
<Breadcrumbs mobileMaxItems={3} />
```
