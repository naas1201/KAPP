import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: [Insert Date]
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="pt-6 prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold font-headline">1. Introduction</h2>
              <p>
                Welcome to Castillo Health & Aesthetics. These Terms of Service 
                ("Terms") govern your use of our website, services, and any 
                related content, features, or applications offered by us.
              </p>
              <p>
                By accessing or using our services, you agree to be bound by 
                these Terms. If you do not agree with any part of these Terms, 
                you may not use our services.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">2. Medical Services</h2>
              <p>
                [Describe the nature of medical services provided. Include 
                disclaimers about the limitations of online information and 
                the importance of in-person consultations.]
              </p>
              <p>
                [Explain that information on the website is for general 
                educational purposes and does not constitute medical advice.]
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">3. Appointments and Cancellations</h2>
              <p>
                [Outline your appointment booking, confirmation, and cancellation 
                policies. Include information about:]
              </p>
              <ul>
                <li>[Booking requirements]</li>
                <li>[Cancellation policy and timeframes]</li>
                <li>[No-show policy]</li>
                <li>[Rescheduling procedures]</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">4. Payment Terms</h2>
              <p>
                [Detail your payment policies including:]
              </p>
              <ul>
                <li>[Accepted payment methods]</li>
                <li>[Payment timing (before/after service)]</li>
                <li>[Refund policy]</li>
                <li>[Insurance billing if applicable]</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">5. Patient Responsibilities</h2>
              <p>
                [Describe patient responsibilities such as:]
              </p>
              <ul>
                <li>[Providing accurate medical history]</li>
                <li>[Following pre and post-treatment instructions]</li>
                <li>[Informing the clinic of any changes in health status]</li>
                <li>[Arriving on time for appointments]</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">6. Consent to Treatment</h2>
              <p>
                [Explain the informed consent process for medical and aesthetic 
                procedures. Include information about:]
              </p>
              <ul>
                <li>[The consent form process]</li>
                <li>[Patient's right to ask questions]</li>
                <li>[Understanding of risks and benefits]</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">7. Intellectual Property</h2>
              <p>
                [Describe the ownership of content on the website, including 
                text, images, logos, and other materials. Explain restrictions 
                on copying or using this content.]
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">8. Limitation of Liability</h2>
              <p>
                [Include appropriate limitation of liability clauses, disclaimers 
                about the results of treatments, and the extent of the clinic's 
                responsibility.]
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes 
                will be effective immediately upon posting to our website. Your 
                continued use of our services after any changes indicates your 
                acceptance of the new Terms.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance 
                with the laws of the Republic of the Philippines, without 
                regard to its conflict of law provisions.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: [your-email@example.com]</li>
                <li>Phone: [+63 XXX XXX XXXX]</li>
                <li>Address: [Your clinic address]</li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/legal" className="text-primary hover:underline">
              ← Back to Legal Information
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
