# KinetiK

KinetiK is a structured platform designed to connect volunteers with event organizers. The application leverages a graph database to provide accurate, skill-based recommendations, ensuring that volunteers are matched with projects that align with their technical expertise and professional interests.

## Architecture

* Frontend: Next.js, React, Tailwind CSS, TypeScript
* Backend: FastAPI, Python
* Database: Neo4j
* Authentication: Firebase Auth

## Features

* Role-Based Access: Dedicated interfaces and distinct workflows for Volunteers and Organizers.
* Graph-Based Recommendations: Neo4j algorithms compute match scores based on a volunteer's technical stack and the requirements of available events.
* Event Management: Organizers can reliably create events, track volunteer applications, and review applicant profiles.
* Application Tracking: Volunteers can seamlessly apply to events and view their application status. Organizers operate localized dashboards to process acceptances and rejections.
* Real-Time Analytics: Aggregated dashboards provide ongoing statistics on impact hours, pending applications, active events, and total integrated volunteers.

## Prerequisites

* Node.js (v18 or higher)
* Python (3.9 or higher)
* Neo4j Database Instance
* Firebase Project Configuration

## Local Environment Setup

### 1. Backend Setup

Navigate to the local backend directory and install the required Python packages.

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Unix: source venv/bin/activate
pip install -r requirements.txt
```

Set your Neo4j environment constants to ensure stable database bindings.

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### 2. Frontend Setup

In a new terminal, navigate to the primary project directory and install Node dependencies.

```bash
npm install
```

Create a .env.local file in the root directory to populate your Firebase access configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Initialize the Next.js development server:

```bash
npm run dev
```

The user interface will become available at http://localhost:3000.

## Project Structure

* /app: Core Next.js page routing, structural layouts, and user views.
* /backend: FastAPI server encompassing API logic, endpoints, and database drivers.
* /components: Modular React elements supporting dialog modals, core forms, and shared interface layouts.
* /lib: System contexts bridging Firebase authentication and persistent user state.
* /public: Core static directory processing application assets.
