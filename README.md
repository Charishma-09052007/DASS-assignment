
## Task 1: Introduction

The Felicity Event Management System is a MERN-based centralized platform designed to manage fest events, participants, organizers, and administrative workflows.  
It replaces manual tools such as Google Forms and spreadsheets with structured dashboards, role-based access, and automated event registration.

The system supports three roles: Participant, Organizer, and Admin.

---

## Task 2: Technology Stack

| Layer | Technology | Justification |
|------|------------|---------------|
| Frontend | React.js | Component-based SPA with fast rendering |
| Routing | React Router DOM | Client-side navigation |
| State | React Context API | Centralized authentication |
| API | Axios | HTTP communication |
| Styling | Tailwind CSS / CSS | Rapid UI development |
| Backend | Node.js + Express.js | REST API implementation |
| Database | MongoDB Atlas | Scalable NoSQL storage |
| ODM | Mongoose | Schema validation |
| Auth | JWT | Stateless authentication |
| Password Hashing | bcrypt | Secure password storage |
| Deployment | Vercel + Render | Cloud hosting |

---

## Task 3: User Roles

Each user has exactly one role:

- Participant  
- Organizer  
- Admin  

Role switching is strictly prohibited.  
Role is stored in the `role` field and enforced using RBAC.

---

## Task 4: Authentication & Security

### Registration & Login

- Participants self-register.
- IIIT participants must use IIIT domain email.
- Organizers are created only by Admin.
- Admin account is provisioned in backend.

Passwords are hashed using bcrypt.

JWT tokens are issued on login.

---

### Security

| Feature | Implementation |
|--------|---------------|
| Password hashing | bcrypt |
| Authentication | JWT |
| Route protection | PrivateRoute |
| Role enforcement | RBAC |
| API protection | JWT middleware |

---

### Session Management

- JWT stored in localStorage.
- Session persists across refresh.
- Logout clears token and user data.
- Users redirected to role dashboards after login.

---

## Task 5: User Onboarding & Preferences

Participants may configure:

- Areas of Interest  
- Followed Clubs  

Stored in database and editable from Profile.

Fields added:

- `interests`
- `followedClubs`
- `onboardingCompleted`

Used for personalized event ordering.

---

## Task 6: User Data Models

### 6.1 Participant Details

| Attribute | Type | Description | Justification |
|-----------|------|-------------|---------------|
| firstName | String | First name | Identification |
| lastName | String | Last name | Identification |
| email | String (unique) | Login email | Unique auth |
| password | String (hashed) | Password | Security |
| participantType | Enum | IIIT / Non-IIIT | Eligibility |
| collegeName | String | College | Verification |
| contactNumber | String | Phone | Communication |
| interests | Array | Preferences | Recommendations |
| followedClubs | Array | Followed organizers | Filtering |
| onboardingCompleted | Boolean | Setup status | UX flow |
| role | Enum | User role | RBAC |
| isActive | Boolean | Account status | Admin control |

---

### 6.2 Organizer Details

| Attribute | Type | Description |
|----------|------|-------------|
| organizerName | String | Organizer name |
| category | String | Event category |
| description | String | Organizer info |
| contactEmail | String | Official email |
| contactNumber | String | Contact |
| role | Enum | Organizer |

---

### Design Decisions

1. Single `users` collection with `role` field  
2. bcrypt hashing  
3. Unique email constraint  
4. Enum-based participantType  
5. Preference fields added for Task 5

---

## Task 7: Event Types

| Type | Description |
|------|-------------|
| Normal | Individual registration |
| Merchandise | Individual purchase |

Stored in unified `events` collection.

---

## Task 8: Event Attributes

- Event Name  
- Description  
- Type  
- Eligibility  
- Registration Deadline  
- Start Date  
- End Date  
- Registration Limit  
- Organizer ID  
- Tags  

Merchandise adds:

- Variants  
- Stock Quantity  
- Purchase Limit  

---

## Task 9: Participant Features

### Navigation
Dashboard, Browse Events, Clubs, Profile, Logout

---

### Dashboard
- Upcoming events  
- Participation history  
- Ticket IDs  
- Event status  

---

### Browse Events
- Search  
- Filters  
- Followed clubs  
- Trending events  

---

### Registration
Normal:
- Ticket generation
- Email confirmation  

Merchandise:
- Stock decrement
- QR ticket
- Email confirmation  

---

### Profile
Editable:
- Name
- Contact
- Interests
- Followed clubs  

Non-editable:
- Email
- Participant type  

---

## Task 10: Organizer Features

### Navigation
Dashboard, Create Event, Profile, Logout

---

### Organizer Dashboard
- Event carousel  
- Status display  
- Analytics  

---

### Event Management
Draft → Configure → Publish  
Editing rules enforced by status.

---

### Organizer Profile
Editable organizer information.

---

## Task 11: Admin Features

### Navigation
Dashboard, Manage Clubs, Password Resets, Logout

---

### Organizer Management
Admin can:

- Create organizers
- Auto-generate credentials
- Disable/remove accounts

---

## Task 12: Deployment

| Component | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

deployment.txt contains frontend + backend URLs.

---

## Task 13: Advanced Features

Tier A:
- QR Attendance Tracking  
- Merchandise Approval  

Tier B:
- Organizer Password Reset  
- Discussion Forum  

Tier C:
- Add to Calendar  

---

## Project Structure
