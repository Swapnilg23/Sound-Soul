import React from 'react';

const EFFECTIVE = 'May 1, 2025';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#06060e] text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">Legal</span>
          <h1 className="text-4xl font-black mt-2 mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE}</p>
        </div>

        <Prose>
          <p>
            Sound2Soul Inc. ("Sound2Soul," "we," "us," or "our") is committed to protecting your privacy. This Privacy
            Policy describes how we collect, use, disclose, and safeguard your information when you use our platform and
            services.
          </p>

          <H2>1. Information We Collect</H2>
          <p>We collect information in the following ways:</p>
          <ul>
            <li>
              <strong>Account data:</strong> When you register, we collect your email address, password (hashed), and
              profile information you provide (artist name, bio, avatar).
            </li>
            <li>
              <strong>Creator content metadata:</strong> Track titles, descriptions, AI disclosure information, mood tags,
              genre, and Soul Stories you publish.
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, tracks played, interactions (likes, saves, follows), and other
              platform activity.
            </li>
            <li>
              <strong>Device and technical data:</strong> IP address, browser type, operating system, and referring URLs,
              collected automatically via server logs.
            </li>
            <li>
              <strong>Fan contact data:</strong> Email addresses collected through fan mailing list sign-ups are stored on
              behalf of the creator and are subject to the creator's own privacy practices.
            </li>
          </ul>

          <H2>2. How We Use Your Information</H2>
          <ul>
            <li>To provide, operate, and improve the Services;</li>
            <li>To personalise your experience and surface relevant music;</li>
            <li>To send transactional emails (account verification, password reset, moderation notices);</li>
            <li>To send platform updates and product announcements (you may opt out at any time);</li>
            <li>To enforce our Terms of Service and Creator Guidelines;</li>
            <li>To comply with applicable legal obligations.</li>
          </ul>

          <H2>3. Information Sharing</H2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul>
            <li>
              <strong>Service providers:</strong> Third parties who assist with hosting, analytics, email delivery, and
              payment processing, bound by confidentiality obligations.
            </li>
            <li>
              <strong>Law enforcement:</strong> When required by law, court order, or governmental authority.
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, subject to
              continued protection of your data.
            </li>
          </ul>

          <H2>4. Creator Content & Public Information</H2>
          <p>
            Content you publish on Sound2Soul — including your artist name, tracks, Soul Stories, and profile — is public
            by default and may be indexed by search engines. AI disclosure data and rights certifications you submit are
            displayed publicly on each track page.
          </p>

          <H2>5. Cookies & Tracking</H2>
          <p>
            We use session cookies and localStorage to maintain your authenticated session. We do not currently use
            third-party advertising trackers. You can clear cookies via your browser settings, though this may affect
            platform functionality.
          </p>

          <H2>6. Data Retention</H2>
          <p>
            We retain your account information for as long as your account is active or as needed to provide services.
            If you delete your account, we will delete or anonymise your personal data within 90 days, except where
            retention is required by law.
          </p>

          <H2>7. Your Rights</H2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you;</li>
            <li>Request correction of inaccurate data;</li>
            <li>Request deletion of your data ("right to be forgotten");</li>
            <li>Object to or restrict certain processing;</li>
            <li>Data portability (receive a copy of your data in machine-readable format).</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@sound2soul.com" className="text-violet-400 hover:underline">privacy@sound2soul.com</a>.
            We will respond within 30 days.
          </p>

          <H2>8. Children's Privacy</H2>
          <p>
            Sound2Soul is not directed at children under 13. We do not knowingly collect personal information from
            children under 13. If we learn that we have collected such information, we will delete it promptly.
          </p>

          <H2>9. Security</H2>
          <p>
            We use industry-standard measures including encryption at rest and in transit, hashed passwords, and
            access controls. No method of transmission over the internet is 100% secure; we cannot guarantee absolute
            security.
          </p>

          <H2>10. Changes to This Policy</H2>
          <p>
            We may update this Privacy Policy periodically. We will post the revised policy with a new effective date
            and notify registered users of material changes.
          </p>

          <H2>11. Contact</H2>
          <p>
            Questions about this Privacy Policy? Contact our Privacy Team at{' '}
            <a href="mailto:privacy@sound2soul.com" className="text-violet-400 hover:underline">privacy@sound2soul.com</a>.
          </p>
        </Prose>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-10 mb-3 text-white">{children}</h2>;
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 text-muted-foreground leading-relaxed text-[15px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-white [&_p]:text-muted-foreground">
      {children}
    </div>
  );
}
