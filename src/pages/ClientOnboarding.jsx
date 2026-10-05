import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe2,
  Layers3,
  MapPin,
  Palette,
  Rocket,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const services = [
  { icon: BrainCircuit, title: 'AI Strategy & Advisory', text: 'Turn business goals, bottlenecks and opportunities into a practical AI roadmap.' },
  { icon: Bot, title: 'AI Agents & Automation', text: 'Design intelligent agents and workflows that reduce friction and extend your team.' },
  { icon: Layers3, title: 'Websites, Apps & Business Systems', text: 'Build premium digital experiences and the operating systems behind them.' },
  { icon: Database, title: 'Data Intelligence', text: 'Connect useful business data so decisions, workflows and AI can work from stronger context.' },
  { icon: Globe2, title: 'SEO, AEO & GEO', text: 'Improve how your business is discovered across search engines and AI answer experiences.' },
  { icon: Workflow, title: 'Operational Integration', text: 'Connect the tools, approvals, data and processes needed to make the system usable day to day.' },
];

const process = [
  { icon: SearchCheck, title: '1. You share the essentials', text: 'Five guided questions give us the minimum source truth we need without forcing you to write a technical brief.' },
  { icon: Globe2, title: '2. We research the business', text: 'We review lawful public business information, existing digital presence, offers, competitors, technology signals and conversion friction.' },
  { icon: BrainCircuit, title: '3. We build your intelligence profile', text: 'Your answers and verified research become a structured Client Intelligence Profile for strategy and creative work.' },
  { icon: Sparkles, title: '4. We create distinct directions', text: 'We develop genuinely different logo, brand and website or app directions instead of cosmetic variations.' },
  { icon: BadgeCheck, title: '5. You choose the direction', text: 'Nothing moves into the final build until the approved direction becomes the locked visual source truth.' },
  { icon: Rocket, title: '6. We build, test and prepare release', text: 'The selected system is built responsively, previewed, independently validated and repaired before release approval.' },
];

const questions = [
  {
    key: 'business',
    icon: Building2,
    eyebrow: 'BUSINESS',
    title: 'Business name + website / social links',
    prompt: 'What is your business called, and where can we see what already exists?',
    context: 'This gives our AI research process a clean starting point. Include any website, Google Business Profile, Facebook, Instagram, TikTok, LinkedIn, YouTube, store or other useful public link.',
    placeholder: 'Example: Acme Services\nWebsite: https://...\nInstagram: @...\nGoogle Business: ...',
  },
  {
    key: 'products_services',
    icon: Layers3,
    eyebrow: 'OFFER',
    title: 'Products / services',
    prompt: 'What do you sell, deliver or want customers to hire you for?',
    context: 'Focus on the offers that matter most. You can include current products, services, priority offers, memberships, ecommerce, in-person work or future offers you want the system to support.',
    placeholder: 'Example: Primary services, best-selling products, priority offers, future launches...',
  },
  {
    key: 'location_service_area',
    icon: MapPin,
    eyebrow: 'MARKET',
    title: 'Location / service area',
    prompt: 'Where are you based, and where should the business compete for customers?',
    context: 'Location changes search strategy, page architecture, local visibility, service-area content, shipping and market positioning.',
    placeholder: 'Example: Based in Fort Lauderdale. Serving Broward, Miami-Dade and Palm Beach. Nationwide online sales.',
  },
  {
    key: 'ideal_customer_goal',
    icon: Users2,
    eyebrow: 'CUSTOMER + OUTCOME',
    title: 'Ideal customer + primary goal',
    prompt: 'Who do you most want to attract, and what is the number-one result this system should produce?',
    context: 'We design around the action that matters to the business, such as leads, appointments, sales, quote requests, ecommerce, automation, expansion or stronger market authority.',
    placeholder: 'Example: Ideal customer...\nPrimary goal: Generate qualified consultation requests and automate follow-up.',
  },
  {
    key: 'preferred_visual_style',
    icon: Palette,
    eyebrow: 'VISUAL DIRECTION',
    title: 'Preferred visual style + examples',
    prompt: 'What should the brand and digital experience feel like?',
    context: 'You do not need design vocabulary. Share brands, sites, screenshots, colors, styles you like or dislike, or simply describe the feeling: luxury, modern, minimal, bold, technical, elegant, industrial, clean or high-tech.',
    placeholder: 'Example: Premium, dark, modern, metallic, cinematic. I like... I do not like...',
  },
];

const initialAnswers = Object.fromEntries(questions.map((question) => [question.key, '']));

export default function ClientOnboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const current = questions[step];
  const progress = useMemo(() => Math.round(((step + 1) / questions.length) * 100), [step]);
  const currentValue = answers[current.key]?.trim() || '';

  const updateAnswer = (value) => {
    setAnswers((existing) => ({ ...existing, [current.key]: value }));
    setError('');
  };

  const next = () => {
    if (currentValue.length < 2) {
      setError('Add a short answer so we have enough context to continue.');
      return;
    }
    setError('');
    setStep((value) => Math.min(value + 1, questions.length - 1));
  };

  const back = () => {
    setError('');
    setStep((value) => Math.max(value - 1, 0));
  };

  const submit = async () => {
    if (currentValue.length < 2 || pending) {
      if (currentValue.length < 2) setError('Add a short answer so we have enough context to continue.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await base44.functions.invoke('captureAgencyLead', {
        id: crypto.randomUUID(),
        form_type: 'client_onboarding',
        ...answers,
      });
      if (!response?.data?.ok) throw new Error('Submission failed');
      setSuccess(true);
    } catch {
      setError('Your onboarding could not be saved. Your answers are still visible on this page. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Client Onboarding | Strategic Minds AI</title>
        <meta
          name="description"
          content="Start your Strategic Minds AI project with a guided five-question onboarding experience covering your business, offers, market, ideal customer, primary goal and preferred visual direction."
        />
        <meta name="theme-color" content="#020817" />
      </Helmet>

      <main className="sm-cinematic-home sm-onboarding-page">
        <section className="sm-hero sm-onboarding-hero relative isolate overflow-hidden">
          <div className="sm-grid-overlay" aria-hidden="true" />
          <div className="sm-orb sm-orb-one" aria-hidden="true" />
          <div className="sm-orb sm-orb-two" aria-hidden="true" />

          <div className="agency-container relative z-10 grid min-h-[720px] items-center gap-12 py-24 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-3xl">
              <div className="sm-kicker">
                <span className="sm-kicker-dot" />
                STRATEGIC MINDS AI CLIENT ONBOARDING
              </div>
              <h1 className="sm-hero-title sm-onboarding-title">
                Tell us the business.
                <span>We build the intelligence around it.</span>
              </h1>
              <p className="sm-hero-copy">
                No technical brief. No giant questionnaire. Five guided questions give our team and AI systems the source truth needed to research, architect, design and prepare your project.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#start" className="sm-primary-cta">
                  Start the 5-minute intake <ArrowRight size={17} />
                </a>
                <a href="#process" className="sm-secondary-cta">
                  See what happens next
                </a>
              </div>

              <div className="sm-onboarding-proof">
                <span><CheckCircle2 size={16} /> 5 guided questions</span>
                <span><CheckCircle2 size={16} /> AI-assisted research</span>
                <span><CheckCircle2 size={16} /> You approve before build</span>
              </div>
            </div>

            <div className="sm-command-visual sm-onboarding-command" aria-label="Strategic Minds AI client intelligence workflow">
              <div className="sm-command-ring sm-command-ring-a" />
              <div className="sm-command-ring sm-command-ring-b" />
              <div className="sm-command-core">
                <div className="sm-core-mark"><BrainCircuit size={56} strokeWidth={1.25} /></div>
                <strong>CLIENT INTELLIGENCE</strong>
                <span>FROM SOURCE TRUTH TO SYSTEM</span>
              </div>
              <div className="sm-node sm-node-one"><SearchCheck size={22} /><span>RESEARCH</span></div>
              <div className="sm-node sm-node-two"><Sparkles size={22} /><span>BRAND</span></div>
              <div className="sm-node sm-node-three"><Workflow size={22} /><span>SYSTEMS</span></div>
              <div className="sm-node sm-node-four"><Globe2 size={22} /><span>GROWTH</span></div>
            </div>
          </div>
        </section>

        <section className="sm-section sm-section-deep">
          <div className="agency-container">
            <div className="sm-section-heading">
              <p className="sm-kicker">WHAT WE CAN BUILD AROUND YOUR BUSINESS</p>
              <h2>One onboarding. A much bigger operating picture.</h2>
              <p>
                Your answers help us understand which combination of strategy, software, automation, AI, visibility and data can create the most useful outcome for the business.
              </p>
            </div>

            <div className="sm-service-grid">
              {services.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="sm-glass-card">
                  <span className="sm-card-index">0{index + 1}</span>
                  <div className="sm-icon-well"><Icon size={25} strokeWidth={1.5} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="sm-section sm-process-section scroll-mt-24">
          <div className="agency-container">
            <div className="sm-section-heading">
              <p className="sm-kicker">THE PROCESS</p>
              <h2>Five answers become a structured project, not another forgotten form.</h2>
              <p>
                The intake is only the front door. After that, Strategic Minds AI does the research, synthesis, creative development and system planning.
              </p>
            </div>

            <div className="sm-onboarding-process-grid">
              {process.map(({ icon: Icon, title, text }) => (
                <article key={title} className="sm-process-card sm-onboarding-process-card">
                  <div className="sm-icon-well"><Icon size={24} strokeWidth={1.5} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sm-section sm-trust-section">
          <div className="agency-container">
            <div className="sm-trust-shell">
              <div className="sm-trust-lead">
                <p className="sm-kicker">AI-ASSISTED, HUMAN-CONTROLLED</p>
                <h2>We do the heavy lifting. You keep the decisions.</h2>
                <p>
                  Our onboarding is designed to reduce client homework without removing client control. We research what can be verified, label what cannot, and bring creative and system choices back to you before build.
                </p>
                <a href="#start" className="sm-secondary-cta">Begin onboarding</a>
              </div>

              <div className="sm-trust-grid">
                <div><ShieldCheck size={25} /><h3>Verified before assumed</h3><p>Material business findings are separated into verified, inferred, unknown or blocked.</p></div>
                <div><BadgeCheck size={25} /><h3>Approval before build</h3><p>Your selected direction becomes the visual source truth. We do not quietly redesign it later.</p></div>
                <div><SearchCheck size={25} /><h3>Research replaces busywork</h3><p>We use lawful public business information so you are not asked to retype what can be responsibly discovered.</p></div>
                <div><Workflow size={25} /><h3>Built as a system</h3><p>Website, automation, AI, data and growth are planned as connected operating layers when the business needs them.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="start" className="sm-section sm-onboarding-form-section scroll-mt-20">
          <div className="agency-container">
            <div className="sm-onboarding-form-shell">
              <aside className="sm-intake-sidebar">
                <p className="sm-kicker">START YOUR PROJECT</p>
                <h2>Five questions. About five minutes.</h2>
                <p>
                  Short answers are fine. If you are unsure, say so. Our job is to research, organize and turn the answers into useful options.
                </p>

                <div className="sm-intake-progress-label">
                  <span>Question {step + 1} of {questions.length}</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="sm-intake-progress" aria-label={`Onboarding progress ${progress}%`}>
                  <span style={{ width: `${progress}%` }} />
                </div>

                <ol className="sm-intake-step-list">
                  {questions.map((question, index) => (
                    <li key={question.key} className={index === step ? 'is-active' : index < step ? 'is-complete' : ''}>
                      <span>{index < step ? <CheckCircle2 size={15} /> : index + 1}</span>
                      {question.eyebrow}
                    </li>
                  ))}
                </ol>
              </aside>

              <div className="sm-intake-card">
                {success ? (
                  <div className="sm-intake-success" role="status">
                    <div className="sm-success-icon"><CheckCircle2 size={34} /></div>
                    <p className="sm-kicker">INTAKE RECEIVED</p>
                    <h2>Your source truth is now ready for the next stage.</h2>
                    <p>
                      The next workflow is research, Client Intelligence Profile, creative directions and your selection. Nothing moves into the final build until a direction is approved.
                    </p>
                    <Link to="/" className="sm-secondary-cta">Return to Strategic Minds AI</Link>
                  </div>
                ) : (
                  <>
                    <div className="sm-intake-question-head">
                      <div className="sm-icon-well"><current.icon size={25} strokeWidth={1.5} /></div>
                      <div>
                        <p className="sm-kicker">{current.eyebrow}</p>
                        <h2>{current.title}</h2>
                      </div>
                    </div>

                    <p className="sm-intake-prompt">{current.prompt}</p>
                    <p className="sm-intake-context">{current.context}</p>

                    <label className="sr-only" htmlFor={`onboarding-${current.key}`}>{current.title}</label>
                    <textarea
                      id={`onboarding-${current.key}`}
                      value={answers[current.key]}
                      onChange={(event) => updateAnswer(event.target.value)}
                      className="sm-intake-textarea"
                      placeholder={current.placeholder}
                      rows={8}
                      maxLength={5000}
                      disabled={pending}
                      autoFocus
                    />

                    {error && <p className="sm-intake-error" role="alert">{error}</p>}

                    <div className="sm-intake-actions">
                      <button type="button" className="sm-secondary-cta" onClick={back} disabled={step === 0 || pending}>
                        <ChevronLeft size={17} /> Back
                      </button>
                      {step < questions.length - 1 ? (
                        <button type="button" className="sm-primary-cta" onClick={next} disabled={pending}>
                          Continue <ChevronRight size={17} />
                        </button>
                      ) : (
                        <button type="button" className="sm-primary-cta" onClick={submit} disabled={pending}>
                          {pending ? 'Saving your onboarding...' : 'Submit onboarding'} <ArrowRight size={17} />
                        </button>
                      )}
                    </div>

                    <p className="sm-intake-privacy">
                      Do not include passwords, API keys, financial account credentials or other secrets. This intake is for business context and project direction.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="sm-section sm-cta-section">
          <div className="agency-container">
            <div className="sm-final-cta">
              <div className="sm-final-glow" aria-hidden="true" />
              <div className="relative z-10 max-w-3xl">
                <p className="sm-kicker">WHAT HAPPENS AFTER SUBMISSION</p>
                <h2>Your answers become the starting point, not the final strategy.</h2>
                <p>
                  Strategic Minds AI can continue through public-business enrichment, Client Intelligence Profile, distinct logo and brand directions, website or app directions, selection, mockup lock, build, preview, independent validation and release approval.
                </p>
              </div>
              <div className="relative z-10">
                <a href="#start" className="sm-primary-cta">Start now <ArrowRight size={17} /></a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
