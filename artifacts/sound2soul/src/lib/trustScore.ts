export interface TrustScoreInput {
  profile: {
    bio?: string | null;
    creatorStatement?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    genres?: string[] | null;
    aiToolsUsed?: string[] | null;
  };
  tracks: Array<{
    title?: string | null;
    audioUrl?: string | null;
    coverImageUrl?: string | null;
    genre?: string | null;
    moodTags?: string[] | null;
    aiInvolvementType?: string | null;
    rightsConfirmation?: Record<string, unknown> | null;
    soulStory?: string | null;
    humanContributionChecklist?: Record<string, unknown> | null;
    releaseNotes?: Record<string, unknown> | null;
    releaseNotesPublic?: boolean | null;
    externalDistributionLinks?: string[] | null;
  }>;
}

export type TrustTier = 'verified' | 'trusted' | 'building' | 'starting';

export interface TrustScore {
  score: number;
  tier: TrustTier;
  label: string;
  profilePoints: number;
  disclosurePoints: number;
  maxProfile: number;
  maxDisclosure: number;
}

export function calculateTrustScore(input: TrustScoreInput): TrustScore {
  const { profile, tracks } = input;

  // ── Profile completeness (40 pts max) ──────────────────────────
  let profilePoints = 0;
  if (profile.avatarUrl) profilePoints += 10;
  if (profile.bio && profile.bio.trim().length > 15) profilePoints += 10;
  if (profile.creatorStatement && profile.creatorStatement.trim().length > 15) profilePoints += 10;
  if (profile.aiToolsUsed && profile.aiToolsUsed.length > 0) profilePoints += 5;
  if (profile.genres && profile.genres.length > 0) profilePoints += 5;

  // ── Track disclosure quality (60 pts max, averaged) ─────────────
  let disclosurePoints = 0;
  if (tracks.length > 0) {
    const totalRaw = tracks.reduce((sum, track) => {
      let t = 0;
      if (track.aiInvolvementType && track.aiInvolvementType.trim().length > 0) t += 20;
      if (track.rightsConfirmation && Object.keys(track.rightsConfirmation).length > 0) t += 20;
      if (track.soulStory && track.soulStory.trim().length > 15) t += 20;
      return sum + t;
    }, 0);
    const avgPerTrack = totalRaw / tracks.length;
    disclosurePoints = Math.round((avgPerTrack / 60) * 60);
  }

  const score = Math.min(100, profilePoints + disclosurePoints);

  let tier: TrustTier;
  let label: string;
  if (score >= 90) { tier = 'verified'; label = 'Verified Transparent'; }
  else if (score >= 70) { tier = 'trusted'; label = 'Trusted Creator'; }
  else if (score >= 50) { tier = 'building'; label = 'Building Trust'; }
  else { tier = 'starting'; label = 'Getting Started'; }

  return {
    score,
    tier,
    label,
    profilePoints,
    disclosurePoints,
    maxProfile: 40,
    maxDisclosure: 60,
  };
}

export interface TrackDisclosureScore {
  score: number;
  tier: TrustTier;
  label: string;
  hasAiDisclosure: boolean;
  hasRights: boolean;
  hasSoulStory: boolean;
}

export interface DistributionReadinessScore {
  score: number;
  completed: number;
  total: number;
  requiredComplete: boolean;
  optionalComplete: boolean;
  items: Array<{
    key: string;
    label: string;
    required: boolean;
    done: boolean;
  }>;
}

export function calculateTrackDisclosure(track: {
  aiInvolvementType?: string | null;
  rightsConfirmation?: Record<string, unknown> | null;
  soulStory?: string | null;
}): TrackDisclosureScore {
  const hasAiDisclosure = !!(track.aiInvolvementType?.trim());
  const hasRights = !!(track.rightsConfirmation && Object.keys(track.rightsConfirmation).length > 0);
  const hasSoulStory = !!(track.soulStory && track.soulStory.trim().length > 15);

  const score = (hasAiDisclosure ? 34 : 0) + (hasRights ? 33 : 0) + (hasSoulStory ? 33 : 0);

  let tier: TrustTier;
  let label: string;
  if (score >= 90) { tier = 'verified'; label = 'Fully Disclosed'; }
  else if (score >= 60) { tier = 'trusted'; label = 'Mostly Disclosed'; }
  else if (score >= 30) { tier = 'building'; label = 'Partially Disclosed'; }
  else { tier = 'starting'; label = 'Minimal Disclosure'; }

  return { score, tier, label, hasAiDisclosure, hasRights, hasSoulStory };
}

export function calculateDistributionReadiness(track: {
  title?: string | null;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  genre?: string | null;
  moodTags?: string[] | null;
  aiInvolvementType?: string | null;
  rightsConfirmation?: Record<string, unknown> | null;
  soulStory?: string | null;
  humanContributionChecklist?: Record<string, unknown> | null;
  releaseNotes?: Record<string, unknown> | null;
  externalDistributionLinks?: string[] | null;
}): DistributionReadinessScore {
  const items = [
    { key: 'audio', label: 'Final audio uploaded', required: true, done: !!track.audioUrl },
    { key: 'cover', label: 'Cover art uploaded', required: true, done: !!track.coverImageUrl },
    { key: 'title', label: 'Track title completed', required: true, done: !!track.title?.trim() },
    { key: 'genre', label: 'Genre selected', required: true, done: !!track.genre?.trim() },
    { key: 'mood', label: 'Mood tags added', required: true, done: !!(track.moodTags && track.moodTags.length > 0) },
    { key: 'soulStory', label: 'Soul Story completed', required: true, done: !!(track.soulStory && track.soulStory.trim().length > 15) },
    { key: 'ai', label: 'AI involvement disclosed', required: true, done: !!track.aiInvolvementType?.trim() },
    { key: 'human', label: 'Human contribution documented', required: true, done: !!(track.humanContributionChecklist && Object.keys(track.humanContributionChecklist).length > 0) },
    { key: 'rights', label: 'Rights self-certification completed', required: true, done: !!(track.rightsConfirmation && Object.keys(track.rightsConfirmation).length > 0) },
    { key: 'notes', label: 'Release notes completed', required: false, done: !!(track.releaseNotes && Object.keys(track.releaseNotes).length > 0) },
    { key: 'links', label: 'External distribution links added', required: false, done: !!(track.externalDistributionLinks && track.externalDistributionLinks.length > 0) },
  ];
  const required = items.filter(item => item.required);
  const optional = items.filter(item => !item.required);
  const completed = items.filter(item => item.done).length;
  const requiredComplete = required.every(item => item.done);
  const optionalComplete = optional.every(item => item.done);
  const score = Math.round((required.filter(item => item.done).length / required.length) * 100);
  return { score, completed, total: items.length, requiredComplete, optionalComplete, items };
}
