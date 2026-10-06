import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/home';
import AgencyContact from '@/pages/AgencyContact';
import AgencyLayout from '@/components/agency/AgencyLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Portal from '@/pages/Portal';
import Benchmark from '@/pages/Benchmark';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import Admin from '@/pages/Admin';
import AdminVaultPage from '@/pages/AdminVaultPage';
import OAuthConsent from '@/pages/OAuthConsent';
import { Toaster as LegacyToaster } from 'sonner';
const HomeSEOAgency = lazy(() => import('@/pages/home-seo-agency'));
const HomeConsulting = lazy(() => import('@/pages/home-consulting'));
const Projects = lazy(() => import('@/pages/projects'));
const SingleProject = lazy(() => import('@/pages/single-project'));
const Blog = lazy(() => import('@/pages/blog'));
const SinglePost = lazy(() => import('@/pages/single-post'));
const About = lazy(() => import('@/pages/about'));
const Services = lazy(() => import('@/pages/services'));
const Pricing = lazy(() => import('@/pages/pricing'));
const Resources = lazy(() => import('@/pages/Resources'));
const InsiderApp = lazy(() => import('@/pages/InsiderApp'));
const AgentCommandCenter = lazy(() => import('@/pages/AgentCommandCenter'));
const AgentChatPage = lazy(() => import('@/pages/AgentChatPage'));
const DomainRegistry = lazy(() => import('@/pages/DomainRegistry'));
const AutonomousMission = lazy(() => import('@/pages/AutonomousMission'));
const MetaArchitect = lazy(() => import('@/pages/MetaArchitect'));
const MissionControl = lazy(() => import('@/pages/MissionControl'));
const SystemFactory = lazy(() => import('@/pages/SystemFactory'));
const BatchOperations = lazy(() => import('@/pages/BatchOperations'));
const WebsiteFactory = lazy(() => import('@/pages/WebsiteFactory'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const SandboxManager = lazy(() => import('@/pages/SandboxManager'));
const DigitalDominance = lazy(() => import('@/pages/DigitalDominance'));
const FrontendFactory = lazy(() => import('@/pages/FrontendFactory'));
const FactoryOS = lazy(() => import('@/pages/FactoryOS'));
const GeneratorStudio = lazy(() => import('@/pages/GeneratorStudio'));
const FactoryRunConsole = lazy(() => import('@/pages/FactoryRunConsole'));
const FactoryArtifacts = lazy(() => import('@/pages/FactoryArtifacts'));
const FactoryValidation = lazy(() => import('@/pages/FactoryValidation'));
const FactoryRepairs = lazy(() => import('@/pages/FactoryRepairs'));
const FactoryApprovals = lazy(() => import('@/pages/FactoryApprovals'));
const FactoryProvisioning = lazy(() => import('@/pages/FactoryProvisioning'));
const FactoryConsulting = lazy(() => import('@/pages/FactoryConsulting'));
const FactoryTemplates = lazy(() => import('@/pages/FactoryTemplates'));
const FactoryAdapters = lazy(() => import('@/pages/FactoryAdapters'));
const FactoryProjects = lazy(() => import('@/pages/FactoryProjects'));
const FactoryScanner = lazy(() => import('@/pages/FactoryScanner'));
const DiagnosticConsole = lazy(() => import('@/pages/DiagnosticConsole'));
const AuditDetail = lazy(() => import('@/pages/AuditDetail'));
const RepairPlanConsole = lazy(() => import('@/pages/RepairPlanConsole'));
const MonitoringConsole = lazy(() => import('@/pages/MonitoringConsole'));
const RiskRegister = lazy(() => import('@/pages/RiskRegister'));
const OutreachConsole = lazy(() => import('@/pages/OutreachConsole'));
const SystemMapPage = lazy(() => import('@/pages/SystemMapPage'));
const RevenueLeaksPage = lazy(() => import('@/pages/RevenueLeaksPage'));
const EvidenceConsole = lazy(() => import('@/pages/EvidenceConsole'));
const CloneStudio = lazy(() => import('@/pages/CloneStudio'));
const SystemProvisioner = lazy(() => import('@/pages/SystemProvisioner'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const SmsOptIn = lazy(() => import('@/pages/SmsOptIn'));
const WhatsAppOptIn = lazy(() => import('@/pages/WhatsAppOptIn'));
const CallDisclosure = lazy(() => import('@/pages/CallDisclosure'));
const Unsubscribe = lazy(() => import('@/pages/Unsubscribe'));
const CommsInbox = lazy(() => import('@/pages/CommsInbox'));
const VisualGallery = lazy(() => import('@/pages/VisualGallery'));
const Visualizer = lazy(() => import('@/pages/Visualizer'));
const AutoBuilder = lazy(() => import('@/pages/AutoBuilder'));
const OperatorConsole = lazy(() => import('@/pages/OperatorConsole'));
const ApiGenerator = lazy(() => import('@/pages/ApiGenerator'));
const ApiVaultPage = lazy(() => import('@/pages/ApiVaultPage'));
const VideoStudio = lazy(() => import('@/pages/VideoStudio'));
const EdenSkye = lazy(() => import('@/pages/EdenSkye'));
const VideoShowcase = lazy(() => import('@/pages/VideoShowcase'));
const SwarmNexus = lazy(() => import('@/pages/SwarmNexus'));
const IdeaEngine = lazy(() => import('@/pages/IdeaEngine'));
const GPTPackage = lazy(() => import('@/pages/GPTPackage'));
const ClientOnboarding = lazy(() => import('@/pages/ClientOnboarding'));
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  // Show nothing while the Supabase session is being restored
  if (isLoadingAuth) {
    return null;
  }

  // Render the main app — public routes render for everyone,
  // protected routes are gated by ProtectedRoute.
  return (
    <Suspense fallback={<div className="p-12 text-center" role="status">Loading…</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/oauth/consent" element={<OAuthConsent />} />
        <Route element={<AgencyLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<AgencyContact />} />
          <Route path="/seo-agency" element={<HomeSEOAgency />} />
          <Route path="/consulting" element={<HomeConsulting />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<SingleProject />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/post/:slug" element={<SinglePost />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/sms-opt-in" element={<SmsOptIn />} />
          <Route path="/whatsapp-opt-in" element={<WhatsAppOptIn />} />
          <Route path="/call-disclosure" element={<CallDisclosure />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fportal" replace />} />}>
            <Route path="/portal" element={<Portal />} />
            <Route path="/portal/benchmark" element={<Benchmark />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fadmin" replace />} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fadmin%2Fvault" replace />} />}>
          <Route path="/admin/vault" element={<AdminVaultPage />} />
        </Route>
        <Route path="/insider" element={<InsiderApp />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fagents" replace />} />}>
          <Route path="/agents" element={<AgentCommandCenter />} />
          <Route path="/agents/:agentName" element={<AgentChatPage />} />
          <Route path="/domains" element={<DomainRegistry />} />
          <Route path="/mission" element={<AutonomousMission />} />
          <Route path="/architect" element={<MetaArchitect />} />
          <Route path="/mission-control" element={<MissionControl />} />
          <Route path="/system-factory" element={<SystemFactory />} />
          <Route path="/batch" element={<BatchOperations />} />
          <Route path="/website-factory" element={<WebsiteFactory />} />
          <Route path="/sandboxes" element={<SandboxManager />} />
          <Route path="/dominance" element={<DigitalDominance />} />
          <Route path="/frontend-factory" element={<FrontendFactory />} />
          <Route path="/factory" element={<FactoryOS />} />
          <Route path="/factory/studio" element={<GeneratorStudio />} />
          <Route path="/factory/runs" element={<FactoryRunConsole />} />
          <Route path="/factory/artifacts" element={<FactoryArtifacts />} />
          <Route path="/factory/validation" element={<FactoryValidation />} />
          <Route path="/factory/repairs" element={<FactoryRepairs />} />
          <Route path="/factory/approvals" element={<FactoryApprovals />} />
          <Route path="/factory/provisioning" element={<FactoryProvisioning />} />
          <Route path="/factory/consulting" element={<FactoryConsulting />} />
          <Route path="/factory/templates" element={<FactoryTemplates />} />
          <Route path="/factory/adapters" element={<FactoryAdapters />} />
          <Route path="/factory/projects" element={<FactoryProjects />} />
          <Route path="/factory/scanner" element={<FactoryScanner />} />
          <Route path="/diagnostic" element={<DiagnosticConsole />} />
          <Route path="/diagnostic/audit/:auditId" element={<AuditDetail />} />
          <Route path="/diagnostic/repairs" element={<RepairPlanConsole />} />
          <Route path="/diagnostic/monitoring" element={<MonitoringConsole />} />
          <Route path="/diagnostic/risks" element={<RiskRegister />} />
          <Route path="/diagnostic/outreach" element={<OutreachConsole />} />
          <Route path="/diagnostic/system-map/:auditId" element={<SystemMapPage />} />
          <Route path="/diagnostic/leaks/:auditId" element={<RevenueLeaksPage />} />
          <Route path="/diagnostic/evidence/:auditId" element={<EvidenceConsole />} />
          <Route path="/diagnostic/system-map" element={<SystemMapPage />} />
          <Route path="/diagnostic/leaks" element={<RevenueLeaksPage />} />
          <Route path="/diagnostic/evidence" element={<EvidenceConsole />} />
          <Route path="/diagnostic/clone" element={<CloneStudio />} />
          <Route path="/comms" element={<CommsInbox />} />
          <Route path="/gallery" element={<VisualGallery />} />
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="/auto-builder" element={<AutoBuilder />} />
          <Route path="/operator" element={<OperatorConsole />} />
          <Route path="/admin/api-generator" element={<ApiGenerator />} />
          <Route path="/admin/api-vault" element={<ApiVaultPage />} />
          <Route path="/video-studio" element={<VideoStudio />} />
          <Route path="/eden" element={<EdenSkye />} />
          <Route path="/videos" element={<VideoShowcase />} />
          <Route path="/swarm-nexus" element={<SwarmNexus />} />
          <Route path="/idea-engine" element={<IdeaEngine />} />
          <Route path="/gpt-package" element={<GPTPackage />} />
          <Route path="/provisioner" element={<SystemProvisioner />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/register?returnTo=%2F" replace />} />}>
          <Route path="/onboarding" element={<ClientOnboarding />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <LegacyToaster richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App