import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: [Insert Date]
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="pt-6 prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold font-headline">1. Introduction</h2>
              <p>
                Castillo Health & Aesthetics ("we," "us," or "our") is committed 
                to protecting your privacy. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your personal information 
                when you use our services or visit our website.
              </p>
              <p>
                We comply with the Data Privacy Act of 2012 (Republic Act No. 
                10173) and other applicable data protection regulations in the 
                Philippines.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mt-4">Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul>
                <li>Name, date of birth, gender</li>
                <li>Contact information (email, phone, address)</li>
                <li>Medical history and health information</li>
                <li>Treatment records and prescriptions</li>
                <li>Payment and billing information</li>
                <li>Photos (for treatment documentation, with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Automatically Collected Information</h3>
              <p>When you visit our website, we may automatically collect:</p>
              <ul>
                <li>IP address and browser type</li>
                <li>Pages visited and time spent</li>
                <li>Device information</li>
                <li>Cookies and similar technologies</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">3. How We Use Your Information</h2>
              <p>We use your personal information for the following purposes:</p>
              <ul>
                <li>Providing medical and aesthetic services</li>
                <li>Managing appointments and billing</li>
                <li>Communicating with you about your care</li>
                <li>Sending appointment reminders and follow-ups</li>
                <li>Improving our services and website</li>
                <li>Complying with legal and regulatory requirements</li>
                <li>Sending newsletters and marketing communications (with consent)</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">4. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share your 
                information with:
              </p>
              <ul>
                <li>Healthcare providers involved in your care</li>
                <li>Laboratory and diagnostic services</li>
                <li>Insurance providers (if applicable, with consent)</li>
                <li>Service providers who assist our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures 
                to protect your personal information, including:
              </p>
              <ul>
                <li>Encryption of sensitive data</li>
                <li>Secure access controls</li>
                <li>Regular security assessments</li>
                <li>Staff training on data protection</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">6. Your Rights</h2>
              <p>
                Under the Data Privacy Act, you have the following rights:
              </p>
              <ul>
                <li><strong>Right to be Informed:</strong> Know how your data is being processed</li>
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to certain processing of your data</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8" id="cookies">7. Cookies Policy</h2>
              <p>
                Our website uses cookies to enhance your browsing experience. 
                Cookies are small text files stored on your device that help us:
              </p>
              <ul>
                <li>Remember your preferences</li>
                <li>Understand how you use our website</li>
                <li>Improve our services</li>
              </ul>
              <p>
                You can control cookies through your browser settings. However, 
                disabling certain cookies may affect website functionality.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">8. Newsletter and Marketing</h2>
              <p>
                With your consent, we may send you newsletters and promotional 
                communications. You can unsubscribe at any time by:
              </p>
              <ul>
                <li>Clicking the unsubscribe link in our emails</li>
                <li>Visiting our <Link href="/newsletter-unsubscribe" className="text-primary hover:underline">unsubscribe page</Link></li>
                <li>Contacting us directly</li>
              </ul>

              <h2 className="text-2xl font-bold font-headline mt-8">9. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to 
                fulfill the purposes outlined in this policy, unless a longer 
                retention period is required by law. Medical records are retained 
                in accordance with healthcare regulations.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">10. Children's Privacy</h2>
              <p>
                For patients under 18 years of age, we require parental or 
                guardian consent for the collection and processing of personal 
                information.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes 
                will be posted on this page with an updated revision date. We 
                encourage you to review this policy periodically.
              </p>

              <h2 className="text-2xl font-bold font-headline mt-8">12. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or wish to 
                exercise your data rights, please contact our Data Protection 
                Officer:
              </p>
              <ul>
                <li>Email: [privacy@yourclinicdomain.com]</li>
                <li>Phone: [+63 XXX XXX XXXX]</li>
                <li>Address: [Your clinic address]</li>
              </ul>
              <p>
                You may also file a complaint with the National Privacy 
                Commission if you believe your data privacy rights have been 
                violated.
              </p>
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
