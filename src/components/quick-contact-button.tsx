'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, X, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface QuickContactButtonProps {
  phoneNumber?: string;
  messengerLink?: string;
  helpLink?: string;
}

export function QuickContactButton({
  phoneNumber = '+63XXXXXXXXXX',
  messengerLink = 'https://m.me/your-page-id',
  helpLink = '/faq',
}: QuickContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Quick action buttons - shown when expanded */}
        <div
          className={cn(
            'flex flex-col gap-3 transition-all duration-300',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
                asChild
              >
                <a href={`tel:${phoneNumber}`}>
                  <Phone className="h-5 w-5" />
                  <span className="sr-only">Call us</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Call us</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform bg-[#0084ff] hover:bg-[#0077e6] text-white"
                asChild
              >
                <a href={messengerLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">Chat on Messenger</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Chat on Messenger</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
                asChild
              >
                <a href={helpLink}>
                  <HelpCircle className="h-5 w-5" />
                  <span className="sr-only">Help & FAQ</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Help & FAQ</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main toggle button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className={cn(
                'h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-all duration-300',
                isOpen ? 'rotate-45 bg-destructive hover:bg-destructive/90' : ''
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MessageCircle className="h-6 w-6" />
              )}
              <span className="sr-only">{isOpen ? 'Close' : 'Quick Contact'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? 'Close' : 'Need Help?'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
