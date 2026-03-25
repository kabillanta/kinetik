import React from "react";
import PageLayout from "@/components/landing/PageLayout";
import { Mail, MessageSquare, Globe } from "lucide-react";

export default function SupportPage() {
  return (
    <PageLayout 
      title="Contact Support" 
      subtitle="Have questions or need assistance? We're here to help you make an impact."
    >
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-primary" />
           </div>
           <h3 className="text-xl font-bold mb-2">Email Support</h3>
           <p className="text-slate-600 mb-4">For general inquiries, account issues, or partnership proposals.</p>
           <a href="mailto:support@kinetik.tech" className="text-primary font-bold">support@kinetik.tech</a>
        </div>

        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
           <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6 text-accent" />
           </div>
           <h3 className="text-xl font-bold mb-2">Community Discord</h3>
           <p className="text-slate-600 mb-4">Join our builder community for real-time help and networking.</p>
           <a href="#" className="text-accent font-bold">Join Discord</a>
        </div>
      </div>

      <section className="mb-12">
        <h2>Frequently Asked Questions</h2>
        <div className="space-y-6 mt-8">
           {[
             { q: "How does the matching work?", a: "We use Neo4j to analyze the skills listed in your profile and compare them against the requirements and technical stack of active events. The result is a percentage match that helps you prioritize which events to apply for." },
             { q: "Is KinetiK free for volunteers?", a: "Yes, KinetiK is and will always be free for individual volunteers. Our mission is to remove barriers to contribution." },
             { q: "How do I list my organization?", a: "Sign up and select 'Organizer' during onboarding. You'll then be able to create a profile for your organization and start posting events." },
           ].map((faq, i) => (
             <div key={i} className="border-b border-slate-100 pb-6 last:border-0">
                <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600 m-0">{faq.a}</p>
             </div>
           ))}
        </div>
      </section>
    </PageLayout>
  );
}
