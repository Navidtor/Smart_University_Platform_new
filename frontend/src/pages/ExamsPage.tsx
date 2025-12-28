import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useConfiguredApi } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../components/Toast';

type ExamSummary = {
  id: string;
  title: string;
  description?: string;
  state: string;
  startTime: string;
  durationMinutes?: number;
  creatorId?: string;
};

type ExamDetail = {
  id: string;
  title: string;
  description?: string;
  state: string;
  startTime: string;
  durationMinutes?: number;
  questions: { id: string; text: string; sortOrder: number }[];
};

type Question = {
  text: string;
  type: 'TEXT' | 'MULTIPLE_CHOICE';
};

const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * ExamsPage component with FIXES:
 * - FIX #4: Timer useEffect uses proper dependency (timerActive state)
 * - FIX #5: handleStudentSubmit wrapped in useCallback with proper dependencies
 */
export const ExamsPage: React.FC = () => {
  const api = useConfiguredApi();
  const { role, userId } = useAuth();
  const { showToast } = useToast();

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([{ text: '', type: 'TEXT' }]);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loadedExam, setLoadedExam] = useState<ExamDetail | null>(null);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});
  const [loadingExamDetail, setLoadingExamDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  // FIX #4: Add timerActive state to control timer lifecycle
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  // Load exams list
  useEffect(() => {
    let cancelled = false;
    const loadExams = async () => {
      setExamsError(null);
      try {
        const res = await api.get<ExamSummary[]>('/exam/exams');
        if (!cancelled) setExams(res.data);
      } catch (_err) {
        if (!cancelled) setExamsError('Failed to load exams');
      } finally {
        if (!cancelled) setLoadingExams(false);
      }
    };
    loadExams();
    return () => { cancelled = true; };
  }, [api]);

  // FIX #4: Timer useEffect with proper dependency on timerActive
  useEffect(() => {
    // Only run if timer is active and there's time remaining
    if (!timerActive || timeRemaining === null || timeRemaining <= 0) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - stop the timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerActive]); // FIX #4: Only depend on timerActive, not timeRemaining

  // FIX #5: Wrap handleStudentSubmit in useCallback with proper dependencies
  const handleStudentSubmit = useCallback(async () => {
    if (!loadedExam || hasSubmitted || isSubmitting) return;
    
    setIsSubmitting(true);
    const answers: Record<string, string> = {};
    loadedExam.questions.forEach((q, idx) => { 
      answers[`q${idx + 1}`] = answersByQuestion[q.id] ?? ''; 
    });
    
    try {
      await api.post(`/exam/exams/${loadedExam.id}/submit`, { answers });
      setHasSubmitted(true);
      showToast('Exam submitted!', 'success');
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerActive(false);
      setTimeRemaining(null);
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  }, [api, loadedExam, answersByQuestion, hasSubmitted, isSubmitting, showToast]);

  // FIX #5: Auto-submit effect with proper dependencies
  useEffect(() => {
    if (timeRemaining === 0 && loadedExam && !hasSubmitted && !isSubmitting) {
      handleStudentSubmit();
      showToast('Time\u2019s up! Exam auto-submitted.', 'warning');
    }
  }, [timeRemaining, loadedExam, hasSubmitted, isSubmitting, handleStudentSubmit, showToast]);

  const addQuestion = () => setQuestions(prev => [...prev, { text: '', type: 'TEXT' }]);
  const updateQuestion = (idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
  };
  const removeQuestion = (idx: number) => {
    if (questions.length > 1) setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsCreating(true);
    const validQuestions = questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      setStatus('Add at least one question');
      setIsCreating(false);
      return;
    }
    try {
      const res = await api.post('/exam/exams', {
        title, description, startTime: new Date().toISOString(),
        durationMinutes, questions: validQuestions.map(q => ({ text: q.text }))
      });
      setCreatedExamId(res.data.id);
      setStatus('Exam created! You can now start it.');
      showToast('Exam created!', 'success');
      const listRes = await api.get<ExamSummary[]>('/exam/exams');
      setExams(listRes.data);
      setTitle(''); setDescription(''); setQuestions([{ text: '', type: 'TEXT' }]);
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to create exam');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartExam = async (examId: string) => {
    setStatus(null);
    try {
      await api.post(`/exam/exams/${examId}/start`);
      showToast('Exam is now live!', 'success');
      const listRes = await api.get<ExamSummary[]>('/exam/exams');
      setExams(listRes.data);
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to start exam');
    }
  };

  /**
   * FIX #3: Close/End exam - stops accepting submissions
   * Only teachers/admins can close their own exams
   */
  const handleEndExam = async (examId: string) => {
    setStatus(null);
    try {
      await api.post(`/exam/exams/${examId}/close`);
      showToast('Exam closed! No more submissions accepted.', 'success');
      const listRes = await api.get<ExamSummary[]>('/exam/exams');
      setExams(listRes.data);
    } catch (err: any) {
      setStatus(err.response?.data?.message ?? 'Failed to close exam');
    }
  };

  const handleLoadExam = async (examId: string) => {
    setStatus(null);
    setLoadingExamDetail(true);
    setHasSubmitted(false);
    try {
      const res = await api.get<ExamDetail>(`/exam/exams/${examId}`);
      setLoadedExam(res.data);
      setSelectedExamId(examId);
      setAnswersByQuestion({});
      
      // FIX #4: Properly initialize timer
      if (res.data.durationMinutes) {
        setTimeRemaining(res.data.durationMinutes * 60);
        setTimerActive(true); // Start the timer
      }
    } catch (err: any) {
      setLoadedExam(null);
      setStatus(err.response?.data?.message ?? 'Failed to load exam');
    } finally {
      setLoadingExamDetail(false);
    }
  };

  const handleCloseExam = () => {
    setLoadedExam(null); 
    setSelectedExamId(null); 
    setAnswersByQuestion({});
    setHasSubmitted(false);
    
    // FIX #4: Properly clean up timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
    setTimeRemaining(null);
  };

  // Students see exams that are LIVE (backend) or IN_PROGRESS (legacy naming)
  const availableExams = exams.filter(e => e.state === 'IN_PROGRESS' || e.state === 'LIVE');

  return (
    <div className="exams-page">
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><span className="title-icon">📝</span>Exam Center</div>
            <div className="card-subtitle">{isTeacherOrAdmin ? 'Create and manage exams' : 'View and take exams'}</div>
          </div>
          <div className="chip">State machine</div>
        </div>

        <h3 className="section-title">{isTeacherOrAdmin ? '📋 All Exams' : '📋 Available Exams'}</h3>
        
        {loadingExams ? (
          <div className="loading-state"><div className="spinner" /><span>Loading...</span></div>
        ) : examsError ? (
          <div className="error-state">⚠️ {examsError}</div>
        ) : (
          <>
            {isTeacherOrAdmin ? (
              exams.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">📭</span><p>No exams yet.</p></div>
              ) : (
                <div className="exam-list">
                  {exams.map(exam => (
                    <div key={exam.id} className="exam-card">
                      <div className="exam-info">
                        <span className="exam-title">{exam.title}</span>
                        <span className="exam-id">ID: {exam.id.slice(0, 8)}...</span>
                      </div>
                      <span className={`exam-state ${exam.state.toLowerCase().replace('_', '-')}`}>{exam.state}</span>
                      {/* FIX #3: Show Start button for DRAFT and SCHEDULED exams */}
                      {(exam.state === 'DRAFT' || exam.state === 'SCHEDULED') && (
                        <button className="btn-primary btn-sm" onClick={() => handleStartExam(exam.id)}>Start</button>
                      )}
                      {/* FIX #3: Show Close button for LIVE/IN_PROGRESS exams */}
                      {(exam.state === 'LIVE' || exam.state === 'IN_PROGRESS') && (
                        <button className="btn-danger btn-sm" onClick={() => handleEndExam(exam.id)}>Close</button>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              availableExams.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">📭</span><p>No exams available now.</p></div>
              ) : (
                <div className="exam-list">
                  {availableExams.map(exam => (
                    <div key={exam.id} className="exam-card student">
                      <div className="exam-info">
                        <span className="exam-title">{exam.title}</span>
                        {exam.durationMinutes && <span className="exam-duration">⏱️ {exam.durationMinutes} min</span>}
                      </div>
                      <button className="btn-primary" onClick={() => handleLoadExam(exam.id)} disabled={loadingExamDetail}>
                        {loadingExamDetail && selectedExamId === exam.id ? 'Loading...' : 'Take Exam'}
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </section>

      {isTeacherOrAdmin && (
        <section className="card">
          <div className="card-header"><div><div className="card-title">✨ Create Exam</div></div></div>
          <form onSubmit={handleCreateExam} className="create-exam-form">
            <div className="form-row">
              <div className="form-field" style={{flex:1}}>
                <label className="form-label">Title</label>
                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-field" style={{width:'120px'}}>
                <label className="form-label">Duration</label>
                <input className="form-input" type="number" min="5" value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value)||60)} />
              </div>
            </div>
            <div className="questions-section">
              <label className="form-label">Questions</label>
              {questions.map((q, idx) => (
                <div key={idx} className="question-item">
                  <span className="q-num">Q{idx+1}</span>
                  <input className="form-input" value={q.text} onChange={e => updateQuestion(idx, e.target.value)} placeholder="Question text..." />
                  {questions.length > 1 && <button type="button" className="btn-icon" onClick={() => removeQuestion(idx)}>🗑️</button>}
                </div>
              ))}
              <button type="button" className="btn-ghost btn-sm" onClick={addQuestion}>➕ Add Question</button>
            </div>
            <button type="submit" className="btn-primary" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Exam'}</button>
          </form>
        </section>
      )}

      {!isTeacherOrAdmin && loadedExam && (
        <section className="card exam-taking">
          <div className="card-header">
            <div><div className="card-title">{loadedExam.title}</div></div>
            <div className="exam-controls">
              {timeRemaining !== null && (
                <div className={`timer ${timeRemaining < 300 ? 'warning' : ''}`}>⏱️ {formatTimeRemaining(timeRemaining)}</div>
              )}
              <button className="btn-ghost btn-sm" onClick={handleCloseExam}>✕</button>
            </div>
          </div>
          {hasSubmitted ? (
            <div className="submission-success">
              <span className="success-icon">✅</span>
              <h3>Submitted!</h3>
              <p>Your answers have been recorded.</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); handleStudentSubmit(); }}>
              <div className="questions-list">
                {loadedExam.questions.sort((a,b) => a.sortOrder - b.sortOrder).map((q, idx) => (
                  <div key={q.id} className="answer-item">
                    <label className="q-label"><span className="q-num">Q{idx+1}</span> {q.text}</label>
                    <textarea className="form-input" rows={4} value={answersByQuestion[q.id] ?? ''} 
                      onChange={e => setAnswersByQuestion(prev => ({...prev, [q.id]: e.target.value}))} placeholder="Your answer..." />
                  </div>
                ))}
              </div>
              <div className="submit-section">
                <button type="submit" className="btn-primary btn-lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : '📤 Submit Exam'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {status && <div className="status-msg">{status}</div>}

      <style>{`
        .exams-page { display: flex; flex-direction: column; gap: 1.5rem; }
        .title-icon { margin-right: 0.5rem; }
        .section-title { font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem; }
        .loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 2rem; color: var(--muted); }
        .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-state { padding: 1rem; background: var(--danger-soft); border-radius: var(--radius); color: var(--danger); }
        .empty-state { text-align: center; padding: 2rem; color: var(--muted); }
        .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
        .exam-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .exam-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); }
        .exam-card.student { flex-direction: column; align-items: flex-start; }
        .exam-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .exam-title { font-weight: 600; color: var(--text); }
        .exam-id { font-size: 0.75rem; color: var(--muted); font-family: monospace; }
        .exam-duration { font-size: 0.8rem; color: var(--accent); }
        .exam-state { font-size: 0.7rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 999px; text-transform: uppercase; }
        .exam-state.draft { background: var(--warning-soft); color: var(--warning); }
        .exam-state.in-progress { background: var(--success-soft); color: var(--success); }
        .btn-sm { padding: 0.375rem 0.875rem !important; font-size: 0.8rem !important; }
        .btn-lg { padding: 0.875rem 2rem !important; font-size: 1rem !important; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 0.25rem; opacity: 0.6; }
        .btn-icon:hover { opacity: 1; }
        .create-exam-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; }
        .questions-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .question-item { display: flex; align-items: center; gap: 0.75rem; }
        .q-num { font-weight: 600; color: var(--accent); min-width: 30px; }
        .question-item .form-input { flex: 1; }
        .exam-taking { border-color: var(--accent); }
        .exam-controls { display: flex; align-items: center; gap: 1rem; }
        .timer { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; padding: 0.5rem 1rem; background: var(--bg-elevated); border-radius: var(--radius); border: 1px solid var(--border); }
        .timer.warning { color: var(--danger); background: var(--danger-soft); border-color: var(--danger); animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        .questions-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .answer-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .q-label { display: flex; gap: 0.75rem; font-size: 0.95rem; color: var(--text); }
        .submit-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center; }
        .submission-success { text-align: center; padding: 3rem 1rem; }
        .success-icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
        .submission-success h3 { margin: 0 0 0.5rem; color: var(--success); }
        .status-msg { padding: 1rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); text-align: center; }
      `}</style>
    </div>
  );
};
