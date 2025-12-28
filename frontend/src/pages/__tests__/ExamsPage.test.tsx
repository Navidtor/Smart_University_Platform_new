import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthContext';
import { ToastProvider } from '../../components/Toast';
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
        <ToastProvider>
          <ExamsPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ExamsPage', () => {
  it('renders exam orchestration header and exam list', async () => {
    seedTeacherToken();
    renderWithProviders();
    expect(screen.getByText(/Exam Center/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Seeded Exam/i)).toBeInTheDocument();
    });
  });

  it('allows teacher to create and start an exam', async () => {
    seedTeacherToken();
    const { container } = renderWithProviders();

    const titleField = screen.getByText('Title').closest('.form-field')?.querySelector('input');
    if (!titleField) {
      throw new Error('Expected title input to be present.');
    }
    fireEvent.change(titleField, { target: { value: 'Midterm' } });
    fireEvent.change(screen.getByPlaceholderText(/Question text\.\.\./i), {
      target: { value: 'What is microservices?' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/Exam created! You can now start it\./i)).toBeInTheDocument();
      expect(screen.getByText(/Exam created!/i)).toBeInTheDocument();
    });

    const startButton = container.querySelector('.exam-card .btn-primary');
    if (!startButton) {
      throw new Error('Expected start button to be present.');
    }
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Exam is now live!/i)).toBeInTheDocument();
    });
  });

  it('allows student to load exam details and submit answers', async () => {
    seedStudentToken();
    server.use(
      http.get('http://localhost:8080/exam/exams', () => {
        return HttpResponse.json([
          {
            id: 'exam-2',
            title: 'Loaded Exam',
            description: 'Demo',
            startTime: new Date().toISOString(),
            state: 'LIVE'
          }
        ]);
      })
    );
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /Take Exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/What is microservices\?/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Your answer\.\.\./i), {
      target: { value: '42' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Exam/i }));

    await waitFor(() => {
      expect(screen.getByText(/Submitted!/i)).toBeInTheDocument();
      expect(screen.getByText(/Exam submitted!/i)).toBeInTheDocument();
    });
  });
});
