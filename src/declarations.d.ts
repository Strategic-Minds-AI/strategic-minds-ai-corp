// Ambient module declarations for JSX components imported from TSX files.
// These .jsx files don't have their own type declarations; wildcards cover
// all current and future .jsx imports from these directories without losing
// runtime behavior. TypeScript resolves real files first, so .tsx modules
// in the same paths are unaffected.
declare module "@/components/agency/*";
declare module "@/components/services/*";
declare module "@/components/commerce/*";