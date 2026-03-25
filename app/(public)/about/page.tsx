import React from "react";
import PageLayout from "@/components/landing/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout
      title="Our Mission"
      subtitle="KinetiK is more than a platform it's a movement to accelerate community impact through technology."
    >
      <section className="mb-12">
        <h2>Who We Are</h2>
        <p>
          Founded on the principle that many hands make light work, KinetiK was
          born from the realization that millions of researchers, developers,
          and designers want to volunteer their time but struggle to find the
          right opportunities.
        </p>
        <p>
          We are a team of passionate builders who believe that the bridge
          between talent and impact should be seamless, intelligent, and
          rewarding.
        </p>
      </section>

      <section className="mb-12">
        <h2>How We Help</h2>
        <p>
          By leveraging state-of-the-art graph database technology (Neo4j),
          we've built a matching engine that understands the complex
          relationships between skills, professional interests, and project
          requirements.
        </p>
        <ul>
          <li>
            <strong>For Volunteers:</strong> We provide personalized
            recommendations that respect your time and expertise.
          </li>
          <li>
            <strong>For Organizers:</strong> We eliminate the overhead of manual
            screening by delivering a pool of verified, high-fit applicants.
          </li>
          <li>
            <strong>For the Community:</strong> We create a transparent record
            of impact hours and successful collaborations.
          </li>
        </ul>
      </section>

      <section className="mb-12 border-t border-slate-100 pt-12">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 italic text-slate-700 text-center">
          "Our goal is to ensure that no great idea or community project ever
          stalls because they couldn't find the right hands to build it."
        </div>
      </section>
    </PageLayout>
  );
}
