'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Phone, Mail } from 'lucide-react';

const generalFaqs = [
  {
    question: 'How do I book an appointment?',
    answer: '[Explain the booking process. You can book online through our website by clicking the "Book Now" button, calling our clinic directly, or messaging us through Facebook Messenger.]',
  },
  {
    question: 'What should I bring to my first appointment?',
    answer: '[List items to bring: valid ID, insurance card if applicable, list of current medications, medical records if available, and any questions you may have.]',
  },
  {
    question: 'What are your clinic hours?',
    answer: '[Specify your clinic hours. Example: We are open Monday to Friday from 9:00 AM to 6:00 PM, and Saturday from 9:00 AM to 4:00 PM. We are closed on Sundays and holidays.]',
  },
  {
    question: 'Do you accept health insurance?',
    answer: '[Explain your insurance policy. List accepted insurance providers or explain if services are self-pay only.]',
  },
  {
    question: 'What payment methods do you accept?',
    answer: '[List accepted payment methods: cash, credit/debit cards, GCash, Maya, bank transfers, etc.]',
  },
];

const aestheticFaqs = [
  {
    question: 'Are aesthetic treatments safe?',
    answer: '[Explain the safety measures you take. All treatments are performed by licensed medical professionals using FDA-approved products and equipment. We conduct thorough consultations before any procedure.]',
  },
  {
    question: 'How long do aesthetic treatments take?',
    answer: '[Provide general timeframes. Treatment times vary depending on the procedure, ranging from 15 minutes for simple injectables to several hours for more comprehensive treatments.]',
  },
  {
    question: 'Is there downtime after aesthetic procedures?',
    answer: '[Explain recovery expectations. Downtime varies by treatment. Some procedures have no downtime, while others may require a few days of recovery. We will discuss this during your consultation.]',
  },
  {
    question: 'How soon will I see results?',
    answer: '[Set expectations for results. Some treatments show immediate results, while others may take weeks to fully develop. Your doctor will explain the expected timeline during consultation.]',
  },
  {
    question: 'Can I combine different treatments?',
    answer: '[Explain combination treatments. Yes, many treatments can be combined for enhanced results. Our doctors will create a customized treatment plan based on your goals and needs.]',
  },
];

const generalMedicineFaqs = [
  {
    question: 'What conditions do you treat?',
    answer: '[List common conditions: general check-ups, acute illnesses, chronic disease management, preventive care, vaccinations, and more.]',
  },
  {
    question: 'Do you provide medical certificates?',
    answer: '[Explain your medical certificate policy. Yes, we provide medical certificates for work, school, and other purposes after proper consultation and examination.]',
  },
  {
    question: 'Can I get prescriptions refilled?',
    answer: '[Explain your prescription refill process. For ongoing medications, you may request refills through our patient portal or by visiting the clinic. Some prescriptions require follow-up consultations.]',
  },
  {
    question: 'Do you offer teleconsultation?',
    answer: '[Explain your telehealth options. Yes, we offer video consultations for appropriate cases. Book a teleconsultation through our website or call the clinic for more information.]',
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find answers to common questions about our services, booking process, 
            and what to expect during your visit.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16">
        <div className="container max-w-4xl space-y-12">
          {/* General Questions */}
          <div>
            <h2 className="text-2xl font-bold font-headline mb-6">
              General Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {generalFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`general-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Aesthetic Treatments */}
          <div>
            <h2 className="text-2xl font-bold font-headline mb-6">
              Aesthetic Treatments
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {aestheticFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`aesthetic-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* General Medicine */}
          <div>
            <h2 className="text-2xl font-bold font-headline mb-6">
              General Medicine
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {generalMedicineFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`medicine-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-16 bg-card">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">
                Still Have Questions?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Can't find the answer you're looking for? We're here to help!
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Button asChild variant="outline" className="h-auto py-4 flex-col">
                  <Link href="/#contact">
                    <MessageCircle className="w-6 h-6 mb-2" />
                    <span>Send a Message</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col">
                  <a href="tel:+63XXXXXXXXXX">
                    <Phone className="w-6 h-6 mb-2" />
                    <span>Call Us</span>
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col">
                  <a href="mailto:info@example.com">
                    <Mail className="w-6 h-6 mb-2" />
                    <span>Email Us</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
