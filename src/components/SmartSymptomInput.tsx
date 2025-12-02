'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ClipboardList, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface SymptomAnalysis {
  structuredSymptoms: string;
  relevantQuestions: string[];
  preConsultationTips: string[];
  urgencyLevel: 'routine' | 'should_schedule_soon' | 'seek_immediate_care';
  disclaimer: string;
}

interface SmartSymptomInputProps {
  onSymptomsStructured?: (structured: string) => void;
  initialSymptoms?: string;
}

export function SmartSymptomInput({ onSymptomsStructured, initialSymptoms = '' }: SmartSymptomInputProps) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSymptoms = useCallback(async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // For now, we'll provide a static helpful response since AI requires server-side setup
      // In production, this would call the AI flow
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
      
      const mockAnalysis: SymptomAnalysis = {
        structuredSymptoms: `Patient reports: ${symptoms}. This should be discussed with the physician during consultation.`,
        relevantQuestions: [
          'When did these symptoms first begin?',
          'Is there anything that makes the symptoms better or worse?',
          'Have you tried any treatments or medications?',
          'Do you have any known allergies?',
        ],
        preConsultationTips: [
          'List all current medications including supplements',
          'Note any changes in your daily routine',
          'Prepare a brief health history summary',
        ],
        urgencyLevel: 'routine',
        disclaimer: 'This information is for consultation preparation only and does not constitute medical advice. Please consult with your physician for proper diagnosis and treatment.',
      };
      
      setAnalysis(mockAnalysis);
      if (onSymptomsStructured) {
        onSymptomsStructured(mockAnalysis.structuredSymptoms);
      }
    } catch (err) {
      setError('Unable to analyze symptoms. Please describe them directly to your doctor.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [symptoms, onSymptomsStructured]);

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'seek_immediate_care':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Seek Immediate Care</Badge>;
      case 'should_schedule_soon':
        return <Badge className="bg-yellow-500 gap-1"><AlertCircle className="w-3 h-3" /> Schedule Soon</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Routine Consultation</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium">Describe Your Symptoms</label>
        </div>
        <Textarea
          placeholder="Please describe your symptoms or concerns in detail. For example: 'I have been experiencing headaches for the past week, mostly in the morning. The pain is on the left side and sometimes I feel nauseous...'"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            The more details you provide, the better prepared your doctor will be.
          </p>
          <Button
            onClick={analyzeSymptoms}
            disabled={!symptoms.trim() || isAnalyzing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Smart Prepare
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Consultation Preparation
                  </CardTitle>
                  {getUrgencyBadge(analysis.urgencyLevel)}
                </div>
                <CardDescription>
                  Here&apos;s how to make the most of your appointment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Structured Symptoms */}
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm font-medium mb-1">Your Summary</p>
                  <p className="text-sm text-muted-foreground">{analysis.structuredSymptoms}</p>
                </div>

                {/* Questions to Prepare */}
                <div>
                  <p className="text-sm font-medium mb-2">Be Ready to Answer</p>
                  <ul className="space-y-1">
                    {analysis.relevantQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div>
                  <p className="text-sm font-medium mb-2">Pre-Consultation Tips</p>
                  <ul className="space-y-1">
                    {analysis.preConsultationTips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer */}
                <Alert variant="default" className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    {analysis.disclaimer}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
