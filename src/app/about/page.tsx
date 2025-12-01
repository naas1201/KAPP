'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Heart, Award, Users, Sparkles, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const doctorImage = PlaceHolderImages.find(
    (img) => img.id === 'doctor-portrait'
  );

  const values = [
    {
      icon: Heart,
      title: 'Compassionate Care',
      description: 'We prioritize your comfort and well-being in every interaction.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to the highest standards of medical and aesthetic practice.',
    },
    {
      icon: Users,
      title: 'Patient-Centered',
      description: 'Your needs and goals guide every treatment plan we create.',
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Continuously adopting the latest techniques and technologies.',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container max-w-7xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl">
                About Our Clinic
              </h1>
              <p className="text-lg text-muted-foreground">
                At Castillo Health & Aesthetics, we believe in a holistic approach 
                to wellness that combines compassionate medical care with advanced 
                aesthetic treatments. Our mission is to help you look and feel 
                your best, inside and out.
              </p>
              <Button asChild size="lg">
                <Link href="/booking">
                  Book a Consultation <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="flex justify-center">
              {doctorImage && (
                <div className="relative w-64 h-64 md:w-96 md:h-96">
                  <Image
                    src={doctorImage.imageUrl}
                    alt={doctorImage.description}
                    data-ai-hint={doctorImage.imageHint}
                    fill
                    className="object-cover rounded-2xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl text-center mb-8">
            Our Story
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              [Your clinic's story goes here. Describe how the clinic was founded, 
              the journey of Dr. Castillo, and what inspired the creation of this 
              practice. Share the vision behind combining general medicine with 
              aesthetic treatments.]
            </p>
            <p>
              [Continue with more details about the clinic's history, milestones, 
              and growth over the years. Mention any notable achievements or 
              recognitions the clinic has received.]
            </p>
            <p>
              [Conclude with your commitment to the community and future goals 
              for the clinic. Emphasize the values that drive your practice.]
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Doctor Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl text-center mb-12">
            Meet Dr. Katheryne Castillo
          </h2>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="flex justify-center md:order-2">
              {doctorImage && (
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <Image
                    src={doctorImage.imageUrl}
                    alt={doctorImage.description}
                    data-ai-hint={doctorImage.imageHint}
                    fill
                    className="object-cover rounded-full shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full ring-4 ring-primary/20 ring-offset-4 ring-offset-background" />
                </div>
              )}
            </div>
            <div className="space-y-4 md:order-1">
              <h3 className="text-2xl font-semibold font-headline">
                Board-Certified Physician
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  [Add Dr. Castillo's professional background, education, and 
                  certifications here. Include details about medical school, 
                  residency, and any specialized training in aesthetics.]
                </p>
                <p>
                  [Describe Dr. Castillo's areas of expertise, years of experience, 
                  and any professional memberships or affiliations.]
                </p>
                <p>
                  [Share Dr. Castillo's philosophy on patient care and what makes 
                  her approach unique. Include any personal touches that help 
                  patients connect with her.]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl text-center mb-12">
            Our Values
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-3 w-fit rounded-full bg-primary/10">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold font-headline mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl text-center mb-12">
            Visit Our Clinic
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold font-headline mb-4">Location</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>[Clinic Address Line 1]</p>
                  <p>[City, Province, Postal Code]</p>
                  <p>Philippines</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold font-headline mb-4">Hours</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Monday - Friday: [9:00 AM - 6:00 PM]</p>
                  <p>Saturday: [9:00 AM - 4:00 PM]</p>
                  <p>Sunday: Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link href="/#contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
