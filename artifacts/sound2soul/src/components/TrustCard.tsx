import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateDistributionReadiness, calculateTrackDisclosure } from '@/lib/trustScore';
import { TrackDisclosureBadge } from '@/components/TrustScoreBadge';

interface TrustCardProps {
  title?: string;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  genre?: string | null;
  moodTags?: string[] | null;
  aiInvolvementType?: string;
  humanContributionChecklist?: Record<string, unknown>;
  rightsConfirmation?: Record<string, unknown>;
  soulStory?: string;
  releaseNotes?: Record<string, unknown> | null;
  releaseNotesPublic?: boolean;
  externalDistributionLinks?: string[] | null;
}

export const TrustCard: React.FC<TrustCardProps> = ({
  aiInvolvementType,
  humanContributionChecklist,
  rightsConfirmation,
  soulStory,
  releaseNotes,
  releaseNotesPublic = true,
  title,
  audioUrl,
  coverImageUrl,
  genre,
  moodTags,
  externalDistributionLinks,
}) => {
  const disclosure = calculateTrackDisclosure({
    aiInvolvementType,
    rightsConfirmation,
    soulStory,
  });
  const notes = releaseNotes && typeof releaseNotes === 'object' ? releaseNotes : null;
  const publicNotes = releaseNotesPublic && notes ? notes : null;
  const notesSummary = publicNotes
    ? {
        aiToolsUsed: Array.isArray(notes?.aiToolsUsed) ? notes.aiToolsUsed : [],
        aiHelpedCreate: Array.isArray(notes?.aiHelpedCreate) ? notes.aiHelpedCreate : [],
        humanContributed: Array.isArray(notes?.humanContributed) ? notes.humanContributed : [],
        sourceMaterialNotes: typeof notes?.sourceMaterialNotes === 'string' ? notes.sourceMaterialNotes : '',
        vocalIdentityNotes: typeof notes?.vocalIdentityNotes === 'string' ? notes.vocalIdentityNotes : '',
        coverArtSource: typeof notes?.coverArtSource === 'string' ? notes.coverArtSource : '',
        finalAudioVersion: typeof notes?.finalAudioVersion === 'string' ? notes.finalAudioVersion : '',
        distributionStatus: typeof notes?.distributionStatus === 'string' ? notes.distributionStatus : '',
        releasePlanNotes: typeof notes?.releasePlanNotes === 'string' ? notes.releasePlanNotes : '',
      }
    : null;
  const readiness = calculateDistributionReadiness({
    title,
    audioUrl,
    coverImageUrl,
    genre,
    moodTags,
    aiInvolvementType,
    rightsConfirmation,
    soulStory,
    humanContributionChecklist,
    releaseNotes,
    externalDistributionLinks,
  });

  return (
    <Card className="bg-card/40 border-white/10 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Distribution Readiness
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Release Profile Completeness</p>
              <p className="text-sm text-muted-foreground">Creator-provided information for release preparation</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tabular-nums">{readiness.score}%</div>
              <p className="text-[10px] text-muted-foreground">{readiness.completed}/{readiness.total} complete</p>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full" style={{ width: `${readiness.score}%` }} />
          </div>
        </div>

        {/* Disclosure score badge */}
        <TrackDisclosureBadge disclosure={disclosure} />

        {/* AI Involvement */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Involvement
          </div>
          <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-2 rounded-xl border border-primary/20">
            {aiInvolvementType || 'Not specified'}
          </div>
        </div>

        {/* Human contribution */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Human Contribution
          </div>
          <div className="bg-background/50 rounded-xl p-3 text-sm text-muted-foreground border border-white/6">
            {humanContributionChecklist && Object.keys(humanContributionChecklist).length > 0
              ? 'Human curation and editing confirmed by creator.'
              : 'Creator has verified their human contributions.'}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          Release Notes
          </div>
          <div className="bg-background/50 rounded-xl p-3 text-sm text-muted-foreground border border-white/6 space-y-2">
            <p>{publicNotes ? 'Release notes summary available' : 'Release notes not shared publicly'}</p>
            {publicNotes && (
              <ul className="text-xs space-y-1">
                <li>AI tools disclosed: {notesSummary?.aiToolsUsed.length ? 'Yes' : 'No'}</li>
                <li>AI role disclosed: {notesSummary?.aiHelpedCreate.length ? 'Yes' : 'No'}</li>
                <li>Human contribution listed: {notesSummary?.humanContributed.length ? 'Yes' : 'No'}</li>
                <li>Vocal/source notes available: {notesSummary?.vocalIdentityNotes || notesSummary?.sourceMaterialNotes ? 'Yes' : 'No'}</li>
                <li>Distribution status: {notesSummary?.distributionStatus || 'Not specified'}</li>
              </ul>
            )}
          </div>
        </div>

        {/* Rights */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Creator-Certified Rights
          </div>
          <div className={`rounded-xl p-3 text-sm font-medium border
            ${disclosure.hasRights
              ? 'bg-secondary/10 text-secondary border-secondary/20'
              : 'bg-white/4 text-muted-foreground border-white/6'
            }`}
          >
            {disclosure.hasRights ? 'Creator-certified rights confirmed' : 'Rights not yet confirmed'}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/50 pt-1 border-t border-white/5 leading-relaxed">
          This information is provided by the creator. Sound2Soul does not provide legal clearance or copyright verification.
        </p>
      </CardContent>
    </Card>
  );
};
