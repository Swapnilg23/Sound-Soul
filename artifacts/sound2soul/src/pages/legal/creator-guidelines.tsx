import React from 'react';

const EFFECTIVE = 'May 1, 2025';

export default function CreatorGuidelines() {
  return (
    <div className="min-h-screen bg-[#06060e] text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">Legal</span>
          <h1 className="text-4xl font-black mt-2 mb-3">Creator Guidelines</h1>
          <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE}</p>
        </div>

        <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-5 mb-10">
          <p className="text-sm text-violet-300/80 leading-relaxed">
            Sound2Soul is built on trust. These guidelines exist not to restrict creativity, but to protect creators,
            listeners, and the community from harm. If you have questions about whether something is allowed, email us
            before publishing.
          </p>
        </div>

        <Prose>

          <H2>1. Original & Rights-Cleared Content Only</H2>
          <p>Only publish music you have the right to distribute. This means:</p>
          <ul>
            <li>You created the track yourself (with or without AI assistance);</li>
            <li>You hold or have licensed all elements — samples, stems, beats, cover art, and lyrics;</li>
            <li>Your AI tool's terms of service permit commercial or public distribution of the output;</li>
            <li>You have not reproduced another artist's work without their consent.</li>
          </ul>

          <H2>2. Honest AI Disclosure</H2>
          <p>
            Every track must carry an accurate AI disclosure. Refer to our{' '}
            <a href="/legal/ai-policy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
              AI Usage Policy
            </a>{' '}
            for full details. Misrepresenting AI involvement is the single fastest way to have your account terminated.
          </p>

          <H2>3. Prohibited Content</H2>
          <p>The following content is never permitted on Sound2Soul:</p>
          <ul>
            <li>Content that promotes hate, violence, or discrimination based on race, ethnicity, gender, sexual
              orientation, religion, disability, or national origin;</li>
            <li>Music that glorifies, instructs in, or incites illegal activity;</li>
            <li>Sexual content involving minors, or any content that sexualises individuals without consent;</li>
            <li>Content that threatens, harasses, or doxes any individual;</li>
            <li>Deepfakes or voice clones of real people without documented consent;</li>
            <li>Malicious code, spam, or phishing distributed through track descriptions or links.</li>
          </ul>

          <H2>4. Respectful Community</H2>
          <p>
            Sound2Soul is a place for creators to grow. You may not:
          </p>
          <ul>
            <li>Impersonate another creator, artist, or public figure;</li>
            <li>Use fake play counts, purchased followers, or engagement manipulation;</li>
            <li>Leave defamatory, abusive, or harassing Soul Stories or comments on others' tracks;</li>
            <li>Submit false reports against other creators in bad faith.</li>
          </ul>

          <H2>5. Sensitive & Explicit Content</H2>
          <p>
            Tracks with explicit language must be flagged as explicit during upload. Content dealing with sensitive
            themes (self-harm, substance use) must be handled thoughtfully — it may be permitted with appropriate
            context but will be reviewed by moderators. Contact us in advance if you are unsure.
          </p>

          <H2>6. Soul Stories & Authenticity</H2>
          <p>
            Soul Stories are the emotional origin of your track — they are expected to be genuine. AI-generated Soul
            Stories are permitted only if they are disclosed as such. Fabricated or misleading Soul Stories that
            deceive listeners about your creative process may result in content removal.
          </p>

          <H2>7. Copyright Disputes</H2>
          <p>
            If you believe a track on Sound2Soul infringes your copyright, please submit a DMCA notice to{' '}
            <a href="mailto:dmca@sound2soul.com" className="text-violet-400 hover:underline">dmca@sound2soul.com</a>.
            Include your name, contact information, a description of the copyrighted work, and the URL of the infringing
            content. We will respond within 72 hours.
          </p>

          <H2>8. Consequences of Violations</H2>
          <p>Depending on severity, violations may result in:</p>
          <ul>
            <li>A warning and request to edit or remove content;</li>
            <li>Temporary suspension of publishing privileges;</li>
            <li>Permanent account termination and removal of all associated content;</li>
            <li>Referral to law enforcement where applicable.</li>
          </ul>
          <p>
            Repeat violations are treated more severely. We do not reset violation records.
          </p>

          <H2>9. Appeals</H2>
          <p>
            If your content was removed or your account was actioned and you believe it was in error, you may appeal
            to{' '}
            <a href="mailto:moderation@sound2soul.com" className="text-violet-400 hover:underline">moderation@sound2soul.com</a>{' '}
            within 14 days of the action. Include your account email and a clear explanation of your appeal.
          </p>

          <H2>10. Contact</H2>
          <p>
            Have questions about these guidelines? We are happy to help before you publish. Reach us at{' '}
            <a href="mailto:creators@sound2soul.com" className="text-violet-400 hover:underline">creators@sound2soul.com</a>.
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
