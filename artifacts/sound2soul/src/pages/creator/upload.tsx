import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateTrack } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateTrackBodyVisibility } from '@workspace/api-client-react';

const AI_INVOLVEMENT_TYPES = [
  'Human-created, no AI',
  'AI-assisted lyrics',
  'AI-assisted composition',
  'AI-assisted vocals',
  'AI-generated draft, human-edited',
  'Fully AI-generated'
];

const GENRES = ['Lo-fi', 'Pop', 'Cinematic', 'Ambient', 'EDM', 'Hip-Hop', 'Acoustic', 'Experimental'];

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  audioUrl: z.string().url('Must be a valid URL (For MVP: paste any link)'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  externalDistributionLinks: z.string().optional(),
  genre: z.string().optional(),
  soulStory: z.string().min(10, 'Soul Story is required').max(1000),
  aiInvolvementType: z.string().min(1, 'AI Involvement Type is required'),
  visibility: z.enum(['draft', 'public', 'unlisted']),
  rightsConfirmed: z.boolean().refine(val => val === true, {
    message: 'You must confirm your rights to publish'
  }),
  releaseNotesPublic: z.boolean().default(true),
  releaseNotesAiToolsUsed: z.string().optional(),
  releaseNotesAiHelpedCreate: z.array(z.string()).default([]),
  releaseNotesHumanContributed: z.array(z.string()).default([]),
  releaseNotesSourceMaterialNotes: z.string().optional(),
  releaseNotesVocalIdentityNotes: z.string().optional(),
  releaseNotesCoverArtSource: z.string().optional(),
  releaseNotesFinalAudioVersion: z.string().optional(),
  releaseNotesDistributionStatus: z.string().optional(),
  releaseNotesReleasePlanNotes: z.string().optional(),
});

export default function CreatorUpload() {
  const [, setLocation] = useLocation();
  const createTrackMutation = useCreateTrack();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      description: '',
      audioUrl: '',
      coverImageUrl: '',
      externalDistributionLinks: '',
      genre: '',
      soulStory: '',
      aiInvolvementType: '',
      visibility: 'draft',
      rightsConfirmed: false,
      releaseNotesPublic: true,
      releaseNotesAiToolsUsed: '',
      releaseNotesAiHelpedCreate: [],
      releaseNotesHumanContributed: [],
      releaseNotesSourceMaterialNotes: '',
      releaseNotesVocalIdentityNotes: '',
      releaseNotesCoverArtSource: '',
      releaseNotesFinalAudioVersion: '',
      releaseNotesDistributionStatus: 'Not distributed yet',
      releaseNotesReleasePlanNotes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsLoading(true);
    try {
      await createTrackMutation.mutateAsync({ 
        data: {
          title: values.title,
          description: values.description,
          audioUrl: values.audioUrl,
          coverImageUrl: values.coverImageUrl || undefined,
          externalDistributionLinks: values.externalDistributionLinks?.split('\n').map(s => s.trim()).filter(Boolean) ?? [],
          genre: values.genre,
          soulStory: values.soulStory,
          aiInvolvementType: values.aiInvolvementType,
          visibility: values.visibility as CreateTrackBodyVisibility,
          rightsConfirmation: values.rightsConfirmed ? { confirmed: true, date: new Date().toISOString() } : undefined,
          humanContributionChecklist: {},
          releaseNotes: {
            aiToolsUsed: values.releaseNotesAiToolsUsed?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
            aiHelpedCreate: values.releaseNotesAiHelpedCreate,
            humanContributed: values.releaseNotesHumanContributed,
            sourceMaterialNotes: values.releaseNotesSourceMaterialNotes,
            vocalIdentityNotes: values.releaseNotesVocalIdentityNotes,
            coverArtSource: values.releaseNotesCoverArtSource,
            finalAudioVersion: values.releaseNotesFinalAudioVersion,
            distributionStatus: values.releaseNotesDistributionStatus,
            releasePlanNotes: values.releaseNotesReleasePlanNotes,
            public: values.releaseNotesPublic,
          },
        }
      });
      toast.success('Track uploaded successfully');
      setLocation('/creator/dashboard');
    } catch (error) {
      toast.error('Failed to upload track. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Track</h1>
        <p className="text-muted-foreground">Prepare your release before distribution with transparency, rights info, and story.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Info */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Track Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter track title" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="audioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audio URL (MVP)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="bg-background/50" />
                      </FormControl>
                      <FormDescription>Paste a public URL to your audio file</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="externalDistributionLinks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External distribution / profile links</FormLabel>
                    <FormDescription>Optional URL-only links to creator-provided pages like Spotify, Bandcamp, SoundCloud, YouTube, or a website. One per line.</FormDescription>
                    <FormControl>
                      <Textarea placeholder="https://open.spotify.com/...\nhttps://bandcamp.com/...\nhttps://yourwebsite.com" className="h-28 resize-none bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Context & Transparency */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>AI Music Release Notes</CardTitle>
              <CardDescription>Document your process, rights notes, and release prep for this track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="releaseNotesPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 bg-background/30">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold text-primary">Show release notes summary publicly</FormLabel>
                      <FormDescription>Summary is on by default. Detailed notes stay private unless you choose otherwise.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="releaseNotesAiToolsUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI tools used</FormLabel>
                    <FormDescription>Examples: Suno, Udio, ElevenLabs, Soundraw, AIVA, ChatGPT, DAW, GarageBand, Logic Pro, Ableton, Other</FormDescription>
                    <FormControl>
                      <Input placeholder="Suno, Udio, Logic Pro" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="releaseNotesSourceMaterialNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source material notes</FormLabel>
                    <FormDescription>Mention samples, references, uploaded audio, stems, loops, or outside material used.</FormDescription>
                    <FormControl>
                      <Textarea placeholder="Mention any samples, references, uploaded audio, stems, loops, or outside material used. Do not include anything you do not have rights to use." className="h-28 resize-none bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="releaseNotesVocalIdentityNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vocal identity notes</FormLabel>
                  <FormDescription>Describe whether vocals are human, synthetic, AI-generated, transformed, or based on your own voice.</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Describe whether vocals are human, synthetic, AI-generated, transformed, or based on your own voice." className="h-28 resize-none bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="releaseNotesCoverArtSource" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover art source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select cover art source" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Created by me">Created by me</SelectItem>
                      <SelectItem value="AI-assisted">AI-assisted</SelectItem>
                      <SelectItem value="Stock/licensed">Stock/licensed</SelectItem>
                      <SelectItem value="Commissioned">Commissioned</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="releaseNotesFinalAudioVersion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Final audio version</FormLabel>
                  <FormControl><Input placeholder="final_master_v1.wav" {...field} className="bg-background/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="releaseNotesDistributionStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Distribution status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select distribution status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Not distributed yet">Not distributed yet</SelectItem>
                      <SelectItem value="Preparing for distribution">Preparing for distribution</SelectItem>
                      <SelectItem value="Distributed">Distributed</SelectItem>
                      <SelectItem value="Private/demo only">Private/demo only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="releaseNotesReleasePlanNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Release plan notes</FormLabel>
                  <FormControl><Textarea placeholder="Optional notes about launch date, audience, mood, campaign, or distribution plans." className="h-28 resize-none bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public (Requires approval)</SelectItem>
                        <SelectItem value="unlisted">Unlisted (Anyone with link)</SelectItem>
                        <SelectItem value="draft">Draft (Only you)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rightsConfirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 bg-background/30">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold text-primary">
                        Creator-certified rights information
                      </FormLabel>
                      <FormDescription>
                        I certify that I have the right to publish this track and its components.
                        This information is provided by the creator. Sound2Soul does not provide legal clearance, copyright verification, royalty collection, or distribution.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/creator/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Uploading...' : 'Upload Track'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
