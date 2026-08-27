import React, { useState, useMemo } from 'react';
import { Table } from '../components/motion/table/index';
import { AvailabilityScheduler, defaultWeek } from '../components/motion/availability-scheduler/index';
import { cn } from "@/lib/utils";

const FIRST = ["Ava", "Leo", "Mia", "Kai", "Zoe", "Eli", "Noa", "Ren", "Ivy", "Jude"];
const LAST = ["Cole", "Frost", "Vale", "Reyes", "Okafor", "Sato", "Lund", "Marsh", "Bose", "Quinn"];
const ROLES = ["Owner", "Admin", "Member", "Viewer"];
const STATUSES = ["active", "invited", "suspended"];

// Deterministic so SSR and client render the same rows (no hydration drift).
function buildPeople(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7) % LAST.length];
    out.push({
      id: String(i),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@beui.dev`,
      role: ROLES[(i * 3) % ROLES.length],
      status: STATUSES[(i * 5) % STATUSES.length],
      mrr: 12 + ((i * 37) % 488),
    });
  }
  return out;
}

const STATUS_STYLES = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  invited: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function StatusBadge({ status }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 font-medium text-xs capitalize", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

export default function ShowcaseData() {
  const data = useMemo(() => buildPeople(10_000), []);
  const [selected, setSelected] = useState([]);
  const [schedule, setSchedule] = useState(defaultWeek());

  const columns = useMemo(() => [
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "1.4fr",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    { key: "email", header: "Email", width: "1.8fr" },
    { key: "role", header: "Role", sortable: true, width: "120px" },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "mrr",
      header: "MRR",
      sortable: true,
      align: "right",
      width: "110px",
      cell: (row) => <span className="tabular-nums">${row.mrr.toLocaleString()}</span>,
    },
  ], []);

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      <header>
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Data & Tables</h1>
        <p className="text-muted-foreground">Complex data presentation and interactive scheduling components.</p>
      </header>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Interactive Data Table</h2>
        
        <div className="flex w-full justify-center">
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
              <span>{data.length.toLocaleString()} rows</span>
              {selected.length > 0 ? (
                <span>{selected.length.toLocaleString()} selected</span>
              ) : null}
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-2">
              <Table
                data={data}
                columns={columns}
                selectable
                resizable
                reorderable
                selectedRowIds={selected}
                onSelectionChange={setSelected}
                defaultSort={{ key: "mrr", direction: "desc" }}
                height={420}
                rowHeight={52}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Availability Scheduler</h2>
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 overflow-hidden">
          <AvailabilityScheduler value={schedule} onChange={setSchedule} />
        </div>
      </section>
    </div>
  );
}
