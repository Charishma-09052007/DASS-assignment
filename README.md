## Task 6: User Data Models [2 Marks]

### 6.1 Participant Details

The participant model stores the following attributes:

| Attribute | Type | Description | Justification |
|-----------|------|-------------|---------------|
| `firstName` | String | Participant's first name | Required for identification and personalization |
| `lastName` | String | Participant's last name | Required for identification and personalization |
| `email` | String (unique) | Participant's email address | Used for login, communication, and as unique identifier |
| `password` | String (hashed) | Hashed password | Securely stored using bcrypt for authentication |
| `participantType` | Enum ['iiit', 'non-iiit'] | Type of participant | Used for domain validation and eligibility filtering |
| `collegeName` | String | College/Organization name | Required for non-IIIT participants for verification |
| `contactNumber` | String | 10-digit phone number | Required for communication and event coordination |
| `interests` | Array of Strings | User's areas of interest | Used for personalized event recommendations (Task 5) |
| `followedClubs` | Array of ObjectIds | Clubs the user follows | Enables "Followed Clubs" filter (Task 5) |
| `onboardingCompleted` | Boolean | Preference setup status | Tracks if user completed initial setup (Task 5) |
| `role` | Enum ['participant', 'organizer', 'admin'] | User role | Used for role-based access control |
| `isActive` | Boolean | Account status | Allows admin to disable accounts without deletion |

### 6.2 Organizer Details

The organizer model stores the following attributes within the `organizerDetails` object:

| Attribute | Type | Description | Justification |
|-----------|------|-------------|---------------|
| `organizerName` | String | Name of the club/organizer | Required for identification on events and listings |
| `category` | String | Category of the organizer (cultural, technical, sports) | Used for filtering and organizing events |
| `description` | String | Description of the organizer | Provides information to participants |
| `contactEmail` | String | Official contact email | Used for communication regarding events |
| `firstName` | String | Admin's first name | System requirement for user model |
| `lastName` | String | Admin's last name | System requirement for user model |
| `email` | String | Login email (auto-generated) | Used for authentication |
| `password` | String | Hashed password (auto-generated) | Secured using bcrypt |
| `contactNumber` | String | Contact number | Used for verification |
| `role` | Enum ['organizer'] | Fixed role | Distinguishes organizers from participants |

### Database Schema Design Decisions

1. **Single Collection Design**: Both participants and organizers are stored in the same `users` collection with a `role` field to differentiate them. This simplifies authentication and allows for future flexibility.

2. **Password Security**: All passwords are hashed using bcrypt with 12 rounds before storage, ensuring security even if the database is compromised.

3. **Unique Email Constraint**: Email addresses are unique across all users, preventing duplicate accounts and ensuring reliable authentication.

4. **Flexible Participant Types**: The `participantType` field with enum validation ensures data integrity while supporting both IIIT and non-IIIT participants.

5. **Task 5 Extensions**: The `interests`, `followedClubs`, and `onboardingCompleted` fields were added to support user preferences without breaking existing Task 4 functionality.