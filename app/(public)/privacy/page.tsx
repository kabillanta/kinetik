import React from "react";
import PageLayout from "@/components/landing/PageLayout";

export default function PrivacyPage() {
  return (
    <PageLayout 
      title="Privacy Policy" 
      subtitle="Your privacy is core to our trust model. We've simplified our policy so it's transparent and easy to understand."
    >
      <section className="mb-12">
        <h2>1. Information We Collect</h2>
        <p>
          To provide high-quality matching, we collect information you voluntarily provide, including:
        </p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, and authentication data via Firebase.</li>
          <li><strong>Profile Data:</strong> Skills, interests, portfolio links, and professional experience.</li>
          <li><strong>Activity Data:</strong> Applications submitted, event participation, and impact hours contributed.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>2. How We Use Your Data</h2>
        <p>
          We use your data exclusively to:
        </p>
        <ul>
          <li>Compute match scores using our Graph Recommendation engine.</li>
          <li>Enable communication between volunteers and event organizers.</li>
          <li>Generate impact reports and community statistics.</li>
          <li>Improve our platform's algorithms and user experience.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>3. Data Sharing and Security</h2>
        <p>
          We do not sell your personal data. We only share information with event organizers when you explicitly apply to an event. Your data is protected using industry-standard encryption and Firebase security protocols.
        </p>
      </section>

      <section className="border-t border-slate-100 pt-12 text-sm text-slate-500">
        Last Updated: March 25, 2026
      </section>
    </PageLayout>
  );
}
