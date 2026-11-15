// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { mockInterviews, mockCandidates, mockJobs, mockClients, mockApplications } from '../../data/mockData';
import InterviewsList from '../InterviewsList';

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    interviews: mockInterviews,
    candidates: mockCandidates,
    jobs: mockJobs,
    clients: mockClients,
    applications: mockApplications,
    submitInterviewFeedback: vi.fn(),
    rescheduleInterview: vi.fn(),
    updateInterviewStatus: vi.fn(),
    markInterviewNoShow: vi.fn(),
    cancelInterview: vi.fn(),
    updateApplicationStage: vi.fn(),
    scheduleInterview: vi.fn(),
    addMatchToPipeline: vi.fn(),
    setQuickViewJobId: vi.fn(),
  }),
}));

describe('InterviewsList Unified Filter Button & Permutation Integrity', () => {
  afterEach(() => {
    cleanup();
  });

  const renderInterviewsList = () =>
    render(
      <MemoryRouter initialEntries={['/interviews']}>
        <InterviewsList />
      </MemoryRouter>
    );

  const getFilterSelectByLabel = (labelRegex: RegExp) => {
    return screen.getByLabelText(labelRegex) as HTMLSelectElement;
  };

  it('defaults to All Interviews tab on load so all 5 interviews are immediately visible', () => {
    renderInterviewsList();

    expect(screen.getAllByText(/Showing/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sana Khan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Riya Sharma')).toBeTruthy();
    expect(screen.getByText('Pooja Saini')).toBeTruthy();
  });

  it('houses all filters inside the Filters button, highlights active filter state, and cascades Client -> Job', () => {
    renderInterviewsList();

    // Open the unified Filters popover
    const filtersBtn = screen.getByRole('button', { name: /Filters/i });
    fireEvent.click(filtersBtn);

    // Select Client c1 (NorthStar Healthcare Services) which has j1 & j2 (3 interviews: int1, int1_r2, int3)
    const clientSelect = getFilterSelectByLabel(/^Client$/i);
    fireEvent.change(clientSelect, { target: { value: 'c1' } });

    expect(screen.getAllByText(/1–3/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Client: NorthStar Healthcare Services/i)).toBeTruthy();

    // Job / Role select inside Filters only shows c1 jobs (j1, j2), not c4 jobs (j4)
    const jobSelect = getFilterSelectByLabel(/Job \/ Role/i);
    const optionValues = Array.from(jobSelect.options).map(o => o.value).filter(Boolean);
    expect(optionValues).toContain('j1');
    expect(optionValues).toContain('j2');
    expect(optionValues).not.toContain('j4');

    fireEvent.change(jobSelect, { target: { value: 'j1' } });
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Switching Client to c4 automatically clears incompatible Job j1 so flow does not dead-end
    fireEvent.change(clientSelect, { target: { value: 'c4' } });
    expect(screen.queryByText(/Job: Data Entry Operator/i)).toBeNull();
    expect(screen.getAllByText(/1–2/i).length).toBeGreaterThanOrEqual(1);
  });

  it('prevents contradictory Tab + Feedback or No-Show permutations by auto-synchronizing state', () => {
    renderInterviewsList();

    // Click No Show tab -> 1 interview (int4_noshow_can)
    const noShowTabBtn = screen.getByRole('button', { name: /No Show/i });
    fireEvent.click(noShowTabBtn);
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Open Filters popover and select No-Show Party = Candidate
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));
    const noShowPartySelect = getFilterSelectByLabel(/No-Show Party/i);
    fireEvent.change(noShowPartySelect, { target: { value: 'Candidate' } });
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Selecting Feedback Status = Received while on No Show tab auto-switches to All Interviews
    // and clears the incompatible No-Show Party filter instead of trapping user in 0 results!
    const feedbackSelect = getFilterSelectByLabel(/Feedback Status/i);
    fireEvent.change(feedbackSelect, { target: { value: 'Received' } });
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Riya Sharma')).toBeTruthy();
  });

  it('filters by multi-panelist interviewer, recruiter outcome, and supports active chip removal', () => {
    renderInterviewsList();

    // Open Filters popover
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));

    // Pooja Varma is a secondary panelist on int1 (not primary interviewerName)
    const interviewerSelect = getFilterSelectByLabel(/Interviewer \/ Panelist/i);
    fireEvent.change(interviewerSelect, { target: { value: 'Pooja Varma' } });
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);

    // Remove the Interviewer chip via its X button
    const removeInterviewerBtn = screen.getByLabelText(/Remove Interviewer: Pooja Varma filter/i);
    fireEvent.click(removeInterviewerBtn);
    expect(screen.getAllByText(/1–5/i).length).toBeGreaterThanOrEqual(1);

    // Filter by Recruiter Outcome = Pending Decision (int2 is Completed without recruiterOutcome)
    const outcomeSelect = getFilterSelectByLabel(/Recruiter Outcome/i);
    fireEvent.change(outcomeSelect, { target: { value: 'Pending Decision' } });
    expect(screen.getAllByText(/1–1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Pooja Saini')).toBeTruthy();
  });
});
