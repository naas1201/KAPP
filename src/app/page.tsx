'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  HeartPulse,
  Sparkles,
  Star,
  Quote,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  Shield,
  Award,
  Phone,
  Mail,
  MapPin,
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
import { useState, useEffect } from 'react';
import { BookingSheet } from '@/components/BookingSheet';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Home() {
  const [isBookingSheetOpen, setBookingSheetOpen] = useState(false);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-clinic');
  const doctorImage = PlaceHolderImages.find((img) => img.id === 'doctor-portrait');

  const heroTexts = ['Radiant Skin', 'Timeless Beauty', 'Your Best Self', 'Natural Glow'];
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: 'Maria Dela Cruz',
      title: 'Aesthetic Patient',
      quote: "Dr. Castillo transformed my confidence! The results look so natural - I feel like the best version of myself. Worth every peso!",
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-1'),
      rating: 5,
    },
    {
      name: 'John Lloyd Reyes',
      title: 'General Medicine Patient',
      quote: 'Finally, a doctor who truly listens. My whole family trusts Dr. Castillo. The online booking made it so convenient!',
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-2'),
      rating: 5,
    },
    {
      name: 'Sofia Andres',
      title: 'Aesthetic Patient',
      quote: 'The transformation is incredible! I was nervous at first, but the team made me feel so comfortable. Highly recommend!',
      avatar: PlaceHolderImages.find((img) => img.id === 'testimonial-3'),
      rating: 5,
    },
  ];

  const benefits = [
    { icon: Shield, text: 'Board-Certified Doctor' },
    { icon: Award, text: 'Premium Quality Care' },
    { icon: Clock, text: 'Flexible Scheduling' },
    { icon: Heart, text: 'Patient-First Approach' },
  ];

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-pink-50 via-background to-rose-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 left-10 w-72 h-72 bg-pink-200/30 rounded-full blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <motion.div
            className="container relative z-10 max-w-6xl mx-auto px-4 py-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left space-y-8">
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Trusted by 1,000+ Happy Patients</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-headline">
                  <span className="block text-foreground">Discover Your</span>
                  <motion.span
                    key={textIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="block shimmer-text bg-gradient-to-r from-primary via-pink-500 to-rose-400 bg-clip-text text-transparent"
                  >
                    {heroTexts[textIndex]}
                  </motion.span>
                </motion.h1>

                <motion.p variants={itemVariants} className="max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Experience the perfect blend of medical expertise and aesthetic artistry.
                  <span className="text-primary font-semibold"> Dr. Kay Castillo</span> delivers personalized care that reveals your natural beauty.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-300 glow-pulse"
                      onClick={() => setBookingSheetOpen(true)}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Your Consultation
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-2" asChild>
                      <Link href="/services">
                        Explore Treatments <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                  {benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="relative flex justify-center lg:justify-end">
                {doctorImage && (
                  <div className="relative">
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                      <Image
                        src={doctorImage.imageUrl}
                        alt={doctorImage.description}
                        data-ai-hint={doctorImage.imageHint}
                        fill
                        className="object-cover rounded-3xl shadow-2xl"
                      />
                      <div className="absolute -inset-4 rounded-3xl border-2 border-primary/20 -z-10" />
                    </div>
                    <motion.div
                      className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="w-6 h-6 text-primary fill-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">5.0</p>
                          <p className="text-sm text-muted-foreground">Patient Rating</p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-2xl shadow-xl px-4 py-3"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <p className="text-sm font-medium">10+ Years</p>
                      <p className="text-xs opacity-80">Experience</p>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 bg-gradient-to-b from-white to-pink-50/30">
          <div className="container max-w-7xl">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Our Services
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-headline mb-6">
                Complete Care for Your <span className="text-gradient">Health & Beauty</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                From comprehensive medical check-ups to advanced aesthetic treatments.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="group h-full overflow-hidden bg-white border-2 border-transparent hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <CardHeader className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-lg">
                      <HeartPulse className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-headline mb-2">General Medicine</CardTitle>
                    <p className="text-muted-foreground">Your trusted partner for complete health care</p>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <ul className="space-y-3">
                      {['Comprehensive Health Assessments', 'Chronic Disease Management', 'Preventive Care & Screenings', 'Family Medicine Services'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/services/general-medicine">Learn More <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="group h-full overflow-hidden bg-gradient-to-br from-primary to-pink-600 text-primary-foreground border-0 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <CardHeader className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-headline mb-2 text-white">Aesthetic Treatments</CardTitle>
                    <p className="text-white/80">Reveal your natural beauty with expert care</p>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <ul className="space-y-3">
                      {['Botox & Dermal Fillers', 'Skin Rejuvenation', 'Advanced Facials', 'Body Contouring'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-white/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href="/services/aesthetic-treatments">View Treatments <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div className="mt-16 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-muted-foreground mb-4">Ready to start your transformation?</p>
              <Button size="lg" className="rounded-full px-8" onClick={() => setBookingSheetOpen(true)}>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Your Free Consultation
              </Button>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-white relative overflow-hidden">
          <div className="container max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <motion.div className="order-2 lg:order-1 space-y-8" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div>
                  <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">Meet Your Doctor</span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-headline mb-6">Dr. Kay Castillo, MD</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    With over a decade of experience in both general medicine and aesthetic treatments, Dr. Kay brings a unique blend of medical expertise and artistic vision.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Award, label: 'Board Certified', value: 'General Medicine' },
                    { icon: Star, label: 'Patient Rating', value: '5.0 Stars' },
                    { icon: Heart, label: 'Patients Served', value: '1,000+' },
                    { icon: Shield, label: 'Specializations', value: 'Aesthetics & Primary Care' },
                  ].map((item, i) => (
                    <motion.div key={i} className="p-4 rounded-xl bg-muted/50" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <item.icon className="w-6 h-6 text-primary mb-2" />
                      <p className="font-semibold text-foreground">{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/new-patient">Become a Patient <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </motion.div>

              <motion.div className="order-1 lg:order-2 flex justify-center" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                {doctorImage && (
                  <div className="relative">
                    <div className="relative w-80 h-80 md:w-[400px] md:h-[400px]">
                      <Image src={doctorImage.imageUrl} alt={doctorImage.description} fill className="object-cover rounded-3xl shadow-2xl" />
                    </div>
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-pink-100 rounded-2xl -z-10" />
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-gradient-to-b from-pink-50/50 to-white">
          <div className="container max-w-7xl">
            <motion.div className="max-w-3xl mx-auto text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">Patient Stories</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-headline mb-6">
                Real Results, <span className="text-gradient">Happy Patients</span>
              </h2>
            </motion.div>

            <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-6xl mx-auto">
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full bg-white border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                      <CardContent className="p-8">
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <Quote className="w-8 h-8 text-primary/20 mb-4" />
                        <p className="text-muted-foreground leading-relaxed mb-6">{testimonial.quote}</p>
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                            {testimonial.avatar && <AvatarImage src={testimonial.avatar.imageUrl} alt={testimonial.name} />}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-8">
                <CarouselPrevious className="relative inset-auto" />
                <CarouselNext className="relative inset-auto" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-white">
          <div className="container max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <motion.div className="space-y-8" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div>
                  <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">Get In Touch</span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-headline mb-6">
                    Start Your Journey <span className="text-gradient">Today</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">Have questions? We&apos;re here to help.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: Phone, label: 'Call Us', value: '+63 XXX XXX XXXX', hint: 'Mon-Sat, 9AM-6PM' },
                    { icon: Mail, label: 'Email Us', value: 'hello@kaycastillomd.com', hint: 'We reply within 24 hours' },
                    { icon: MapPin, label: 'Visit Us', value: 'Philippines', hint: 'By appointment only' },
                  ].map((item, i) => (
                    <motion.div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-semibold text-foreground">{item.value}</p>
                        <p className="text-sm text-muted-foreground">{item.hint}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-pink-600 text-white">
                  <h3 className="text-xl font-semibold mb-2">Ready to Book?</h3>
                  <p className="text-white/80 mb-4">Skip the wait and book your appointment online.</p>
                  <Button variant="secondary" className="w-full" onClick={() => setBookingSheetOpen(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </div>
              </motion.div>

              <motion.div className="bg-muted/30 rounded-3xl p-8 lg:p-10" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h3 className="text-2xl font-bold font-headline mb-6">Send Us a Message</h3>
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">First Name</label>
                      <Input placeholder="Juan" className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Last Name</label>
                      <Input placeholder="Dela Cruz" className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Address</label>
                    <Input type="email" placeholder="juan@example.com" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone Number</label>
                    <Input type="tel" placeholder="+63 XXX XXX XXXX" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea placeholder="Tell us about your concerns..." className="rounded-xl resize-none" rows={5} />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg">
                    Send Message <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-r from-primary via-pink-500 to-rose-500 text-white relative overflow-hidden">
          <div className="container max-w-4xl relative z-10">
            <motion.div className="text-center space-y-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline">Your Transformation Starts Here</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join hundreds of satisfied patients who have discovered their best selves with Dr. Kay Castillo.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 rounded-full shadow-xl" onClick={() => setBookingSheetOpen(true)}>
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Your Free Consultation
                </Button>
              </motion.div>
              <p className="text-sm text-white/70">Limited slots available • No commitment required</p>
            </motion.div>
          </div>
        </section>
      </div>
      <BookingSheet open={isBookingSheetOpen} onOpenChange={setBookingSheetOpen} />
    </>
  );
}
