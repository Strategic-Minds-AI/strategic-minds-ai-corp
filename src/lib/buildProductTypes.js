// buildProductTypes.js — Product type definitions for the AutoBuilder.
// Each product type has its own pipeline of steps.

export const PRODUCT_TYPE_OPTIONS = [
  {
    value: "marketing_site",
    label: "Marketing Website",
    description: "Premium marketing website with SEO, content, brand, and social media",
    icon: "Globe",
    steps: ["profile", "vision", "strategy", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"],
  },
  {
    value: "web_app",
    label: "Web Application",
    description: "SaaS/app with auth, database, and full system architecture",
    icon: "Code",
    steps: ["profile", "vision", "strategy", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"],
  },
  {
    value: "ecommerce",
    label: "E-Commerce Store",
    description: "Online store with product catalog, checkout, and payments",
    icon: "ShoppingCart",
    steps: ["profile", "vision", "strategy", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"],
  },
  {
    value: "platform",
    label: "Platform / Marketplace",
    description: "Multi-sided marketplace with user roles and transactions",
    icon: "Layers",
    steps: ["profile", "vision", "strategy", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"],
  },
];

export const STEP_LABELS = {
  profile: "Business Profile",
  vision: "Vision Document",
  strategy: "Strategy Document",
  names: "Business Names",
  content: "Content Generation",
  logo: "Logo Design",
  brand: "Brand Pack",
  website: "Website Design",
  social: "Social Media",
  video: "Video Concepts",
  review: "Review & Approve",
  architecture: "System Architecture",
  data_model: "Data Model",
  ui_system: "UI Design System",
  codegen: "Code Generation",
  deploy: "Deployment Config",
  system_review: "System Review",
  complete: "Complete",
};

export const STATUS_COLORS = {
  queued: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  complete: "bg-green-500/10 text-green-400 border-green-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
};

export const GOVERNANCE_LABELS = {
  green: "Fully Automatic",
  yellow: "Pause Before Deploy",
  red: "Pause Every Step",
};