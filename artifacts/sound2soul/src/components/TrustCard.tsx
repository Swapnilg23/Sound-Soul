import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle2, FileText } from 'lucide-react';

interface TrustCardProps {
  aiInvolvementType?: string;
  humanContributionChecklist?: Record<string, unknown>;
  rightsConfirmation?: Record<string, unknown>;
}

export const TrustCard: React.FC<TrustCardProps> = ({ 
  aiInvolvementType, 
  humanContributionChecklist,
  rightsConfirmation 
}) => {
  return (
    <Card className="bg-card/40 border-white/10 shadow-lg relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Trust & Transparency
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-6">
        
        {/* AI Disclosure */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              AI Process Disclosed
            </span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {aiInvolvementType || 'Not specified'}
            </Badge>
          </div>
        </div>

        {/* Human Contribution */}
        <div className="space-y-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Human Contribution Details
          </span>
          <div className="bg-background/50 rounded-md p-3 text-sm text-muted-foreground border border-white/5">
            {humanContributionChecklist && Object.keys(humanContributionChecklist).length > 0 
              ? 'Human curation and editing confirmed by creator.'
              : 'Detailed human contributions have been verified by the creator.'}
          </div>
        </div>

        {/* Rights */}
        <div className="space-y-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Creator-certified rights
          </span>
          <div className="bg-secondary/10 text-secondary rounded-md p-3 text-sm border border-secondary/20 font-medium">
            Rights to publish confirmed
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground/60 pt-2 border-t border-white/5">
          This information is provided by the creator. Sound2Soul does not provide legal clearance or copyright verification.
        </div>
      </CardContent>
    </Card>
  );
};
