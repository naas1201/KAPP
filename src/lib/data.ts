import type { Doctor, Service } from './types';

export const services: Service[] = [
  {
    slug: 'general-medicine',
    title: 'General Medicine',
    description: 'Comprehensive primary care for all ages.',
    longDescription: 'Our general medicine services focus on providing comprehensive, patient-centered primary care. We are dedicated to preventing, diagnosing, and treating a wide range of health issues for patients of all ages. Your health and well-being are our top priorities.',
    image: 'general-med-service',
    imageHint: 'stethoscope medical',
    treatments: [
      {
        id: 'gm-1',
        name: 'Annual Physical Exam',
        description: 'A comprehensive check-up to assess your overall health and prevent potential health issues.',
        price: '₱2,500',
        faq: [
            { question: 'How often should I get a physical exam?', answer: 'We recommend an annual physical exam for most adults to screen for diseases, assess risk of future medical problems, and promote a healthy lifestyle.' },
            { question: 'What should I bring to my appointment?', answer: 'Please bring a valid ID, any previous medical records if you are a new patient, and a list of your current medications.' }
        ]
      },
      {
        id: 'gm-2',
        name: 'Vaccinations',
        description: 'Stay protected with essential vaccinations for flu, HPV, pneumonia, and more.',
        price: 'Varies per vaccine',
      },
      {
        id: 'gm-3',
        name: 'Chronic Disease Management',
        description: 'Ongoing care and support for managing conditions like diabetes, hypertension, and asthma.',
      },
      {
        id: 'gm-4',
        name: 'Minor Injury Care',
        description: 'Treatment for non-life-threatening injuries such as cuts, sprains, and minor burns.',
      },
    ],
  },
  {
    slug: 'aesthetic-treatments',
    title: 'Aesthetic Treatments',
    description: 'Enhance your natural beauty with our advanced aesthetic solutions.',
    longDescription: 'Our aesthetic treatments are designed to rejuvenate your skin, enhance your natural features, and boost your confidence. Dr. Castillo combines artistry with medical expertise to deliver safe, effective, and beautiful results. We use state-of-the-art technology and techniques tailored to your unique goals.',
    image: 'aesthetic-service',
    imageHint: 'skin care',
    treatments: [
      {
        id: 'at-1',
        name: 'Botox Injections',
        description: 'Smooth out wrinkles and fine lines for a refreshed, youthful appearance.',
        price: 'Starts at ₱5,000',
        beforeAfter: [
          { before: 'aesthetic-before-1', after: 'aesthetic-after-1' },
        ],
        faq: [
            { question: 'How long does Botox last?', answer: 'Results typically last for 3 to 4 months. With regular treatments, the effects may last longer.' },
            { question: 'Is the procedure painful?', answer: 'Most patients report only a minor, temporary discomfort. We use a very fine needle to minimize any pain.' }
        ]
      },
      {
        id: 'at-2',
        name: 'Dermal Fillers',
        description: 'Restore volume, contour facial features, and soften creases with hyaluronic acid fillers.',
        price: 'Starts at ₱15,000',
        beforeAfter: [
          { before: 'aesthetic-before-2', after: 'aesthetic-after-2' },
        ],
      },
      {
        id: 'at-3',
        name: 'Chemical Peels',
        description: 'Improve skin texture and tone by removing the outermost layers of the skin.',
        price: 'Starts at ₱3,500',
      },
      {
        id: 'at-4',
        name: 'Microneedling with PRP',
        description: "Stimulate collagen production and enhance skin repair using your body's own growth factors.",
        price: 'Starts at ₱8,000',
      },
    ],
  },
];


export const doctors: Doctor[] = [
  {
    id: 'default-doctor-id',
    firstName: 'Katheryne',
    lastName: 'Castillo',
    specialization: 'General & Aesthetic Medicine',
    email: 'dr.castillo@example.com',
  },
  {
    id: 'doctor-2',
    firstName: 'Maria',
    lastName: 'Santos',
    specialization: 'Dermatology',
    email: 'dr.santos@example.com',
  },
  {
    id: 'doctor-3',
    firstName: 'Jose',
    lastName: 'Rizal',
    specialization: 'General Medicine',
    email: 'dr.rizal@example.com',
  },
  {
    id: 'doctor-4',
    firstName: 'Lourdes',
    lastName: 'Gomez',
    specialization: 'Aesthetic Medicine',
    email: 'dr.gomez@example.com',
  },
  {
    id: 'doctor-5',
    firstName: 'Antonio',
    lastName: 'Luna',
    specialization: 'Internal Medicine',
    email: 'dr.luna@example.com',
  },
];
