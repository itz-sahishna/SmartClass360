'use client';

import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';

const roleLabels = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
} as const;

const pageContent = {
  faqs: {
    title: 'FAQs',
    subtitle: 'Common answers for everyday SmartClass 360 tasks.',
    items: [
      {
        heading: 'How do I update my profile information?',
        body: 'Admins can save profile changes directly. Teachers and students can submit update requests for admin review.',
      },
      {
        heading: 'Can I sign in with my roll number?',
        body: 'Students can use email, phone number, or roll number as their login identifier.',
      },
      {
        heading: 'Where can I find assignments and notifications?',
        body: 'Use the sidebar to open assignments, exams, notifications, and subject-specific pages for your role.',
      },
    ],
  },
  help: {
    title: 'Help & Support',
    subtitle: 'Guidance for profile updates, classroom actions, and issue reporting.',
    items: [
      {
        heading: 'Need profile help?',
        body: 'Open your profile page to review the current information and either save it directly or submit a request, depending on your role.',
      },
      {
        heading: 'Something looks incorrect?',
        body: 'For attendance, marks, or account details, use the relevant request flow so the change is reviewed and tracked.',
      },
      {
        heading: 'Need technical support?',
        body: 'Contact the SmartClass 360 administrator or institute support desk with the exact module and action that failed.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Settings',
    subtitle: 'How account details, notifications, and academic activity are handled.',
    items: [
      {
        heading: 'Who can see my data?',
        body: 'Access is role-based. Admins can manage the platform, teachers see their assigned classes and subjects, and students see only their own academic records.',
      },
      {
        heading: 'Are requests tracked?',
        body: 'Yes. Profile and attendance-related requests are stored with status history so approvals and rejections remain auditable.',
      },
      {
        heading: 'Can I change notification preferences?',
        body: 'Yes. Use your profile or preferences pages to control email and push notification behavior.',
      },
    ],
  },
  preferences: {
    title: 'Preferences',
    subtitle: 'Personalize your SmartClass 360 experience.',
    items: [
      {
        heading: 'Theme',
        body: 'Use the profile dropdown to switch between light and dark mode instantly.',
      },
      {
        heading: 'Notifications',
        body: 'Adjust your profile preferences to control the types of academic and system notifications you receive.',
      },
      {
        heading: 'Account behavior',
        body: 'Role-based routing, dashboard access, and request workflows are tailored to your module automatically.',
      },
    ],
  },
} as const;

export default function ModuleInfoPage({
  role,
  page,
}: {
  role: 'admin' | 'teacher' | 'student';
  page: keyof typeof pageContent;
}) {
  const content = pageContent[page];

  return (
    <AppShell
      role={role}
      title={`${roleLabels[role]} ${content.title}`}
      subtitle={content.subtitle}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {content.items.map((item) => (
          <Panel key={item.heading}>
            <PanelHeader title={item.heading} />
            <p className="px-6 pb-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.body}
            </p>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
