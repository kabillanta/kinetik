# KinetiK

KinetiK is a volunteer-event matching platform that connects skilled volunteers with meaningful opportunities. Built on a graph database architecture, it delivers intelligent skill-based recommendations to ensure volunteers find projects aligned with their expertise and interests.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| Database | Neo4j (graph database) |
| Auth | Firebase Authentication |
| Email | Resend API |

## Core Features

### For Volunteers

- **Smart Recommendations**: Graph-based matching algorithm suggests events based on your skills
- **Application Management**: Apply to events, track status, and manage your applications
- **Activity History**: View past events with timestamps, export to CSV or PDF certificates
- **Analytics Dashboard**: Track impact hours, skill utilization, and community comparisons
- **Review System**: Rate and review organizers after completing events
- **Calendar Integration**: Add accepted events to Google Calendar, Outlook, or download ICS files

### For Organizers

- **Event Creation**: Create events with skill requirements, location, and volunteer capacity
- **Application Processing**: Review volunteer profiles, accept or reject applications
- **Volunteer Management**: Track accepted volunteers and event completion
- **Analytics**: View event performance, volunteer engagement, and impact metrics
- **Email Notifications**: Automatic emails for new applications and status updates

### Platform Features

- **Dual-Mode Interface**: Switch between Volunteer and Organizer modes seamlessly
- **Role-Based Access**: Secure endpoints with ownership and participation verification
- **Real-Time Notifications**: In-app notification center for application updates
- **Responsive Design**: Mobile-first design with FAB for quick actions
- **Data Caching**: SWR-based caching for optimized performance
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Prerequisites

- Node.js v18 or higher
- Python 3.9 or higher
- Neo4j Database (local or cloud instance)
- Firebase Project with Authentication enabled
- Resend API key (optional, for email notifications)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kabillanta/kinetik.git
cd kinetik
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the backend directory:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Optional: Email notifications
EMAIL_ENABLED=true
RESEND_API_KEY=your_resend_api_key
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000. View the interactive docs at http://localhost:8000/docs.

### 3. Frontend Setup

In the project root directory:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
kinetik/
├── app/                    # Next.js App Router pages
│   ├── (protected)/        # Authenticated routes
│   │   ├── dashboard/      # Volunteer dashboard
│   │   ├── organizer/      # Organizer dashboard and events
│   │   ├── applications/   # Application management
│   │   ├── analytics/      # User analytics
│   │   ├── history/        # Activity history
│   │   ├── profile/        # User profile
│   │   └── notifications/  # Notification center
│   └── (public)/           # Public routes (login, signup, landing)
├── backend/                # FastAPI backend
│   ├── routers/            # API route handlers
│   ├── services/           # Business logic (email, etc.)
│   └── tests/              # pytest test suite
├── components/             # Reusable React components
│   ├── ui/                 # UI primitives (modals, buttons, etc.)
│   └── landing/            # Landing page sections
├── lib/                    # Utilities and hooks
│   ├── hooks/              # Custom React hooks (SWR, pagination, filters)
│   └── auth-context.tsx    # Authentication context
└── types/                  # TypeScript type definitions
```

## API Endpoints

### Authentication
All protected endpoints require a Firebase ID token in the Authorization header.

### Volunteers
- `GET /api/volunteers/{user_id}/dashboard` - Dashboard stats
- `GET /api/volunteers/{user_id}/applications` - User applications
- `GET /api/volunteers/{user_id}/history` - Activity history
- `GET /api/volunteers/{user_id}/analytics` - Analytics data

### Organizers
- `GET /api/organizers/{user_id}/dashboard` - Dashboard with applications
- `GET /api/organizers/{user_id}/events` - Managed events

### Events
- `GET /api/events` - List all open events
- `POST /api/events` - Create new event
- `GET /api/events/{event_id}` - Event details
- `POST /api/events/{event_id}/apply` - Apply to event
- `POST /api/events/{event_id}/applications/{volunteer_id}/status` - Update application status
- `POST /api/events/{event_id}/complete` - Mark event as completed

### Recommendations
- `GET /api/recommendations/{user_id}` - Skill-based event recommendations

### Reviews
- `POST /api/reviews` - Create a review
- `GET /api/reviews/users/{user_id}` - User reviews
- `GET /api/reviews/users/{user_id}/stats` - Review statistics

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `uvicorn main:app --reload` - Start development server
- `pytest` - Run tests
- `ruff check .` - Run linter

## Deployment

### Frontend (Vercel)
The frontend is configured for deployment on Vercel. Push to the main branch to trigger automatic deployment.

### Backend (Google Cloud Run)
The backend includes a Dockerfile and GitHub Actions workflow for deployment to Google Cloud Run. Configure the following secrets in your repository:
- `GCP_SA_KEY` - Google Cloud service account JSON
- `GCP_PROJECT_ID` - Your GCP project ID
- `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` - Database credentials

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
