import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { ExamsPage } from '../ExamsPage';

const server = setupServer(
  http.get('http://localhost:8080/exam/exams', () => {
    return HttpResponse.json([
      {
        id: 'exam-list-1',
        title: 'Seeded Exam',
        description: 'Seed',
        startTime: new Date().toISOString(),
        state: 'SCHEDULED'
      }
    ]);
  }),
  http.get('http://localhost:8080/exam/exams/exam-2', () => {
    return HttpResponse.json({
      id: 'exam-2',
      title: 'Loaded Exam',
      description: 'Demo',
      startTime: new Date().toISOString(),
      state: 'LIVE',
      questions: [
        { id: 'q-1', text: 'What is microservices?', sortOrder: 1 }
      ]
    });
  }),
  http.post('http://localhost:8080/exam/exams', () => {
    return HttpResponse.json(
      {
        id: 'exam-1',
        title: 'Midterm',
        description: 'Demo',
        startTime: new Date().toISOString(),
        state: 'SCHEDULED'
      },
      { status: 201 }
    );
  }),
  http.post('http://localhost:8080/exam/exams/exam-1/start', () => {
    return HttpResponse.json({
      id: 'exam-1',
      title: 'Midterm',
      description: 'Demo',
      startTime: new Date().toISOString(),
      state: 'LIVE'
    });
  }),
  http.post('http://localhost:8080/exam/exams/exam-2/submit', () => {
    return new HttpResponse(null, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function seedTeacherToken() {
  const payload = { sub: 'teacher-1', role: 'TEACHER', tenant: 'engineering' };
  const encoded = btoa(JSON.stringify(payload));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const token = `${header}.${encoded}.signature`;
  localStorage.setItem('sup_token', token);
  localStorage.setItem('sup_tenant', 'engineering');
}

function seedStudentToken() {
  const payload = { sub: 'student-1', role: 'STUDENT', tenant: 'engineering' };
  const encoded = btoa(JSON.stringify(payload));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const token = `${header}.${encoded}.signature`;
  localStorage.setItem('sup_token', token);
  localStorage.setItem('sup_tenant', 'engineering');
}

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ExamsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ExamsPage', () => {
  it('renders exam orchestration header and exam list', async () => {
    seedTeacherToken();
    renderWithProviders();
    expect(screen.getByText(/Exam orchestration/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Seeded Exam/i)).toBeInTheDocument();
    });
  });

  it('allows teacher to create and start an exam', async () => {
    seedTeacherToken();
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/Exam title/i), { target: { value: 'Midterm' } });
    fireEvent.change(screen.getByLabelText(/Question/i), { target: { value: 'What is microservices?' } });

    fireEvent.click(screen.getByRole('button', { name: /Create exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/Exam created. You can now start it./i)).toBeInTheDocument();
      expect(screen.getByText(/Exam ID:/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/Exam started. State: LIVE/i)).toBeInTheDocument();
    });
  });

  it('allows student to load exam details and submit answers', async () => {
    seedStudentToken();
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/Exam ID/i), { target: { value: 'exam-2' } });
    fireEvent.click(screen.getByRole('button', { name: /Load exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/Questions for Loaded Exam/i)).toBeInTheDocument();
      expect(screen.getByText(/What is microservices\?/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Answer for What is microservices\?/i), {
      target: { value: '42' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit answers/i }));

    await waitFor(() => {
      expect(screen.getByText(/Submission sent successfully/i)).toBeInTheDocument();
    });
  });
});