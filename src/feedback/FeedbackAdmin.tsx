import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bug, Lightbulb, LogOut, MessageSquare } from 'lucide-react';
import type { FeedbackAuth, FeedbackReport, FeedbackService } from './model';
import { feedbackService, useFeedbackStore } from './service';
import { feedbackAuth } from './auth';
import { fieldClass, primaryClass, secondaryClass } from './ui';

const date = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function ReportBadges({ report }: { report: FeedbackReport }) {
  const issue = report.type === 'Report an issue';
  const Icon = issue ? Bug : Lightbulb;
  return <span className="flex flex-wrap items-center gap-2">
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${issue ? 'bg-rose-50 text-rose-700' : 'bg-violet-50 text-violet-700'}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{issue ? 'Issue / Bug' : 'Suggestion'}</span>
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${report.status === 'Open' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{report.status}</span>
  </span>;
}
function ReportDetail({ report, onBack, service }: { report: FeedbackReport; onBack: () => void; service: FeedbackService }) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const changeStatus = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setError(''); setMessage('');
    const next = report.status === 'Open' ? 'Closed' : 'Open';
    try { await service.setStatus(report.reference, next); setMessage(`Marked as ${next.toLowerCase()}.`); }
    catch { setError('Status could not be saved. Please try again.'); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="space-y-6">
    <button onClick={onBack} className={secondaryClass}><ArrowLeft className="h-4 w-4" />Back to feedback</button>
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
      <div><p className="mb-2 text-xs font-medium text-slate-500">{report.adminId}</p><div className="mb-3"><ReportBadges report={report} /></div><h1 ref={heading} tabIndex={-1} className="break-words text-2xl font-semibold outline-none">{report.title}</h1><p className="mt-2 text-xs text-slate-500">{date(report.createdAt)}</p></div>
      <section><h2 className="mb-2 text-sm font-medium">Description</h2><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{report.description}</p></section>
      {report.screenshot && <section><h2 className="mb-3 text-sm font-medium">Screenshot</h2><img src={report.screenshot.dataUrl} alt="Feedback screenshot" className="max-h-[65vh] max-w-full rounded-lg border border-slate-200 object-contain" /></section>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}</div>
        <button disabled={saving} onClick={() => void changeStatus()} className={primaryClass}>{saving ? 'Saving...' : report.status === 'Open' ? 'Mark as closed' : 'Reopen'}</button>
      </div>
    </article>
  </section>;
}
export default function FeedbackAdmin({ service = feedbackService, auth = feedbackAuth }: { service?: FeedbackService; auth?: FeedbackAuth }) {
  const { reports, error } = useFeedbackStore(service);
  const [account, setAccount] = useState(() => auth.getAccount());
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [selected, setSelected] = useState<string>();
  const listHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!account) return;
    service.refresh();
    const refresh = () => service.refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, [service, account]);
  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setLoginError('');
    try { setAccount(await auth.login(loginId, password)); setPassword(''); }
    catch { setLoginError('Login ID or password is incorrect.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const detail = reports.find(r => r.reference === selected);
  return <div className="min-h-screen bg-[#F6F8FB] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-blue-600" /><span className="font-semibold">SPC Feedback</span></div>{account && <div className="flex items-center gap-3"><span className="text-sm text-slate-600">{account.name}</span><button onClick={() => { auth.logout(); setAccount(null); setSelected(undefined); }} className={secondaryClass}><LogOut className="h-4 w-4" />Log out</button></div>}</div></header>
    {!account ? <main className="mx-auto max-w-md px-5 py-12 sm:py-20"><div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-semibold">Team login</h1><form className="space-y-5" onSubmit={login} aria-busy={busy}><label className="block text-sm font-medium">Login ID<input autoComplete="username" type="text" required disabled={busy} value={loginId} onChange={e => setLoginId(e.target.value)} className={`${fieldClass} mt-2`} /></label><label className="block text-sm font-medium">Password<input autoComplete="current-password" type="password" required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className={`${fieldClass} mt-2`} /></label>{loginError && <p role="alert" className="text-sm text-red-700">{loginError}</p>}<button disabled={busy} className={`${primaryClass} w-full`}>{busy ? 'Logging in...' : 'Log in'}</button></form></div></main> : <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8">
      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<button className={secondaryClass} onClick={() => service.refresh()}>Try again</button></div>}
      {detail ? <ReportDetail service={service} report={detail} onBack={() => { setSelected(undefined); requestAnimationFrame(() => listHeading.current?.focus()); }} /> : <><h1 ref={listHeading} tabIndex={-1} className="text-2xl font-semibold outline-none">Feedback</h1><section aria-label="Feedback reports" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {reports.length ? <ul className="divide-y divide-slate-100">{reports.map(report => <li key={report.reference}><button className="block w-full px-5 py-5 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => setSelected(report.reference)}><span className="mb-1 block text-xs font-medium text-slate-500">{report.adminId}</span><span className="block break-words text-sm font-medium text-slate-900">{report.title}</span><span className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><ReportBadges report={report} /><span>{date(report.createdAt)}</span></span></button></li>)}</ul> : !error && <div className="space-y-3 px-5 py-16 text-center"><MessageSquare className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" /><h2 className="font-medium">No feedback yet</h2><p className="text-sm text-slate-500">Submitted feedback will appear here.</p></div>}
      </section></>}
    </main>}
  </div>;
}
