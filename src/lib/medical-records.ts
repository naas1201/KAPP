// Medical Record Types and XML Export Utility
// Compliant with Philippine healthcare documentation standards

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
  
  // Patient demographics (for export purposes)
  patientName?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  patientAddress?: string;
  
  // Medical history
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  allergies: string;
  currentMedications: string;
  
  // Physical examination
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  physicalExamFindings: string;
  
  // Assessment and plan
  diagnosis: string;
  differentialDiagnosis?: string;
  treatmentPlan: string;
  
  // Additional notes
  laboratoryResults?: string;
  imagingResults?: string;
  proceduresPerformed?: string;
  followUpInstructions?: string;
  
  // For aesthetic services
  skinCareRoutine?: string;
  aestheticGoals?: string;
  treatmentNotes?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  
  // Status
  status: 'draft' | 'completed' | 'archived';
}

/**
 * Escapes special XML characters in a string
 */
export function escapeXml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a MedicalRecord to XML format
 * Philippines DOH-compliant format with standard medical documentation structure
 * @param clinicName - Clinic name (required for proper documentation)
 */
export function exportMedicalRecordToXml(record: MedicalRecord, doctorName: string, clinicName: string): string {
  const now = new Date().toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MedicalRecord xmlns="http://health.gov.ph/medical-record/v1" version="1.0">
  <DocumentInfo>
    <RecordId>${escapeXml(record.id)}</RecordId>
    <CreatedAt>${escapeXml(record.createdAt)}</CreatedAt>
    <UpdatedAt>${escapeXml(record.updatedAt)}</UpdatedAt>
    <ExportedAt>${now}</ExportedAt>
    <Status>${escapeXml(record.status)}</Status>
    <Clinic>${escapeXml(clinicName)}</Clinic>
    <AttendingPhysician>${escapeXml(doctorName)}</AttendingPhysician>
  </DocumentInfo>
  
  <PatientInfo>
    <PatientId>${escapeXml(record.patientId)}</PatientId>
    <Name>${escapeXml(record.patientName)}</Name>
    <DateOfBirth>${escapeXml(record.patientDateOfBirth)}</DateOfBirth>
    <Gender>${escapeXml(record.patientGender)}</Gender>
    <Address>${escapeXml(record.patientAddress)}</Address>
  </PatientInfo>
  
  <ClinicalHistory>
    <ChiefComplaint>${escapeXml(record.chiefComplaint)}</ChiefComplaint>
    <HistoryOfPresentIllness>${escapeXml(record.historyOfPresentIllness)}</HistoryOfPresentIllness>
    <PastMedicalHistory>${escapeXml(record.pastMedicalHistory)}</PastMedicalHistory>
    <FamilyHistory>${escapeXml(record.familyHistory)}</FamilyHistory>
    <SocialHistory>${escapeXml(record.socialHistory)}</SocialHistory>
    <Allergies>${escapeXml(record.allergies)}</Allergies>
    <CurrentMedications>${escapeXml(record.currentMedications)}</CurrentMedications>
  </ClinicalHistory>
  
  <PhysicalExamination>
    <VitalSigns>
      <BloodPressure unit="mmHg">${escapeXml(record.vitalSigns.bloodPressure)}</BloodPressure>
      <HeartRate unit="bpm">${escapeXml(record.vitalSigns.heartRate)}</HeartRate>
      <Temperature unit="°C">${escapeXml(record.vitalSigns.temperature)}</Temperature>
      <RespiratoryRate unit="breaths/min">${escapeXml(record.vitalSigns.respiratoryRate)}</RespiratoryRate>
      <Weight unit="kg">${escapeXml(record.vitalSigns.weight)}</Weight>
      <Height unit="cm">${escapeXml(record.vitalSigns.height)}</Height>
      <BMI unit="kg/m²">${escapeXml(record.vitalSigns.bmi)}</BMI>
    </VitalSigns>
    <Findings>${escapeXml(record.physicalExamFindings)}</Findings>
  </PhysicalExamination>
  
  <DiagnosticResults>
    <LaboratoryResults>${escapeXml(record.laboratoryResults)}</LaboratoryResults>
    <ImagingResults>${escapeXml(record.imagingResults)}</ImagingResults>
  </DiagnosticResults>
  
  <Assessment>
    <Diagnosis>${escapeXml(record.diagnosis)}</Diagnosis>
    <DifferentialDiagnosis>${escapeXml(record.differentialDiagnosis)}</DifferentialDiagnosis>
  </Assessment>
  
  <Plan>
    <TreatmentPlan>${escapeXml(record.treatmentPlan)}</TreatmentPlan>
    <ProceduresPerformed>${escapeXml(record.proceduresPerformed)}</ProceduresPerformed>
    <FollowUpInstructions>${escapeXml(record.followUpInstructions)}</FollowUpInstructions>
  </Plan>
  
  ${record.skinCareRoutine || record.aestheticGoals ? `
  <AestheticServices>
    <SkinCareRoutine>${escapeXml(record.skinCareRoutine)}</SkinCareRoutine>
    <AestheticGoals>${escapeXml(record.aestheticGoals)}</AestheticGoals>
    <TreatmentNotes>${escapeXml(record.treatmentNotes)}</TreatmentNotes>
  </AestheticServices>
  ` : ''}
  
  <DigitalSignature>
    <SignedBy>${escapeXml(doctorName)}</SignedBy>
    <SignedAt>${now}</SignedAt>
    <Certification>This medical record is certified accurate and complete by the attending physician.</Certification>
  </DigitalSignature>
</MedicalRecord>`;

  return xml;
}

/**
 * Triggers download of XML file in browser
 */
export function downloadXmlFile(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename for the XML export
 */
export function generateMedicalRecordFilename(patientName: string, recordId: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  return `MedicalRecord_${sanitizedName}_${date}_${recordId.slice(0, 8)}.xml`;
}

/**
 * Default empty medical record for creation
 */
export function createEmptyMedicalRecord(patientId: string, doctorId: string): Omit<MedicalRecord, 'id'> {
  const now = new Date().toISOString();
  return {
    patientId,
    doctorId,
    createdAt: now,
    updatedAt: now,
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    familyHistory: '',
    socialHistory: '',
    allergies: '',
    currentMedications: '',
    vitalSigns: {},
    physicalExamFindings: '',
    diagnosis: '',
    treatmentPlan: '',
    status: 'draft',
  };
}
