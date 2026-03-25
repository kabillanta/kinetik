import React from "react";
import PageLayout from "@/components/landing/PageLayout";

export default function TermsPage() {
  return (
    <PageLayout 
      title="Terms of Service" 
      subtitle="By using KinetiK, you agree to build responsibly and respect our community standards."
    >
      <section className="mb-12">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using KinetiK, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
        </p>
      </section>

      <section className="mb-12">
        <h2>2. Community Standards</h2>
        <p>
          KinetiK is a professional platform. You agree to:
        </p>
        <ul>
          <li>Provide accurate information on your profile and applications.</li>
          <li>Honor your commitments to organizers once accepted.</li>
          <li>Maintain a respectful and inclusive environment in all communications.</li>
        </ul>
        <p>
          Harassment, spamming, or providing false information will result in immediate account termination.
        </p>
      </section>

      <section className="mb-12">
        <h2>3. Intellectual Property</h2>
        <p>
          KinetiK does not claim ownership of the work you do for volunteers or organizations. Ownership and licensing of code or designs created during events are governed by the specific event's rules or project's license.
        </p>
      </section>

      <section className="border-t border-slate-100 pt-12 text-sm text-slate-500">
        Last Updated: March 25, 2026
      </section>
    </PageLayout>
  );
}
