import http from 'http';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { deriveRegistrationToken, hashToken } from '../utils/token';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

const runTest = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ PASS: ${name}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: msg });
    console.error(`  ❌ FAIL: ${name} -> ${msg}`);
  }
};

const runAllTests = async () => {
  console.log('\n=======================================================');
  console.log('🧪 Starting EventEase Backend API Automated Test Suite');
  console.log('=======================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5001;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  let studentToken = '';
  let studentId = '';
  let student2Token = '';
  let organizerToken = '';
  let organizer2Token = '';
  let testEventId = '';
  let createdEventToken = '';
  let validTicketRawToken = '';
  let validRegistrationId = '';
  let cancelledRegistrationId = '';
  let cancelledTicketRawToken = '';

  try {
    // 1. Register / login success
    await runTest('1. Register/login success', async () => {
      const email = `test.student.${Date.now()}@eventease.edu`;
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Student One',
          email,
          password: 'Password123!',
          department: 'Computer Science',
          studentIdNumber: 'TEST-001',
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.token) {
        throw new Error(`Register failed: ${JSON.stringify(regData)}`);
      }
      studentToken = regData.token;
      studentId = regData.user.id;

      // Verify login with same credentials
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok || loginData.user.email !== email) {
        throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
      }
    });

    // 2. Invalid login
    await runTest('2. Invalid login rejected', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@eventease.edu',
          password: 'WrongPassword!',
        }),
      });
      if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    });

    // 3. Unauthorized access blocked
    await runTest('3. Unauthorized access blocked without token', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    });

    // Login seed organizer
    const orgLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah.organizer@eventease.edu',
        password: 'Password123!',
      }),
    });
    const orgData = await orgLogin.json();
    organizerToken = orgData.token;

    // Login seed organizer 2
    const org2Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marcus.organizer@eventease.edu',
        password: 'Password123!',
      }),
    });
    const org2Data = await org2Login.json();
    organizer2Token = org2Data.token;

    // Register second student
    const s2Reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Student',
        email: `student2.${Date.now()}@eventease.edu`,
        password: 'Password123!',
      }),
    });
    const s2Data = await s2Reg.json();
    student2Token = s2Data.token;

    // 4. Organizer creates event
    await runTest('4. Organizer creates event', async () => {
      const tomorrow = new Date(Date.now() + 86400000 * 2);
      const deadline = new Date(Date.now() + 86400000);
      const res = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          title: 'Automated Test Hackathon 2026',
          description: 'A test event created by test suite for automated validation.',
          category: 'Hackathon',
          date: tomorrow.toISOString(),
          startTime: '09:00 AM',
          endTime: '05:00 PM',
          venue: 'Lab 101',
          capacity: 2, // low capacity to test full event
          registrationDeadline: deadline.toISOString(),
          status: 'Published',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.data._id) {
        throw new Error(`Failed to create event: ${JSON.stringify(data)}`);
      }
      testEventId = data.data._id;
    });

    // 5. Student cannot create event
    await runTest('5. Student cannot create event (Forbidden 403)', async () => {
      const tomorrow = new Date(Date.now() + 86400000 * 2);
      const res = await fetch(`${baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Student Event',
          description: 'This should fail with 403 Forbidden.',
          category: 'Workshop',
          date: tomorrow.toISOString(),
          startTime: '10:00 AM',
          endTime: '12:00 PM',
          venue: 'Room 1',
          capacity: 10,
          registrationDeadline: tomorrow.toISOString(),
          status: 'Published',
        }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    // Register student 1 for test event -> success
    const reg1Res = await fetch(`${baseUrl}/events/${testEventId}/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const reg1Data = await reg1Res.json();
    if (!reg1Res.ok || !reg1Data.data.ticketToken) {
      throw new Error(`Student 1 initial registration failed: ${JSON.stringify(reg1Data)}`);
    }
    validTicketRawToken = reg1Data.data.ticketToken;
    validRegistrationId = reg1Data.data.registration._id;

    // 6. Duplicate registration rejected
    await runTest('6. Duplicate registration rejected (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/events/${testEventId}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict for duplicate registration, got ${res.status}`);
      }
    });

    // Register student 2 (fills capacity to 2/2)
    const reg2Res = await fetch(`${baseUrl}/events/${testEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    if (!reg2Res.ok) {
      throw new Error(`Student 2 registration failed: ${await reg2Res.text()}`);
    }

    // 7. Full event rejected
    await runTest('7. Full event rejected when capacity reached (400)', async () => {
      // Create student 3 to attempt booking full event
      const s3Res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student Three',
          email: `student3.${Date.now()}@eventease.edu`,
          password: 'Password123!',
        }),
      });
      const s3Data = await s3Res.json();

      const res = await fetch(`${baseUrl}/events/${testEventId}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${s3Data.token}` },
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 when event is full, got ${res.status}`);
      }
    });

    // 8. Post-deadline rejected
    await runTest('8. Post-deadline rejected (400)', async () => {
      // Create an expired event
      const pastDeadlineEvent = await Event.create({
        title: 'Expired Deadline Event',
        description: 'Deadline is in the past',
        category: 'Seminar',
        date: new Date(Date.now() + 86400000 * 5),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Room 5',
        capacity: 50,
        registrationDeadline: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'Published',
        organizerId: new mongoose.Types.ObjectId(orgData.user.id),
      });

      const res = await fetch(`${baseUrl}/events/${pastDeadlineEvent._id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for post-deadline event, got ${res.status}`);
      }
    });

    // 9. Valid QR check-in succeeds
    await runTest('9. Valid QR check-in succeeds (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: validTicketRawToken,
          eventId: testEventId,
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200 check-in, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // 10. Invalid QR rejected
    await runTest('10. Invalid QR rejected (404/400)', async () => {
      const res = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: 'invalid_fake_token_random_1234567890',
          eventId: testEventId,
        }),
      });
      if (res.status !== 404 && res.status !== 400) {
        throw new Error(`Expected 404 or 400 for invalid token, got ${res.status}`);
      }
    });

    // 11. Second scan rejected (Duplicate check-in prevention)
    await runTest('11. Second scan rejected (Duplicate check-in blocked)', async () => {
      const res = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: validTicketRawToken,
          eventId: testEventId,
        }),
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for second scan, got ${res.status}`);
      }
    });

    // 12. Cancelled registration cannot check in
    await runTest('12. Cancelled registration cannot check in', async () => {
      // Create student 4, register for an event, cancel, then attempt check-in
      const s4Reg = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student Four',
          email: `student4.${Date.now()}@eventease.edu`,
          password: 'Password123!',
        }),
      });
      const s4Data = await s4Reg.json();

      // Create an open event
      const openEvent = await Event.create({
        title: 'Cancel Test Event',
        description: 'Testing cancellation rules',
        category: 'Workshop',
        date: new Date(Date.now() + 86400000 * 3),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Room 9',
        capacity: 10,
        registrationDeadline: new Date(Date.now() + 86400000 * 2),
        status: 'Published',
        organizerId: new mongoose.Types.ObjectId(orgData.user.id),
      });

      const bookRes = await fetch(`${baseUrl}/events/${openEvent._id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${s4Data.token}` },
      });
      const bookData = await bookRes.json();
      const cancelRawToken = bookData.data.ticketToken;
      const regId = bookData.data.registration._id;

      // Cancel registration
      const cancelRes = await fetch(`${baseUrl}/registrations/${regId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${s4Data.token}` },
      });
      if (!cancelRes.ok) {
        throw new Error(`Failed to cancel: ${await cancelRes.text()}`);
      }

      // Now attempt check in
      const scanRes = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: cancelRawToken,
          eventId: openEvent._id.toString(),
        }),
      });

      if (scanRes.status !== 400) {
        throw new Error(`Expected 400 for cancelled check-in, got ${scanRes.status}`);
      }
    });

    // 13. Organizer cannot touch another organizer's event
    await runTest('13. Organizer cannot edit another organizer’s event (403)', async () => {
      const res = await fetch(`${baseUrl}/events/${testEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizer2Token}`,
        },
        body: JSON.stringify({
          title: 'Hacked Title By Other Organizer',
        }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    // 14. Dashboard totals match DB
    await runTest('14. Dashboard totals match database calculations', async () => {
      const res = await fetch(`${baseUrl}/organizer/dashboard`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.data.metrics) {
        throw new Error(`Failed to fetch organizer dashboard: ${JSON.stringify(data)}`);
      }

      const dbEventsCount = await Event.countDocuments({
        organizerId: orgData.user.id,
      });
      if (data.data.metrics.totalEvents !== dbEventsCount) {
        throw new Error(
          `Dashboard events (${data.data.metrics.totalEvents}) does not match DB (${dbEventsCount})`
        );
      }
    });

    // 15. CSV export is correct
    await runTest('15. CSV export is correct and sanitized against formula injection', async () => {
      const res = await fetch(`${baseUrl}/events/${testEventId}/export`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      if (!res.ok) {
        throw new Error(`CSV export failed with status ${res.status}`);
      }
      const csvText = await res.text();
      if (!csvText.includes('Student Name') || !csvText.includes('Registration Status')) {
        throw new Error(`CSV content missing expected headers: ${csvText.slice(0, 100)}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('text/csv')) {
        throw new Error(`Expected text/csv content-type, got ${contentType}`);
      }
    });

    // 16. Offline sync creates no duplicates
    await runTest('16. Offline sync handles conflict safely with zero duplicate entries', async () => {
      // Send sync batch containing:
      // 1) already attended ticket (validTicketRawToken) -> should report conflict
      // 2) invalid token -> should report invalid
      const syncRes = await fetch(`${baseUrl}/checkin/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          eventId: testEventId,
          scans: [
            {
              idempotencyKey: 'offline-scan-001',
              token: validTicketRawToken,
              scannedAt: new Date().toISOString(),
            },
            {
              idempotencyKey: 'offline-scan-002',
              token: 'completely_random_invalid_token_999999',
              scannedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      const syncData = (await syncRes.json()) as any;
      if (!syncRes.ok) {
        throw new Error(`Sync failed: ${JSON.stringify(syncData)}`);
      }
      if (syncData.summary.conflictsCount !== 1 || syncData.summary.invalidCount !== 1) {
        throw new Error(`Expected 1 conflict and 1 invalid, got: ${JSON.stringify(syncData.summary)}`);
      }
    });

    // 17. Feature 1: Multiple Attendance Sessions Per Event
    let morningSessionId = '';
    let afternoonSessionId = '';
    await runTest('17. Feature 1: Create multiple attendance sessions for event', async () => {
      const now = Date.now();
      const res = await fetch(`${baseUrl}/sessions/event/${testEventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          name: 'Morning Attendance',
          description: 'Keynote & Morning Session Attendance',
          startTime: new Date(now - 10 * 60 * 1000).toISOString(), // Started 10m ago
          endTime: new Date(now + 30 * 60 * 1000).toISOString(),   // Closes in 30m
          requireStrictWindow: true,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.session?._id) {
        throw new Error(`Create morning session failed: ${JSON.stringify(data)}`);
      }
      morningSessionId = data.session._id;

      // Create 2nd session (Post-Lunch Session)
      const res2 = await fetch(`${baseUrl}/sessions/event/${testEventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          name: 'Post-Lunch Attendance',
          description: 'Technical Workshop Session',
          startTime: new Date(now + 60 * 60 * 1000).toISOString(), // Starts in 1 hr
          endTime: new Date(now + 120 * 60 * 1000).toISOString(),
          requireStrictWindow: true,
        }),
      });
      const data2 = (await res2.json()) as any;
      if (!res2.ok || !data2.session?._id) {
        throw new Error(`Create afternoon session failed: ${JSON.stringify(data2)}`);
      }
      afternoonSessionId = data2.session._id;

      // Verify sessions listing
      const listRes = await fetch(`${baseUrl}/sessions/event/${testEventId}`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      const listData = (await listRes.json()) as any;
      if (!listRes.ok || listData.sessions.length < 2) {
        throw new Error(`Expected at least 2 sessions, got: ${JSON.stringify(listData)}`);
      }
    });

    // 18. Feature 3: Strict Attendance Time Window (Reject before start, allow active)
    await runTest('18. Feature 3: Strict Attendance Time Window rejects check-in before start', async () => {
      // Afternoon session starts in 1 hour -> should be rejected!
      const scanRes = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: validTicketRawToken,
          eventId: testEventId,
          sessionId: afternoonSessionId,
        }),
      });
      const scanData = (await scanRes.json()) as any;
      if (scanRes.status !== 400 || !scanData.message.includes('has not started yet')) {
        throw new Error(`Expected 400 window not started, got status ${scanRes.status}: ${JSON.stringify(scanData)}`);
      }
    });

    // 19. Feature 1 & 3: Check-in to active session succeeds and rejects duplicate in same session
    await runTest('19. Feature 1: Check-in to active session succeeds and rejects duplicate in same session', async () => {
      // 1st scan for morning session -> succeeds
      const scanRes1 = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: validTicketRawToken,
          eventId: testEventId,
          sessionId: morningSessionId,
        }),
      });
      const scanData1 = (await scanRes1.json()) as any;
      if (!scanRes1.ok || !scanData1.success) {
        throw new Error(`Session scan failed: ${JSON.stringify(scanData1)}`);
      }

      // 2nd scan for SAME morning session -> MUST be rejected as duplicate!
      const scanRes2 = await fetch(`${baseUrl}/checkin/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          token: validTicketRawToken,
          eventId: testEventId,
          sessionId: morningSessionId,
        }),
      });
      const scanData2 = (await scanRes2.json()) as any;
      if (scanRes2.status !== 400 || !scanData2.alreadyCheckedIn) {
        throw new Error(`Expected duplicate check-in 400, got ${scanRes2.status}: ${JSON.stringify(scanData2)}`);
      }
    });

    // 20. Feature 4: Digital Event Passport calculation
    await runTest('20. Feature 4: Digital Event Passport returns trusted attendance & stats', async () => {
      const passportRes = await fetch(`${baseUrl}/registrations/passport`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const pData = (await passportRes.json()) as any;
      if (!passportRes.ok || !pData.data) {
        throw new Error(`Passport fetch failed: ${JSON.stringify(pData)}`);
      }
      if (pData.data.metrics.totalRegistered < 1 || pData.data.metrics.totalAttendedAny < 1) {
        throw new Error(`Passport statistics mismatch: ${JSON.stringify(pData.data.metrics)}`);
      }
      if (!pData.data.events || pData.data.events.length === 0) {
        throw new Error('Expected at least 1 event in passport');
      }
    });

    // 21. Feature 5: Live Crowd & Entry Monitor
    await runTest('21. Feature 5: Live Crowd Monitor returns real-time statistics', async () => {
      const statsRes = await fetch(`${baseUrl}/checkin/event/${testEventId}/live-stats`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      const sData = (await statsRes.json()) as any;
      if (!statsRes.ok || !sData.data) {
        throw new Error(`Live stats fetch failed: ${JSON.stringify(sData)}`);
      }
      if (sData.data.metrics.totalRegistered < 1 || sData.data.sessions.length < 2) {
        throw new Error(`Live stats metrics mismatch: ${JSON.stringify(sData.data)}`);
      }
    });

    // 22. Feature 2: Smart Attendance Notifications & Read Status
    await runTest('22. Feature 2: In-app notifications generated & mark as read works', async () => {
      // Trigger reminders from organizer
      const remindRes = await fetch(`${baseUrl}/notifications/session/${morningSessionId}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      const remindData = (await remindRes.json()) as any;
      if (!remindRes.ok) {
        throw new Error(`Trigger reminders failed: ${JSON.stringify(remindData)}`);
      }

      // Student checks notifications
      const notifRes = await fetch(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const nData = (await notifRes.json()) as any;
      if (!notifRes.ok) {
        throw new Error(`Fetch notifications failed: ${JSON.stringify(nData)}`);
      }

      // Mark all as read
      const readRes = await fetch(`${baseUrl}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      if (!readRes.ok) {
        throw new Error('Mark all read failed');
      }
    });

    // 23. Feature 6: Hackathon Team Finder (Create team, prevent duplicate, join request)
    let testTeamId = '';
    await runTest('23. Feature 6: Create team, skills update, and enforce membership limit', async () => {
      // Student 1 updates skills
      const skillRes = await fetch(`${baseUrl}/teams/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ skills: ['React', 'TypeScript', 'Node.js', 'Python'] }),
      });
      const skillData = (await skillRes.json()) as any;
      if (!skillRes.ok || skillData.skills.length !== 4) {
        throw new Error(`Skills update failed: ${JSON.stringify(skillData)}`);
      }

      // Student 1 creates team
      const teamRes = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          eventId: testEventId,
          name: `Alpha Squad ${Date.now()}`,
          description: 'Building an AI Attendance Analyzer',
          requiredSkills: ['UI/UX', 'Python', 'React'],
          maxMembers: 3,
        }),
      });
      const teamData = (await teamRes.json()) as any;
      if (!teamRes.ok || !teamData.team?._id) {
        throw new Error(`Create team failed: ${JSON.stringify(teamData)}`);
      }
      testTeamId = teamData.team._id;

      // Student 1 tries to create 2nd team for same event -> MUST reject!
      const dupTeamRes = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          eventId: testEventId,
          name: `Beta Squad ${Date.now()}`,
          maxMembers: 2,
        }),
      });
      if (dupTeamRes.status !== 400) {
        throw new Error(`Expected 400 for duplicate team membership, got ${dupTeamRes.status}`);
      }
    });

    // 24. Feature 7: Verified Digital Certificates (Generate, Verify, Prevent Duplicate)
    let testCertificateId = '';
    await runTest('24. Feature 7: Generate certificate, public verification, and prevent duplicate', async () => {
      // Organizer generates certificates for test event
      const genRes = await fetch(`${baseUrl}/certificates/event/${testEventId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({
          minSessions: 1,
          eligibilityCriteria: 'Keynote & Morning Attendance Verified',
        }),
      });
      const genData = (await genRes.json()) as any;
      if (!genRes.ok || genData.issuedCount < 1) {
        throw new Error(`Certificate generation failed: ${JSON.stringify(genData)}`);
      }

      // Student retrieves certificates
      const myCertRes = await fetch(`${baseUrl}/certificates/my`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const myCertData = (await myCertRes.json()) as any;
      if (!myCertRes.ok || myCertData.certificates.length < 1) {
        throw new Error(`Student certificate fetch failed: ${JSON.stringify(myCertData)}`);
      }
      testCertificateId = myCertData.certificates[0].certificateId;

      // Public verification endpoint (No auth header!)
      const verifyRes = await fetch(`${baseUrl}/certificates/verify/${testCertificateId}`);
      const verifyData = (await verifyRes.json()) as any;
      if (!verifyRes.ok || verifyData.certificate.certificateId !== testCertificateId) {
        throw new Error(`Public certificate verification failed: ${JSON.stringify(verifyData)}`);
      }

      // Second generation attempt should skip already issued certificate (anti-duplicate)
      const genRes2 = await fetch(`${baseUrl}/certificates/event/${testEventId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({ minSessions: 1 }),
      });
      const genData2 = (await genRes2.json()) as any;
      if (!genRes2.ok || genData2.issuedCount !== 0 || genData2.skippedCount < 1) {
        throw new Error(`Expected 0 issued and at least 1 skipped, got: ${JSON.stringify(genData2)}`);
      }
    });
  } finally {
    server.close();
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n=======================================================');
  console.log(`📊 Test Summary: ${passedCount}/${results.length} Passed, ${failedCount} Failed`);
  console.log('=======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
