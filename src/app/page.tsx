
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  HeartPulse,
  Sparkles,
  Stethoscope,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useState } from 'react';
import { BookingSheet } from '@/components/BookingSheet';
import { TrustIndicators } from '@/components/TrustIndicators';

export default function Home() {
  const [isBookingSheetOpen, setBookingSheetOpen] = useState(false);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-clinic');
  const doctorImage = PlaceHolderImages.find(
    (img) => img.id === 'doctor-portrait'
  );

  const testimonials = [
    {
      name: 'Maria Dela Cruz',
      title: 'Aesthetic Patient',
      quote:
        "Dr. Castillo is a true artist! I've never felt more confident. The results are natural and beautiful. The clinic is so calming and professional.",
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-1'),
    },
    {
      name: 'John Lloyd Reyes',
      title: 'General Medicine Patient',
      quote:
        'Finally, a doctor who listens. Dr. Castillo provides such thorough and compassionate care for my whole family. Booking is so easy too!',
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-2'),
    },
    {
      name: 'Sofia Andres',
      title: 'Aesthetic Patient',
      quote:
        'The transformation is amazing. I was nervous at first, but the team made me feel so comfortable. I highly recommend their aesthetic services.',
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-3'),
    },
  ];

  return (
    <>
    <div className="flex flex-col">
      <section className="relative w-full py-24 md:py-32 lg:py-48 text-center bg-background">
        <div className="absolute inset-0">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover object-center opacity-10"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="container relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline sm:text-5xl md:text-6xl lg:text-7xl">
            Sincere Care, Beautiful Results
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground md:text-xl">
            Dr. Katheryne Castillo offers compassionate general medicine and
            advanced aesthetic treatments, building confidence from the inside out.
          </p>
          <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
            <Button size="lg" onClick={() => setBookingSheetOpen(true)}>Book an Appointment</Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <TrustIndicators />

      <section id="services" className="py-16 bg-card md:py-24">
        <div className="container max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              A Dual Approach to Wellness
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We believe in a holistic approach, providing both essential medical care and expert aesthetic treatments for your complete well-being.
            </p>
          </div>
          <div className="grid gap-8 mt-12 md:grid-cols-2">
            <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  General Medicine
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-6 pt-0">
                <p className="text-muted-foreground">
                  Your foundation for a healthy life. We offer personalized primary care to keep you and your family well, from routine check-ups to managing chronic conditions.
                </p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="outline" asChild>
                  <Link href="/services/general-medicine">
                    Learn More <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
            <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary-foreground/10 text-primary-foreground">
                  <Sparkles className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  Aesthetic Treatments
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-6 pt-0">
                <p className="text-primary-foreground/80">
                  Enhance your natural beauty with our state-of-the-art aesthetic procedures, designed for safe, sincere, and stunning results that feel like you.
                </p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="secondary" asChild>
                  <Link href="/services/aesthetic-treatments">
                    View Treatments <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 bg-background md:py-24">
        <div className="container max-w-7xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Meet Dr. Katheryne Castillo
              </h2>
              <p className="text-lg text-muted-foreground">
                A dedicated and board-certified physician in the Philippines,
                Dr. Castillo brings a wealth of experience in both family
                medicine and the art of aesthetics. Her philosophy is centered
                on patient-first care, combining medical expertise with a keen
                eye for beauty to deliver results that are both healthy and
                harmonious.
              </p>
              <p className="text-muted-foreground">
                She is committed to continuous learning to bring the latest and
                safest techniques to her patients, ensuring a comfortable and
                trustworthy experience every visit.
              </p>
              <Button variant="link" asChild className="p-0">
                <Link href="/new-patient">
                  Become a Patient <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
            <div className="flex justify-center">
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
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 bg-card md:py-24">
        <div className="container max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              Words From Our Patients
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover why our patients trust us with their health and beauty
              needs.
            </p>
          </div>
          <Carousel
            opts={{ align: 'start' }}
            className="w-full max-w-6xl mx-auto mt-12"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1">
                    <Card className="flex flex-col h-full bg-background">
                      <CardContent className="flex flex-col items-center flex-grow p-6 text-center">
                        <Quote className="w-8 h-8 mb-4 text-accent" />
                        <p className="flex-grow text-muted-foreground">
                          {testimonial.quote}
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                          {testimonial.avatar && (
                            <Avatar>
                              <AvatarImage
                                src={testimonial.avatar.imageUrl}
                                alt={testimonial.name}
                                data-ai-hint={testimonial.avatar.imageHint}
                              />
                              <AvatarFallback>
                                {testimonial.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {testimonial.title}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <section id="contact" className="py-16 bg-background md:py-24">
        <div className="container max-w-4xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              Get in Touch
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions or ready to start your journey? Contact us today.
            </p>
          </div>
          <form className="grid grid-cols-1 gap-4 mt-12 sm:grid-cols-2">
            <Input placeholder="Your Name" className="sm:col-span-1" />
            <Input
              type="email"
              placeholder="Your Email"
              className="sm:col-span-1"
            />
            <Textarea
              placeholder="Your Message"
              className="sm:col-span-2"
              rows={5}
            />
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </div>
          </form>
          <div className="mt-8 text-sm text-center text-muted-foreground">
            You can also reach us via{' '}
            <a
              href="https://m.me/your-messenger-id"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Facebook Messenger
            </a>{' '}
            for quick inquiries.
          </div>
        </div>
      </section>
    </div>
    <BookingSheet open={isBookingSheetOpen} onOpenChange={setBookingSheetOpen} />
    </>
  );
}

    