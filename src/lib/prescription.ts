// Prescription System - Philippines DOH and FDA Compliant
// Supports digital signatures, stamps, and professional formatting

import { add, format, isBefore } from 'date-fns';

export interface PrescriptionItem {
  drugName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  instructions: string;
  isControlled?: boolean; // For S2 or controlled substances
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // Unique prescription number
  patientId: string;
  doctorId: string;
  
  // Patient info
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientAddress: string;
  
  // Doctor info
  doctorName: string;
  doctorLicenseNumber: string; // PRC License Number
  doctorPtrNumber?: string; // Professional Tax Receipt Number
  doctorS2Number?: string; // S2 License for controlled substances
  doctorSpecialization: string;
  clinicName: string;
  clinicAddress: string;
  clinicContactNumber: string;
  
  // Prescription content
  items: PrescriptionItem[];
  diagnosis?: string;
  specialInstructions?: string;
  
  // Digital assets
  doctorSignatureUrl?: string;
  doctorStampUrl?: string;
  
  // Dates and validity
  dateIssued: string;
  expiryDate: string;
  validityDays: number;
  
  // Status
  status: 'draft' | 'issued' | 'expired' | 'cancelled' | 'renewed';
  renewedFromId?: string;
  renewedToId?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Generates a unique prescription number
 * Format: RX-YYYYMMDD-XXXX (compliant with Philippine pharmacy standards)
 */
export function generatePrescriptionNumber(): string {
  const date = new Date();
  const dateStr = format(date, 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${dateStr}-${random}`;
}

/**
 * Calculates the expiry date based on validity days
 * Default is 30 days for regular prescriptions
 * 7 days for controlled substances (S2)
 */
export function calculateExpiryDate(issuedDate: Date, validityDays: number = 30): Date {
  return add(issuedDate, { days: validityDays });
}

/**
 * Checks if a prescription is still valid
 */
export function isPrescriptionValid(prescription: Prescription): boolean {
  if (prescription.status === 'cancelled' || prescription.status === 'expired') {
    return false;
  }
  
  const expiryDate = new Date(prescription.expiryDate);
  return !isBefore(expiryDate, new Date());
}

/**
 * Gets the validity status message
 */
export function getValidityStatus(prescription: Prescription): { status: string; color: string; message: string } {
  if (prescription.status === 'cancelled') {
    return { status: 'cancelled', color: 'red', message: 'This prescription has been cancelled.' };
  }
  
  const expiryDate = new Date(prescription.expiryDate);
  const now = new Date();
  
  if (isBefore(expiryDate, now)) {
    return { status: 'expired', color: 'red', message: 'This prescription has expired.' };
  }
  
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 3) {
    return { status: 'expiring', color: 'orange', message: `Expires in ${daysUntilExpiry} day(s).` };
  }
  
  return { status: 'valid', color: 'green', message: `Valid until ${format(expiryDate, 'MMMM d, yyyy')}.` };
}

/**
 * Creates a default empty prescription
 */
export function createEmptyPrescription(
  patientId: string,
  doctorId: string,
  doctorInfo: {
    name: string;
    licenseNumber: string;
    ptrNumber?: string;
    s2Number?: string;
    specialization: string;
    clinicName: string;
    clinicAddress: string;
    clinicContact: string;
  }
): Omit<Prescription, 'id'> {
  const now = new Date();
  const validityDays = 30;
  
  return {
    prescriptionNumber: generatePrescriptionNumber(),
    patientId,
    doctorId,
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientAddress: '',
    doctorName: doctorInfo.name,
    doctorLicenseNumber: doctorInfo.licenseNumber,
    doctorPtrNumber: doctorInfo.ptrNumber,
    doctorS2Number: doctorInfo.s2Number,
    doctorSpecialization: doctorInfo.specialization,
    clinicName: doctorInfo.clinicName,
    clinicAddress: doctorInfo.clinicAddress,
    clinicContactNumber: doctorInfo.clinicContact,
    items: [],
    dateIssued: now.toISOString(),
    expiryDate: calculateExpiryDate(now, validityDays).toISOString(),
    validityDays,
    status: 'draft',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Renews a prescription with updated dates
 */
export function renewPrescription(
  originalPrescription: Prescription,
  validityDays: number = 30
): Omit<Prescription, 'id'> {
  const now = new Date();
  
  return {
    ...originalPrescription,
    prescriptionNumber: generatePrescriptionNumber(),
    dateIssued: now.toISOString(),
    expiryDate: calculateExpiryDate(now, validityDays).toISOString(),
    validityDays,
    status: 'draft',
    renewedFromId: originalPrescription.id,
    renewedToId: undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Common drug routes in Filipino/English
 */
export const DRUG_ROUTES = [
  { value: 'oral', label: 'Oral (By Mouth / Inumin)' },
  { value: 'topical', label: 'Topical (Apply to Skin / Ipahid)' },
  { value: 'injection', label: 'Injection (Iturok)' },
  { value: 'inhalation', label: 'Inhalation (Isinghot)' },
  { value: 'other', label: 'Other (Iba pa)' },
];

/**
 * Common dosage frequencies in Filipino/English
 */
export const DOSAGE_FREQUENCIES = [
  { value: 'once_daily', label: 'Once a day (Isang beses sa isang araw)' },
  { value: 'twice_daily', label: 'Twice a day (Dalawang beses sa isang araw)' },
  { value: 'three_times_daily', label: 'Three times a day (Tatlong beses sa isang araw)' },
  { value: 'four_times_daily', label: 'Four times a day (Apat na beses sa isang araw)' },
  { value: 'every_4_hours', label: 'Every 4 hours (Bawat 4 na oras)' },
  { value: 'every_6_hours', label: 'Every 6 hours (Bawat 6 na oras)' },
  { value: 'every_8_hours', label: 'Every 8 hours (Bawat 8 oras)' },
  { value: 'every_12_hours', label: 'Every 12 hours (Bawat 12 oras)' },
  { value: 'as_needed', label: 'As needed (Kung kinakailangan)' },
  { value: 'at_bedtime', label: 'At bedtime (Bago matulog)' },
  { value: 'with_meals', label: 'With meals (Kasabay ng pagkain)' },
  { value: 'before_meals', label: 'Before meals (Bago kumain)' },
  { value: 'after_meals', label: 'After meals (Pagkatapos kumain)' },
];

/**
 * Validates that the prescription meets Philippine DOH requirements
 */
export function validatePrescription(prescription: Prescription): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!prescription.patientName) errors.push('Patient name is required.');
  if (!prescription.patientAddress) errors.push('Patient address is required.');
  if (!prescription.doctorName) errors.push('Doctor name is required.');
  if (!prescription.doctorLicenseNumber) errors.push('PRC License Number is required.');
  if (prescription.items.length === 0) errors.push('At least one medication is required.');
  
  // Validate each item
  prescription.items.forEach((item, index) => {
    if (!item.drugName) errors.push(`Item ${index + 1}: Drug name is required.`);
    if (!item.dosage) errors.push(`Item ${index + 1}: Dosage is required.`);
    if (!item.quantity) errors.push(`Item ${index + 1}: Quantity is required.`);
    
    // S2 license required for controlled substances
    if (item.isControlled && !prescription.doctorS2Number) {
      errors.push(`Item ${index + 1}: S2 License is required for controlled substances.`);
    }
  });
  
  // Signature required for issued prescriptions
  if (prescription.status === 'issued' && !prescription.doctorSignatureUrl) {
    errors.push('Digital signature is required to issue the prescription.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats the prescription for printing (returns HTML string)
 */
export function formatPrescriptionForPrint(prescription: Prescription): string {
  const formattedDate = format(new Date(prescription.dateIssued), 'MMMM d, yyyy');
  const expiryDate = format(new Date(prescription.expiryDate), 'MMMM d, yyyy');
  
  let itemsHtml = prescription.items.map((item, index) => `
    <div class="prescription-item">
      <strong>${index + 1}. ${item.drugName}</strong>
      ${item.genericName ? `<span class="generic">(${item.genericName})</span>` : ''}
      <br/>
      <span class="dosage">${item.dosage} - ${item.frequency}</span>
      <br/>
      <span class="instructions">${item.instructions}</span>
      <br/>
      <span class="quantity">Qty: ${item.quantity} | Duration: ${item.duration}</span>
      ${item.isControlled ? '<br/><span class="controlled">⚠️ Controlled Substance (S2)</span>' : ''}
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Prescription - ${prescription.prescriptionNumber}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .clinic-name { font-size: 24px; font-weight: bold; color: #1a365d; }
    .clinic-info { font-size: 12px; color: #666; }
    .rx-symbol { font-size: 48px; font-weight: bold; color: #2563eb; margin: 20px 0; }
    .patient-info { margin-bottom: 20px; padding: 10px; background: #f8fafc; border-radius: 5px; }
    .prescription-body { min-height: 300px; }
    .prescription-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #2563eb; }
    .generic { color: #666; font-style: italic; }
    .dosage { color: #1e40af; }
    .instructions { color: #374151; }
    .quantity { font-size: 12px; color: #666; }
    .controlled { color: #dc2626; font-weight: bold; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; }
    .signature-line { border-top: 1px solid #333; width: 200px; margin: 60px auto 5px; }
    .license { font-size: 11px; color: #666; }
    .validity { margin-top: 20px; padding: 10px; background: #fef3c7; border-radius: 5px; font-size: 12px; }
    .stamp { max-width: 100px; margin-top: 10px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">${prescription.clinicName}</div>
    <div class="clinic-info">
      ${prescription.clinicAddress}<br/>
      Tel: ${prescription.clinicContactNumber}
    </div>
    <div class="doctor-info" style="margin-top: 10px;">
      <strong>${prescription.doctorName}</strong><br/>
      ${prescription.doctorSpecialization}
    </div>
  </div>
  
  <div class="rx-symbol">℞</div>
  <div class="prescription-number" style="text-align: right; font-size: 12px; color: #666;">
    Rx No: ${prescription.prescriptionNumber}<br/>
    Date: ${formattedDate}
  </div>
  
  <div class="patient-info">
    <strong>Patient:</strong> ${prescription.patientName}<br/>
    <strong>Age/Gender:</strong> ${prescription.patientAge} / ${prescription.patientGender}<br/>
    <strong>Address:</strong> ${prescription.patientAddress}
  </div>
  
  ${prescription.diagnosis ? `<div class="diagnosis"><strong>Diagnosis:</strong> ${prescription.diagnosis}</div>` : ''}
  
  <div class="prescription-body">
    ${itemsHtml}
  </div>
  
  ${prescription.specialInstructions ? `
    <div class="special-instructions" style="margin-top: 20px; padding: 10px; background: #f0fdf4; border-radius: 5px;">
      <strong>Special Instructions:</strong> ${prescription.specialInstructions}
    </div>
  ` : ''}
  
  <div class="validity">
    <strong>⏰ Valid Until:</strong> ${expiryDate}<br/>
    This prescription expires ${prescription.validityDays} days from the date of issue.
  </div>
  
  <div class="footer">
    <div></div>
    <div class="signature-block">
      ${prescription.doctorSignatureUrl ? `<img src="${prescription.doctorSignatureUrl}" alt="Signature" style="max-height: 60px;"/>` : ''}
      <div class="signature-line"></div>
      <strong>${prescription.doctorName}</strong><br/>
      <span class="license">PRC License No.: ${prescription.doctorLicenseNumber}</span><br/>
      ${prescription.doctorPtrNumber ? `<span class="license">PTR No.: ${prescription.doctorPtrNumber}</span><br/>` : ''}
      ${prescription.doctorS2Number ? `<span class="license">S2 License No.: ${prescription.doctorS2Number}</span><br/>` : ''}
      ${prescription.doctorStampUrl ? `<img src="${prescription.doctorStampUrl}" alt="Stamp" class="stamp"/>` : ''}
    </div>
  </div>
  
  <div style="margin-top: 30px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px;">
    This is a computer-generated prescription and is valid with digital signature.<br/>
    For verification, contact ${prescription.clinicContactNumber}
  </div>
</body>
</html>
  `;
}

/**
 * Opens a print dialog with the formatted prescription
 */
export function printPrescription(prescription: Prescription): void {
  const printContent = formatPrescriptionForPrint(prescription);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
