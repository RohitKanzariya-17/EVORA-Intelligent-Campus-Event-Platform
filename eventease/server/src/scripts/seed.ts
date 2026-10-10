import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Feedback } from '../models/Feedback';
import { deriveRegistrationToken, hashToken } from '../utils/token';
import { config } from '../config/env';

const seedDatabase = async () => {
  if (config.NODE_ENV === 'production') {
    console.error('❌ SEEDING BLOCKED: Seeding is strictly forbidden in production environments.');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('[Seed] Connected to database:', config.MONGODB_URI);

    // Clean existing seed collections
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
      Feedback.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing records.');

    const defaultPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 1. Create Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@eventease.edu',
      passwordHash,
      role: 'admin',
      status: 'active',
      department: 'Central Administration',
      studentIdNumber: 'ADM-001',
    });

    const organizer1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.organizer@eventease.edu',
      passwordHash,
      role: 'organizer',
      status: 'active',
      department: 'Computer Science & Engineering',
      studentIdNumber: 'FAC-CS-01',
    });

    const organizer2 = await User.create({
      name: 'Prof. Marcus Chen',
      email: 'marcus.organizer@eventease.edu',
      passwordHash,
      role: 'organizer',
      status: 'active',
      department: 'Electronics & Media Arts',
      studentIdNumber: 'FAC-EC-02',
    });

    const student1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex.student@eventease.edu',
      passwordHash,
      role: 'student',
      status: 'active',
      department: 'Computer Science',
      studentIdNumber: 'CS2026-101',
    });

    const student2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya.student@eventease.edu',
      passwordHash,
      role: 'student',
      status: 'active',
      department: 'Information Technology',
      studentIdNumber: 'IT2026-204',
    });

    const student3 = await User.create({
      name: 'Jordan Lee',
      email: 'jordan.student@eventease.edu',
      passwordHash,
      role: 'student',
      status: 'active',
      department: 'Data Science',
      studentIdNumber: 'DS2026-309',
    });

    const student4 = await User.create({
      name: 'Emily Watson',
      email: 'emily.student@eventease.edu',
      passwordHash,
      role: 'student',
      status: 'active',
      department: 'Electrical Engineering',
      studentIdNumber: 'EE2026-412',
    });

    console.log('[Seed] Created users (1 Admin, 2 Organizers, 4 Students).');

    // 2. Create Fictional Events
    const now = new Date();

    const addDays = (d: Date, days: number): Date => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy;
    };

    const eventsData = [
      {
        title: 'Code Carnival Hackathon',
        description:
          'The flagship 36-hour annual hackathon of the institute! Build cutting-edge products, solve real-world problems across AI, Web3, and EdTech, and compete for $10,000+ in grand prizes. Mentors, meals, and midnight snacks provided.',
        category: 'Hackathon' as const,
        coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, 5),
        startTime: '09:00 AM',
        endTime: '09:00 PM',
        venue: 'Main Auditorium & Innovation Lab',
        capacity: 150,
        registrationDeadline: addDays(now, 3),
        status: 'Published' as const,
        organizerId: organizer1._id,
      },
      {
        title: 'AI & ML Workshop',
        description:
          'Hands-on masterclass covering Deep Learning, Transformer models, and real-world deployment with PyTorch and HuggingFace. Bring your laptops. Certificates will be awarded upon project completion.',
        category: 'Workshop' as const,
        coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, 2),
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Turing Computer Lab (Block C)',
        capacity: 60,
        registrationDeadline: addDays(now, 1),
        status: 'Published' as const,
        organizerId: organizer1._id,
      },
      {
        title: 'Web Development Bootcamp',
        description:
          'From zero to full-stack: Master React 19, TypeScript, Node.js, and modern cloud deployment pipelines. Interactive coding challenges and paired reviews led by industry engineers.',
        category: 'Technical' as const,
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, 8),
        startTime: '02:00 PM',
        endTime: '06:30 PM',
        venue: 'Seminar Hall B',
        capacity: 80,
        registrationDeadline: addDays(now, 6),
        status: 'Published' as const,
        organizerId: organizer1._id,
      },
      {
        title: 'Cybersecurity Awareness Seminar',
        description:
          'Explore modern threat intelligence, ethical hacking methodologies, social engineering defenses, and network perimeter protection with keynote speakers from top cybersecurity firms.',
        category: 'Seminar' as const,
        coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, 12),
        startTime: '11:00 AM',
        endTime: '01:30 PM',
        venue: 'Kalam Audio-Visual Center',
        capacity: 120,
        registrationDeadline: addDays(now, 10),
        status: 'Published' as const,
        organizerId: organizer2._id,
      },
      {
        title: 'College Cultural Festival',
        description:
          'The biggest celebration of arts, music, dance, and theater! Experience live battle-of-the-bands, street plays, art galleries, and food trucks across the entire campus quad.',
        category: 'Cultural' as const,
        coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, 20),
        startTime: '04:00 PM',
        endTime: '10:00 PM',
        venue: 'Open Air Amphitheatre',
        capacity: 500,
        registrationDeadline: addDays(now, 18),
        status: 'Published' as const,
        organizerId: organizer2._id,
      },
      {
        title: 'Data Analytics Workshop',
        description:
          'Practical workshop on exploratory data analysis, predictive modeling, and interactive storytelling with Power BI and Python. Learn how to transform messy datasets into strategic decisions.',
        category: 'Workshop' as const,
        coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        date: addDays(now, -3), // Past event for attendance testing
        startTime: '01:00 PM',
        endTime: '05:00 PM',
        venue: 'Data Science Lab 4',
        capacity: 45,
        registrationDeadline: addDays(now, -4),
        status: 'Completed' as const,
        organizerId: organizer1._id,
      },
    ];

    const createdEvents = await Event.create(eventsData);
    console.log(`[Seed] Created ${createdEvents.length} events.`);

    // 3. Create Sample Registrations and Check-Ins
    const [hackathon, aiWorkshop, webBootcamp, _cyberSeminar, _culturalFest, dataWorkshop] =
      createdEvents;

    const registrationsToCreate = [
      // Hackathon: student1 (Registered), student2 (Registered), student3 (Registered)
      { student: student1, event: hackathon, status: 'Registered' as const },
      { student: student2, event: hackathon, status: 'Registered' as const },
      { student: student3, event: hackathon, status: 'Registered' as const },

      // AI Workshop: student1 (Attended), student2 (Registered), student4 (Registered)
      {
        student: student1,
        event: aiWorkshop,
        status: 'Attended' as const,
        checkedInAt: new Date(Date.now() - 3600000 * 2),
        checkedInBy: organizer1._id,
      },
      { student: student2, event: aiWorkshop, status: 'Registered' as const },
      { student: student4, event: aiWorkshop, status: 'Registered' as const },

      // Web Bootcamp: student3 (Registered)
      { student: student3, event: webBootcamp, status: 'Registered' as const },

      // Data Analytics Workshop (Completed past event): student1 & student2 attended
      {
        student: student1,
        event: dataWorkshop,
        status: 'Attended' as const,
        checkedInAt: new Date(Date.now() - 3600000 * 48),
        checkedInBy: organizer1._id,
      },
      {
        student: student2,
        event: dataWorkshop,
        status: 'Attended' as const,
        checkedInAt: new Date(Date.now() - 3600000 * 47),
        checkedInBy: organizer1._id,
      },
    ];

    for (const item of registrationsToCreate) {
      const regId = new mongoose.Types.ObjectId();
      const regTime = new Date(Date.now() - 86400000 * 2);
      const rawToken = deriveRegistrationToken(
        regId.toString(),
        item.student._id.toString(),
        regTime
      );
      const tokenHash = hashToken(rawToken);

      await Registration.create({
        _id: regId,
        studentId: item.student._id,
        eventId: item.event._id,
        tokenHash,
        registrationStatus: item.status,
        registeredAt: regTime,
        checkedInAt: item.checkedInAt || null,
        checkedInBy: item.checkedInBy || null,
      });

      // Update event registeredCount
      await Event.findByIdAndUpdate(item.event._id, { $inc: { registeredCount: 1 } });
    }

    console.log('[Seed] Created realistic registrations and attendance records.');

    // 4. Create sample feedback for attended event
    await Feedback.create({
      studentId: student1._id,
      eventId: dataWorkshop._id,
      rating: 5,
      comment: 'Fantastic hands-on exercises! The instructor explained complex statistical distributions clearly.',
    });

    await Feedback.create({
      studentId: student2._id,
      eventId: dataWorkshop._id,
      rating: 4,
      comment: 'Great pace and relevant examples. Would love an advanced follow-up session on time-series forecasting.',
    });

    console.log('[Seed] Created sample feedback.');

    console.log(`=======================================================`);
    console.log(`🎉 Database Seeding Complete!`);
    console.log(`   Sample Credentials (Password for all: ${defaultPassword}):`);
    console.log(`   - Admin:     ${admin.email}`);
    console.log(`   - Organizer: ${organizer1.email}`);
    console.log(`   - Organizer: ${organizer2.email}`);
    console.log(`   - Student:   ${student1.email}`);
    console.log(`   - Student:   ${student2.email}`);
    console.log(`   - Student:   ${student3.email}`);
    console.log(`=======================================================`);
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
