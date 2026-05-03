import React from 'react';

const EFFECTIVE = 'May 1, 2025';
const COMPANY = 'Sound2Soul Inc.';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#06060e] text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">Legal</span>
          <h1 className="text-4xl font-black mt-2 mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE}</p>
        </div>

        <Prose>
          <p>
            Welcome to Sound2Soul. These Terms of Service ("Terms") govern your access to and use of the Sound2Soul
            platform, including our website, applications, and services (collectively, the "Services"), operated by {COMPANY} ("Sound2Soul," "we," "us," or "our").
          </p>
          <p>
            By creating an account or otherwise accessing the Services, you agree to be bound by these Terms and our
            Privacy Policy. If you do not agree, do not use the Services.
          </p>

          <H2>1. Eligibility</H2>
          <p>
            You must be at least 13 years of age to use Sound2Soul. If you are under 18, you represent that your parent or
            legal guardian has reviewed and agreed to these Terms on your behalf. We reserve the right to refuse access to
            anyone for any reason at any time.
          </p>

          <H2>2. Account Registration</H2>
          <p>
            To access certain features, you must register for an account. You agree to provide accurate, current, and
            complete information and to keep your account credentials confidential. You are responsible for all activity
            that occurs under your account. Sound2Soul is not liable for any losses caused by unauthorised use of your
            account.
          </p>

          <H2>3. Creator Content</H2>
          <p>
            "Creator Content" means any audio files, images, text, Soul Stories, tags, or other material you upload or
            publish to Sound2Soul.
          </p>
          <ul>
            <li><strong>You retain ownership.</strong> Sound2Soul does not claim ownership of your Creator Content.</li>
            <li>
              <strong>You grant us a licence.</strong> By publishing Creator Content, you grant Sound2Soul a worldwide,
              non-exclusive, royalty-free, sublicensable licence to host, stream, display, reproduce, and distribute your
              Creator Content solely for the purpose of operating and improving the Services.
            </li>
            <li>
              <strong>You represent and warrant</strong> that (a) you own or control all rights in your Creator Content,
              (b) your Creator Content does not infringe any third-party rights, and (c) your AI disclosure declaration is
              accurate and complete.
            </li>
          </ul>

          <H2>4. AI Disclosure Obligation</H2>
          <p>
            Sound2Soul is the AI Music Trust Profile and Pre-Distribution Readiness Layer for AI-assisted music creators. All creators are required to accurately disclose the extent of AI
            involvement in each uploaded track. Misrepresentation of AI usage is a material breach of these Terms and may
            result in immediate account termination.
          </p>

          <H2>5. Prohibited Conduct</H2>
          <p>You may not use the Services to:</p>
          <ul>
            <li>Upload content that infringes copyrights, trademarks, or other intellectual property rights;</li>
            <li>Publish content that is defamatory, harassing, hateful, or illegal;</li>
            <li>Misrepresent your identity, AI usage, or rights to publish a track;</li>
            <li>Reverse-engineer, scrape, or systematically download platform content;</li>
            <li>Circumvent or attempt to circumvent moderation systems;</li>
            <li>Use the Services for any unlawful purpose or in violation of any applicable law.</li>
          </ul>

          <H2>6. Moderation</H2>
          <p>
            Sound2Soul reserves the right to review, reject, remove, or restrict access to any Creator Content at our sole
            discretion, including content that violates these Terms or our Creator Guidelines. We may suspend or terminate
            accounts that repeatedly violate these Terms.
          </p>

          <H2>7. Monetisation</H2>
          <p>
            Monetisation features for creators are currently in development and governed by separate terms published at
            the time of launch. Sound2Soul makes no representation regarding future earning potential on the platform.
          </p>

          <H2>8. Intellectual Property</H2>
          <p>
            The Sound2Soul name, logo, UI design, and all platform technology are the exclusive property of {COMPANY}. Nothing in these Terms grants you any right to use our brand assets without prior written consent.
          </p>

          <H2>9. Disclaimer of Warranties</H2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED. SOUND2SOUL DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL
            COMPONENTS.
          </p>

          <H2>10. Limitation of Liability</H2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, SOUND2SOUL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES.
          </p>

          <H2>11. Governing Law</H2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of
            law principles. Any disputes shall be resolved exclusively in the courts of Delaware.
          </p>

          <H2>12. Changes to Terms</H2>
          <p>
            We may update these Terms from time to time. We will notify registered users of material changes via email or
            in-app notice. Continued use of the Services after the effective date of revised Terms constitutes your
            acceptance of those changes.
          </p>

          <H2>13. Contact</H2>
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@sound2soul.com" className="text-violet-400 hover:underline">legal@sound2soul.com</a>.
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
