import React from 'react';
import { useApp } from '../context/AppContext';

export default function HelpPage() {
  const { navigate } = useApp();

  return (
    <div className="p-space-md lg:p-space-lg max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
          Help &amp; Student Resources
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Frequently asked questions, interview guides, and platform tutorials.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            q: 'How is the AI Match Score calculated?',
            a: 'Our algorithm weighs your verified coursework from your college transcript, technical tags found in your GitHub projects, and skills extracted from your uploaded resume against the strict requirements and preferred qualifications of each internship listing.'
          },
          {
            q: 'Can I apply directly through InternAI?',
            a: 'Yes! Clicking "Apply with Tailored Resume" formats your profile into a verified candidate package and forwards it directly to the engineering team. It also automatically logs the application into your Kanban Tracker.'
          },
          {
            q: 'How do I improve my AI Readiness Score?',
            a: 'Your Readiness Score increases as you complete Roadmap Milestone tasks, verify GitHub repositories with unit tests, and implement suggested resume bullet improvements.'
          },
          {
            q: 'How does the Mock Interview room work?',
            a: 'The Mock Interview environment simulates a real technical screen. You can practice responding by voice or text. Our evaluator scores your technical accuracy, communication clarity, and architectural depth in real time.'
          }
        ].map((faq, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-2">
            <h3 className="font-title-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">help</span>
              {faq.q}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
