import React from 'react';

// Shared layout for legal pages (Terms, Privacy, SMS Policy).
// Renders children in a centered, readable column with consistent typography.
export default function LegalContent({ lastUpdated, children }) {
  return (
    <section className="agency-container py-12 lg:py-20">
      <div className="mx-auto max-w-3xl">
        {lastUpdated && (
          <p className="mb-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        )}
        <div className="legal-content space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-primary [&_a]:text-primary [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:font-semibold [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </section>
  );
}