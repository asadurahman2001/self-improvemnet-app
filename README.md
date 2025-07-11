# Life Tracker - Islamic Self-Improvement App

A comprehensive self-improvement tracking application designed for Muslim students and professionals to track their daily activities, spiritual practices, and academic progress.

## Features

- **Study Tracker**: Track study sessions, subjects, and daily goals
- **Prayer Tracker**: Monitor daily prayers with Jamat/Individual tracking and Kaza prayer management
- **Quran Tracker**: Track Quran reading progress with bookmarks and goals
- **Habit Tracker**: Build good habits and overcome bad ones
- **Class Routine**: Manage class schedules and attendance
- **Sleep Tracker**: Monitor sleep patterns and quality
- **Exam Countdown**: Track upcoming exams and study preparation
- **Achievements**: Unlock achievements based on your progress
- **Dark/Light Theme**: Toggle between themes for comfortable viewing

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd life-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully set up
3. Go to Project Settings → API
4. Copy your project URL and anon key

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 5. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `database_setup.sql` and run it in the SQL editor
4. This will create all necessary tables, indexes, and security policies

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The application uses the following main tables:

- `profiles` - User profile information
- `study_sessions` - Study tracking records
- `prayer_records` - Prayer completion tracking
- `missed_prayers` - Kaza prayer management
- `quran_readings` - Quran reading progress
- `quran_bookmarks` - Saved Quran positions
- `habits` - Habit tracking
- `class_schedules` - Class routine management
- `attendance_records` - Class attendance tracking
- `sleep_records` - Sleep pattern tracking
- `exams` - Exam countdown and preparation

## Features Overview

### Prayer Tracker
- Track 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Mark prayers as Jamat (congregation) or Individual
- Automatic Kaza (missed prayer) detection and management
- Prayer streaks and statistics
- Editable prayer times

### Study Tracker
- Timer-based study sessions
- Subject-wise tracking
- Daily and weekly goals
- Progress visualization
- Session history

### Quran Tracker
- Page-based reading tracking
- Surah and verse bookmarks
- Reading goals and progress
- Monthly statistics
- Completion tracking

### Habit Tracker
- Good habit building
- Bad habit tracking
- Streak counters
- Category-based organization
- Progress visualization

### Class Management
- Weekly class schedules (Saturday-Wednesday)
- Attendance tracking
- Class-wise statistics
- Current and next class display

### Sleep Tracker
- Sleep duration and quality tracking
- Sleep goal management
- Weekly overview
- Sleep tips and recommendations

### Achievements System
- Progress-based achievements
- Different rarity levels (Common, Rare, Epic, Legendary)
- Category-specific achievements
- Achievement progress tracking

## Building for Production

```bash
npm run build
```

## Electron Desktop App

The project includes Electron configuration for creating a desktop application:

```bash
# Build the web app first
npm run build

# Package for Windows
npm run package-win
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support or questions, please open an issue in the repository.

---

**Note**: This application is designed with Islamic principles in mind, including prayer times, Quran reading, and the Islamic academic week (Saturday-Wednesday). The prayer times are set to default values but can be customized by users.