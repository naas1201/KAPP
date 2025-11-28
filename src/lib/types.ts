export interface FAQ {
  question: string;
  answer: string;
}

export interface BeforeAfterImage {
  before: string;
  after: string;
  beforeHint?: string;
  afterHint?: string;
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  price?: string;
  beforeAfter?: BeforeAfterImage[];
  faq?: FAQ[];
}

export interface Service {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  treatments: Treatment[];
  image: string;
  imageHint: string;
}

export interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    email: string;
}

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'doctor';
}
