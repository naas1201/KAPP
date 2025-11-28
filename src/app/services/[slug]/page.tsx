
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Metadata, ResolvingMetadata } from 'next'
import { useState } from 'react';
import { BookingSheet } from '@/components/BookingSheet';

type Props = {
  params: { slug: string }
}
 
// This function is still useful for server-side metadata generation
// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const service = services.find((s) => s.slug === params.slug);
 
//   if (!service) {
//     return {
//       title: 'Service Not Found'
//     }
//   }
 
//   return {
//     title: service.title,
//     description: service.longDescription,
//   }
// }

// Since we are making this a client component, we can't use generateStaticParams
// export function generateStaticParams() {
//   return services.map((service) => ({
//     slug: service.slug,
//   }));
// }

export default function ServiceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [isBookingSheetOpen, setBookingSheetOpen] = useState(false);
  const service = services.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <>
    <div>
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            {service.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {service.longDescription}
          </p>
          <Button className="mt-8" onClick={() => setBookingSheetOpen(true)}>Book a Consultation</Button>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-7xl">
          <h2 className="mb-12 text-3xl font-bold text-center font-headline sm:text-4xl">
            Available Treatments
          </h2>
          <div className="space-y-12">
            {service.treatments.map((treatment) => (
              <Card key={treatment.id} className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-semibold font-headline">
                      {treatment.name}
                    </h3>
                    {treatment.price && (
                      <Badge variant="secondary" className="mt-2">
                        {treatment.price}
                      </Badge>
                    )}
                    <p className="mt-4 text-muted-foreground">
                      {treatment.description}
                    </p>
                    {treatment.faq && treatment.faq.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-2 font-semibold">
                          Frequently Asked Questions
                        </h4>
                        <Accordion type="single" collapsible className="w-full">
                          {treatment.faq.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                              <AccordionTrigger>
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent>{faq.answer}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-muted/50">
                    {treatment.beforeAfter &&
                    treatment.beforeAfter.length > 0 ? (
                      <Carousel className="w-full max-w-md mx-auto">
                        <CarouselContent>
                          {treatment.beforeAfter.map((ba, index) => {
                            const beforeImg = PlaceHolderImages.find(
                              (img) => img.id === ba.before
                            );
                            const afterImg = PlaceHolderImages.find(
                              (img) => img.id === ba.after
                            );
                            return (
                              <CarouselItem key={index}>
                                <div className="grid grid-cols-2 gap-4">
                                  {beforeImg && (
                                    <div className="space-y-2">
                                      <Image
                                        src={beforeImg.imageUrl}
                                        alt="Before treatment"
                                        data-ai-hint={beforeImg.imageHint}
                                        width={400}
                                        height={400}
                                        className="object-cover rounded-lg aspect-square"
                                      />
                                      <p className="text-sm text-center text-muted-foreground">
                                        Before
                                      </p>
                                    </div>
                                  )}
                                  {afterImg && (
                                    <div className="space-y-2">
                                      <Image
                                        src={afterImg.imageUrl}
                                        alt="After treatment"
                                        data-ai-hint={afterImg.imageHint}
                                        width={400}
                                        height={400}
                                        className="object-cover rounded-lg aspect-square"
                                      />
                                      <p className="text-sm font-semibold text-center text-primary">
                                        After
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <p>Detailed consultation required.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
    <BookingSheet open={isBookingSheetOpen} onOpenChange={setBookingSheetOpen} />
    </>
  );
}
