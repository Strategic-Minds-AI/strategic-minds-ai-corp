import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/consent'].includes(location.pathname.toLowerCase());

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return null;
  }

  // Keep the platform's access checks while allowing the authentication pages to render.
  if (authError?.type === 'user_not_registered' && !isAuthPage) return <UserNotRegisteredError />;
  if (authError?.type === 'auth_required' && !isAuthPage) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (authError && !['auth_required', 'user_not_registered'].includes(authError.type)) return <p className="p-8 text-center" role="alert">Unable to load the site. Please refresh and try again.</p>;

  // Render the main app
  return (
    <Suspense fallback={<div className="p-12 text-center" role="status">Loading…</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fportal" replace />} />}>
            <Route path="/portal" element={<Portal />} />
            <Route path="/portal/benchmark" element={<Benchmark />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Route>
        <Route path="/insider" element={<InsiderApp />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fagents" replace />} />}>
          <Route path="/agents" element={<AgentCommandCenter />} />
          <Route path="/agents/:agentName" element={<AgentChatPage />} />
          <Route path="/domains" element={<DomainRegistry />} />
          <Route path="/mission" element={<AutonomousMission />} />
          <Route path="/architect" element={<MetaArchitect />} />
          <Route path="/mission-control" element={<MissionControl />} />
          <Route path="/factory" element={<SystemFactory />} />
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
          <Route path="/analytics" element={<Analytics />} />
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