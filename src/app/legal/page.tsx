import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Shield, Cookie, Scale } from 'lucide-react';

export default function LegalPage() {
  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using our services and website.',
      href: '/terms',
      icon: FileText,
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information.',
      href: '/privacy',
      icon: Shield,
    },
    {
      title: 'Cookie Policy',
      description: 'Information about how we use cookies on our website.',
      href: '/privacy#cookies',
      icon: Cookie,
    },
    {
      title: 'Patient Rights',
      description: 'Your rights as a patient at our clinic.',
      href: '/legal/patient-rights',
      icon: Scale,
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Legal Information
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Important legal documents and policies regarding our services 
            and your rights as a patient.
          </p>
        </div>
      </section>

      {/* Legal Documents Grid */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {legalDocuments.map((doc) => (
              <Link key={doc.title} href={doc.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <doc.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{doc.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {doc.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="py-16 bg-card">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Legal Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                [Add your legal notice here. This section can include information 
                about the legal entity operating the clinic, registration numbers, 
                and other legally required disclosures.]
              </p>
              <h3 className="font-semibold text-foreground mt-6">Business Information</h3>
              <ul className="space-y-2">
                <li><strong>Business Name:</strong> [Castillo Health & Aesthetics]</li>
                <li><strong>Registration Number:</strong> [Your business registration number]</li>
                <li><strong>Address:</strong> [Your registered business address]</li>
                <li><strong>Phone:</strong> [Your contact number]</li>
                <li><strong>Email:</strong> [Your contact email]</li>
              </ul>
              <h3 className="font-semibold text-foreground mt-6">Professional Credentials</h3>
              <p>
                [List relevant medical licenses, accreditations, and professional 
                memberships held by the clinic and its practitioners.]
              </p>
              <h3 className="font-semibold text-foreground mt-6">Regulatory Compliance</h3>
              <p>
                [Mention compliance with relevant healthcare regulations, data 
                protection laws, and other applicable regulations in the Philippines.]
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact for Legal Inquiries */}
      <section className="py-16">
        <div className="container max-w-4xl text-center">
          <h2 className="text-2xl font-bold font-headline mb-4">
            Legal Inquiries
          </h2>
          <p className="text-muted-foreground mb-6">
            For any legal questions or concerns, please contact us at:
          </p>
          <p className="font-medium">
            [legal@yourclinicdomain.com]
          </p>
        </div>
      </section>
    </>
  );
}
