# KAPP Development Guide

This guide explains how to add new features, collections, and templates to the KAPP medical booking application.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Adding New Firestore Collections](#adding-new-firestore-collections)
3. [Adding New Pages](#adding-new-pages)
4. [Adding New Components](#adding-new-components)
5. [Role-Based Access Control](#role-based-access-control)
6. [Common Patterns](#common-patterns)
7. [File Upload Guide](#file-upload-guide)
8. [AI/GenKit Flows](#aigenkit-flows)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin-only pages
│   ├── doctor/             # Doctor-only pages
│   ├── patient/            # Patient-only pages
│   ├── booking/            # Public booking flow
│   └── ...
├── components/             # Reusable React components
│   └── ui/                 # Shadcn UI primitives
├── firebase/               # Firebase configuration and hooks
│   ├── client.ts           # Firebase client initialization
│   ├── hooks.ts            # Custom React hooks for Firebase
│   └── non-blocking-*.tsx  # Non-blocking update utilities
├── lib/                    # Utilities, types, and data
│   ├── data.ts             # Static data (services, doctors)
│   └── types.ts            # TypeScript type definitions
└── ai/                     # GenKit AI flows
    ├── genkit.ts           # AI client configuration
    └── flows/              # AI flow implementations
```

### Key Technologies

- **Next.js 15** with App Router
- **Firebase** (Auth, Firestore)
- **Shadcn/UI** for components
- **Tailwind CSS** for styling
- **GenKit** for AI features

---

## Adding New Firestore Collections

### Step 1: Define the Collection Schema

Create a TypeScript interface in `/src/lib/types.ts`:

```typescript
// Example: Adding a new "reminders" collection
export interface Reminder {
  id: string;
  patientId: string;
  doctorId: string;
  message: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}
```

### Step 2: Update Firestore Security Rules

Edit `/firestore.rules` to add access controls:

```javascript
// Add this match block inside the main database documents match
match /reminders/{reminderId} {
  // Only admins and the assigned doctor can read
  allow read: if isAdmin() || (isDoctor() && resource.data.doctorId == request.auth.uid);
  // Only admins can create reminders
  allow create: if isAdmin();
  // Doctors can update their own reminders
  allow update: if isDoctor() && resource.data.doctorId == request.auth.uid;
  // Only admins can delete
  allow delete: if isAdmin();
}
```

### Step 3: Create a Hook to Access the Collection

Add a query hook in your component or create a shared hook:

```typescript
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase/hooks';
import { collection, query, where, orderBy } from 'firebase/firestore';

// In your component:
const { firestore, user } = useFirebase();

const remindersQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(
    collection(firestore, 'reminders'),
    where('doctorId', '==', user.uid),
    orderBy('scheduledAt', 'desc')
  );
}, [firestore, user]);

const { data: reminders, isLoading } = useCollection<Reminder>(remindersQuery);
```

### Step 4: Add Write Functions

Use non-blocking updates for better UX:

```typescript
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

// Create a new reminder
const createReminder = async () => {
  const reminderRef = collection(firestore, 'reminders');
  await addDocumentNonBlocking(reminderRef, {
    patientId: patient.id,
    doctorId: user.uid,
    message: 'Follow-up appointment reminder',
    scheduledAt: new Date().toISOString(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

// Update a reminder
const updateReminder = async (reminderId: string) => {
  const reminderRef = doc(firestore, 'reminders', reminderId);
  await updateDocumentNonBlocking(reminderRef, {
    status: 'sent',
    sentAt: serverTimestamp(),
  });
};
```

---

## Adding New Pages

### Step 1: Create the Page File

Create a new file in the appropriate directory:

**For Admin pages:** `/src/app/admin/[page-name]/page.tsx`
**For Doctor pages:** `/src/app/doctor/[page-name]/page.tsx`
**For Patient pages:** `/src/app/patient/[page-name]/page.tsx`

### Step 2: Basic Page Template

```typescript
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase/hooks';

export default function MyNewPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);

  if (isUserLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Page Title</h1>
        <p className="text-muted-foreground">Page description here</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
          <CardDescription>Section description</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Your content here */}
          <p>Content goes here</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 3: Add Navigation Link

Update the appropriate layout file:

**For Admin:** `/src/app/admin/layout.tsx`
**For Doctor:** `/src/app/doctor/layout.tsx`
**For Patient:** `/src/app/patient/layout.tsx`

```typescript
<SidebarMenuItem>
  <SidebarMenuButton
    asChild
    isActive={pathname === '/admin/my-new-page'}
    tooltip={{ children: 'My New Page' }}
  >
    <Link href="/admin/my-new-page">
      <MyIcon />
      <span>My New Page</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

---

## Adding New Components

### Step 1: Create the Component

Create a new file in `/src/components/`:

```typescript
// /src/components/MyComponent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{title}</h3>
      <Button onClick={() => {
        setIsActive(!isActive);
        onAction?.();
      }}>
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  );
}
```

### Step 2: Use the Component

Import and use in any page:

```typescript
import { MyComponent } from '@/components/MyComponent';

// In your component
<MyComponent title="My Title" onAction={() => console.log('clicked')} />
```

---

## Role-Based Access Control

### User Roles

The application has three roles:
1. **Admin** - Full access to all features
2. **Doctor** - Access to patient data and consultations
3. **Patient** - Access to their own data only

### How Roles Are Determined

Roles are stored in the `/users` collection with the email as the document ID:

```typescript
// /users/user@example.com
{
  email: 'user@example.com',
  role: 'admin' | 'doctor' // If no document, user is a patient
}
```

### Checking Roles in Components

```typescript
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase/hooks';
import { doc } from 'firebase/firestore';

function MyComponent() {
  const { firestore, user } = useFirebase();

  const userRoleRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);

  const { data: userRoleData } = useDoc(userRoleRef);

  const isAdmin = userRoleData?.role === 'admin';
  const isDoctor = userRoleData?.role === 'doctor';
  const isPatient = !isAdmin && !isDoctor;

  // Use these flags to conditionally render content
  if (!isAdmin) return <p>Access denied</p>;

  return <div>Admin content</div>;
}
```

### Protecting Routes in Firestore Rules

The Firestore rules use helper functions:

```javascript
function isSignedIn() {
  return request.auth != null;
}

function isAdmin() {
  return isSignedIn() && getUserRole(request.auth.uid) == 'admin';
}

function isDoctor() {
  return isSignedIn() && getUserRole(request.auth.uid) == 'doctor';
}
```

---

## Common Patterns

### Fetching a Single Document

```typescript
import { useDoc, useMemoFirebase, useFirebase } from '@/firebase/hooks';
import { doc } from 'firebase/firestore';

const { firestore } = useFirebase();

const patientRef = useMemoFirebase(() => {
  if (!firestore) return null;
  return doc(firestore, 'patients', patientId);
}, [firestore, patientId]);

const { data: patient, isLoading, error } = useDoc(patientRef);
```

### Fetching a Collection

```typescript
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase/hooks';
import { collection, query, where, orderBy } from 'firebase/firestore';

const { firestore, user } = useFirebase();

const appointmentsQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(
    collection(firestore, 'appointments'),
    where('doctorId', '==', user.uid),
    orderBy('dateTime', 'desc')
  );
}, [firestore, user]);

const { data: appointments, isLoading } = useCollection(appointmentsQuery);
```

### Creating Documents

```typescript
import { addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const handleCreate = async () => {
  const docRef = collection(firestore, 'myCollection');
  const newDoc = await addDocumentNonBlocking(docRef, {
    field1: 'value1',
    createdAt: serverTimestamp(),
  });
  
  if (newDoc?.id) {
    console.log('Created document:', newDoc.id);
  }
};
```

### Updating Documents

```typescript
import { updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

const handleUpdate = async (docId: string) => {
  const docRef = doc(firestore, 'myCollection', docId);
  await updateDocumentNonBlocking(docRef, {
    field1: 'newValue',
    updatedAt: serverTimestamp(),
  });
};
```

### Deleting Documents

```typescript
import { deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const handleDelete = async (docId: string) => {
  const docRef = doc(firestore, 'myCollection', docId);
  await deleteDocumentNonBlocking(docRef);
};
```

---

## File Upload Guide

See `/docs/STORAGE_SETUP.md` for detailed Firebase Storage setup instructions.

### Quick Upload Example

```typescript
import { storage } from '@/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const handleUpload = async (file: File) => {
  const path = `patients/${patientId}/documents/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  
  const result = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(result.ref);
  
  return { url, path };
};
```

---

## AI/GenKit Flows

### Creating a New AI Flow

1. Create a new file in `/src/ai/flows/`:

```typescript
// /src/ai/flows/my-new-flow.ts
'use server';

import { z } from 'genkit';
import { ai } from '../genkit';

const MyInputSchema = z.object({
  input: z.string(),
});

const MyOutputSchema = z.object({
  result: z.string(),
});

const myPrompt = ai.definePrompt({
  name: 'myPrompt',
  input: { schema: MyInputSchema },
  output: { schema: MyOutputSchema },
  prompt: `You are a helpful assistant. Process this input: {{input}}`,
});

export const myFlow = ai.defineFlow(
  {
    name: 'myFlow',
    inputSchema: MyInputSchema,
    outputSchema: MyOutputSchema,
  },
  async (input) => {
    const { output } = await myPrompt(input);
    return output!;
  }
);
```

2. Register in `/src/ai/dev.ts`:

```typescript
import { myFlow } from './flows/my-new-flow';
// The flow is automatically registered when imported
```

3. Use in a component:

```typescript
import { myFlow } from '@/ai/flows/my-new-flow';

const handleGenerate = async () => {
  const result = await myFlow({ input: 'my input' });
  console.log(result);
};
```

---

## Troubleshooting

### Common Issues

**1. "Permission denied" errors**
- Check Firestore rules match your query
- Ensure user is authenticated
- Verify the user has the correct role

**2. "Cannot read property of null"**
- Add null checks for `firestore` and `user`
- Use `useMemoFirebase` to handle dependencies

**3. Data not updating**
- Use `serverTimestamp()` for time fields
- Check if the document exists before updating

**4. Build errors**
- Run `npm run typecheck` to check for type errors
- Ensure all imports are correct

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Build for production
npm run build

# Start GenKit AI dev server
npm run genkit:dev
```

### Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Production Checklist

Before deploying to production:

1. ✅ Update Firestore security rules
2. ✅ Test all user roles have correct access
3. ✅ Verify environment variables are set
4. ✅ Run `npm run build` successfully
5. ✅ Test payment flow (if applicable)
6. ✅ Review error handling
7. ✅ Check mobile responsiveness

---

## Seeding Staff Accounts

The project includes a script to create staff accounts (admin and doctor) for development and testing purposes.

### Running Against Firebase Emulator (Recommended for Development)

Start the Firebase emulators, then run:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
export AUTH_EMULATOR_HOST=localhost:9099
npm run seed:prod-staff-accounts
```

This creates:
- **Admin account:** `admin@lpp.ovh` with password `1q2w3e4r5t6y` (staffId: `admin1`)
- **Doctor account:** `doctor@lpp.ovh` with password `1q2w3e4r5t6y` (staffId: `doc1`)

### Running Against Production Firebase (Requires Explicit Flag)

To run this script against a production Firebase project, you **must** set the explicit safety flag:

```bash
export FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json
export PROCEED_WITH_HARD_CODED_PROD_ACCOUNTS=1
NODE_ENV=production npm run seed:prod-staff-accounts
```

⚠️ **SECURITY WARNING:** These accounts use hard-coded passwords and are **insecure** for production use. You must:
1. Change the passwords immediately after creation
2. Or remove these accounts before publishing to general users
3. Never commit your service account JSON to git

### After Seeding

You can log in with:
- **Admin:** `/admin/login` using `admin@lpp.ovh` / `1q2w3e4r5t6y`
- **Doctor:** `/doctor/login` using `doctor@lpp.ovh` / `1q2w3e4r5t6y`
