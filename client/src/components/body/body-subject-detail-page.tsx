import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";

type History = {
  subject: { id: string; subjectType: string; titleSnapshot: string; source: string };
  commitments: Array<{ id: string; status: string; localDate: string | null; plannedStartAt: string | null }>;
  executions: Array<{ id: string; status: string; actualStartAt: string | null; actualEndAt: string | null; source: string }>;
  reconciliations: Array<{ id: string; resolution: string; reason: string | null }>;
};
const when = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Time not recorded";

export function BodySubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const query = useQuery<History>({ queryKey: [`/api/body/subjects/${id}/history`] });
  const history = query.data;
  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 text-[#18202a] sm:p-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => history ? navigate(`/body/${history.subject.subjectType === "rest" ? "sleep" : history.subject.subjectType.startsWith("hygiene") ? "looks" : history.subject.subjectType === "intake" ? "nutrition" : "activity"}`) : window.history.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#657080]"><ArrowLeft className="h-4 w-4" />Back</button>
        {query.isPending ? <div className="h-48 animate-pulse rounded-3xl bg-white" /> : query.isError || !history ? <div className="rounded-3xl bg-white p-8">History unavailable.</div> : <>
          <header className="rounded-3xl border border-[#e4e7eb] bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#747d89]">{history.subject.subjectType.replaceAll("_", " ")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">{history.subject.titleSnapshot}</h1>
            <p className="mt-3 text-sm text-[#747d89]">Source: {history.subject.source}</p>
          </header>
          <section className="mt-5 rounded-3xl border border-[#e4e7eb] bg-white p-7">
            <h2 className="text-lg font-semibold">Complete retained history</h2>
            <div className="mt-5 space-y-3">
              {[...history.executions].sort((a, b) => (b.actualStartAt ?? "").localeCompare(a.actualStartAt ?? "")).map((item) =>
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#eef0f3] py-3 last:border-0"><div><p className="font-medium capitalize">{item.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-[#747d89]">{when(item.actualStartAt)}</p></div><span className="text-xs text-[#747d89]">{item.source}</span></div>
              )}
              {history.executions.length === 0 ? <p className="text-sm text-[#747d89]">No executions recorded yet.</p> : null}
            </div>
          </section>
          <section className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#e4e7eb] bg-white p-6"><strong className="text-2xl">{history.commitments.length}</strong><p className="mt-1 text-sm text-[#747d89]">plans retained separately</p></div>
            <div className="rounded-3xl border border-[#e4e7eb] bg-white p-6"><strong className="text-2xl">{history.reconciliations.length}</strong><p className="mt-1 text-sm text-[#747d89]">plan-to-actual links</p></div>
          </section>
        </>}
      </div>
    </main>
  );
}
