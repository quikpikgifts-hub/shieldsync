ShieldSync — Security Management Platform
A premium physical security management web application with real-time incident tracking, guard roster management, and access control logging.
Features
🔐 Firebase Authentication (Email/Password)
🚨 Incident Reporting & Tracking (with severity levels)
👮 Guard Roster Management (on-duty/off-duty status)
🔒 Access Control Logging (key card, PIN, biometric, etc.)
📊 Live Dashboard with threat level meter
📋 Report Generation
⏱️ Live clock & real-time data sync via Firestore
Stack
Vanilla HTML/CSS/JavaScript (no build step required)
Firebase v10 (Auth + Firestore) via CDN
Deployed on Vercel
Setup
1. Firebase Configuration
Open `index.html` and replace the placeholder Firebase config values with your real ones from the Firebase Console:
```js
const firebaseConfig = {
  apiKey: "YOUR\_REAL\_API\_KEY",
  authDomain: "shieldsync-1ffe0.firebaseapp.com",
  projectId: "shieldsync-1ffe0",
  storageBucket: "shieldsync-1ffe0.appspot.com",
  messagingSenderId: "YOUR\_MESSAGING\_SENDER\_ID",
  appId: "YOUR\_APP\_ID"
};
```
Get these values from: Firebase Console → Project Settings → Your apps → Web app
2. Enable Firebase Services
In Firebase Console (`shieldsync-1ffe0`):
Authentication → Sign-in method → Enable Email/Password
Firestore Database → Create database → Start in test mode (then add security rules)
3. Firestore Security Rules (Recommended)
```
rules\_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null \&\& request.resource.data.uid == request.auth.uid;
      allow read, delete: if request.auth != null \&\& resource.data.uid == request.auth.uid;
    }
  }
}
```
4. Deploy to Vercel
Already configured at `shieldsync-app.vercel.app`. Just push to GitHub — Vercel auto-deploys.
File Structure
```
shieldsync/
├── index.html     # Full app (auth + dashboard + all views)
├── styles.css     # Premium dark UI stylesheet
└── README.md
```
Collections (Firestore)
Collection	Fields
`incidents`	type, location, severity, description, status, uid, createdAt
`guards`	name, zone, shift, status, uid, createdAt
`access\_logs`	person, zone, method, granted, uid, createdAt
