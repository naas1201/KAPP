import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, HeartPulse, Sparkles } from 'lucide-react';
import { services } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Our Services',
  description: 'Explore our comprehensive general medicine and aesthetic services.',
};

export default function ServicesPage() {
  return (
    <div>
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Our Services
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We offer a balanced approach to wellness, combining essential
            medical care with advanced aesthetic treatments to help you look and
            feel your absolute best.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container grid max-w-7xl gap-8 md:grid-cols-2">
          {services.map((service) => {
            const serviceImage = PlaceHolderImages.find(
              (img) => img.id === service.image
            );
            return (
              <Card
                key={service.slug}
                className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl"
              >
                {serviceImage && (
                  <div className="relative h-64 w-full">
                    <Image
                      src={serviceImage.imageUrl}
                      alt={service.title}
                      data-ai-hint={serviceImage.imageHint}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                    {service.slug === 'general-medicine' ? (
                      <HeartPulse className="w-8 h-8 text-primary" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-primary" />
                    )}
                    {service.title}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{service.longDescription}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/services/${service.slug}`}>
                      View {service.title} Details{' '}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
