import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container max-w-7xl">
        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Sincere care, beautiful results. Located in the heart of the
              Philippines.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <h3 className="mb-4 font-semibold font-headline">Clinic</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/#about"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/booking"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Book Now
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold font-headline">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/#contact"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/new-patient"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Patient Form
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#faq"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-span-2">
                <h3 className="mb-4 font-semibold font-headline">
                  Stay Updated
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Subscribe to our newsletter for the latest updates and offers.
                </p>
                <form className="flex w-full max-w-sm gap-2">
                  <Input type="email" placeholder="Enter your email" />
                  <Button type="submit">Subscribe</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6 text-sm text-center border-t text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Castillo Health & Aesthetics. All
          Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
