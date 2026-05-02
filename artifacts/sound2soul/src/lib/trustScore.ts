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
    aiInvolvementType?: string | null;
    rightsConfirmation?: Record<string, unknown> | null;
    soulStory?: string | null;
    humanContributionChecklist?: Record<string, unknown> | null;
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
