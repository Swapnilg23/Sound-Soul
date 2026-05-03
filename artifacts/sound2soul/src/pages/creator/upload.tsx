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
  genre: z.string().optional(),
  soulStory: z.string().min(10, 'Soul Story is required').max(1000),
  aiInvolvementType: z.string().min(1, 'AI Involvement Type is required'),
  visibility: z.enum(['draft', 'public', 'unlisted']),
  rightsConfirmed: z.boolean().refine(val => val === true, {
    message: 'You must confirm your rights to publish'
  }),
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
      genre: '',
      soulStory: '',
      aiInvolvementType: '',
      visibility: 'draft',
      rightsConfirmed: false,
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
          genre: values.genre,
          soulStory: values.soulStory,
          aiInvolvementType: values.aiInvolvementType,
          visibility: values.visibility as CreateTrackBodyVisibility,
          rightsConfirmation: values.rightsConfirmed ? { confirmed: true, date: new Date().toISOString() } : undefined,
          humanContributionChecklist: {} // MVP simplification
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
            </CardContent>
          </Card>

          {/* Context & Transparency */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle>Context & Transparency</CardTitle>
              <CardDescription>This information will appear on your track's release-ready profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="soulStory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soul Story</FormLabel>
                    <FormDescription>Document the emotion, memory, or moment behind this track.</FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="I created this track when..." 
                        className="h-32 resize-none bg-background/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aiInvolvementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Involvement</FormLabel>
                    <FormDescription>Document your AI creative process.</FormDescription>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select AI involvement level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AI_INVOLVEMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
