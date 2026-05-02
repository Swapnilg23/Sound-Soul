import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateCreatorProfile, useGetMyCreatorProfile } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const MOOD_TAGS = ['Calm', 'Hopeful', 'Nostalgic', 'Cinematic', 'Focus', 'Healing', 'Romantic', 'Dark', 'Energetic', 'Spiritual', 'Playful', 'Dreamy'];
const GENRES = ['Lo-fi', 'Pop', 'Cinematic', 'Ambient', 'EDM', 'Hip-Hop', 'Acoustic', 'Experimental'];
const AI_TOOLS = ['Suno', 'Udio', 'ElevenLabs', 'Splice', 'Boomy', 'Magenta', 'Other'];

const onboardingSchema = z.object({
  artistName: z.string().min(2, { message: 'Artist name must be at least 2 characters' }),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional(),
  creatorStatement: z.string().max(500).optional(),
  genres: z.array(z.string()).min(1, { message: 'Select at least one genre' }),
  moodIdentityTags: z.array(z.string()).min(1, { message: 'Select at least one mood' }),
  aiToolsUsed: z.array(z.string()).min(1, { message: 'Select at least one AI tool' }),
});

export default function CreatorOnboarding() {
  const [, setLocation] = useLocation();
  const createProfileMutation = useCreateCreatorProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      artistName: '',
      bio: '',
      creatorStatement: '',
      genres: [],
      moodIdentityTags: [],
      aiToolsUsed: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    setIsLoading(true);
    try {
      await createProfileMutation.mutateAsync({ 
        data: values
      });
      toast.success('Profile created successfully');
      setLocation('/creator/dashboard');
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-xl border-white/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set up your Creator Profile</CardTitle>
          <CardDescription>Tell listeners who you are and how you create.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your public creator name" {...field} className="bg-background/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about yourself..." className="resize-none bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creatorStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creator Statement</FormLabel>
                        <FormDescription>What does your music help people feel?</FormDescription>
                        <FormControl>
                          <Textarea placeholder="I make music to help people..." className="resize-none bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setStep(2)}>Next Step</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <FormField
                    control={form.control}
                    name="genres"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Genres</FormLabel>
                          <FormDescription>Select the genres that best describe your sound.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {GENRES.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="genres"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="moodIdentityTags"
                    render={() => (
                      <FormItem>
                        <div className="mb-4 mt-8">
                          <FormLabel className="text-base">Moods</FormLabel>
                          <FormDescription>What emotional spaces does your music occupy?</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {MOOD_TAGS.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="moodIdentityTags"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiToolsUsed"
                    render={() => (
                      <FormItem>
                        <div className="mb-4 mt-8">
                          <FormLabel className="text-base">AI Tools</FormLabel>
                          <FormDescription>Be transparent about the tools in your workflow.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {AI_TOOLS.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="aiToolsUsed"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating Profile...' : 'Complete Profile'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
