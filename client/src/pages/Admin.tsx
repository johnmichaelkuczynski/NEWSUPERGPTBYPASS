import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const ADMIN_EMAIL = "johnmichaelkuczynski@gmail.com";

interface VisitEntry {
  id: string;
  email: string | null;
  visitedAt: string;
}

interface AdminData {
  stats: {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
    lastYear: number;
    allTime: number;
  };
  series: {
    last24Hours: { label: string; count: number }[];
    lastWeek: { label: string; count: number }[];
    lastMonth: { label: string; count: number }[];
    lastYear: { label: string; count: number }[];
    allTime: { label: string; count: number }[];
  };
  visits: VisitEntry[];
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}

function ChartSection({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number) => [v, "Logins"]}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const isAdminUser = isAuthenticated && user?.email?.toLowerCase() === ADMIN_EMAIL;

  const { data, isLoading: dataLoading, error } = useQuery<AdminData>({
    queryKey: ["/api/admin/visits"],
    enabled: isAdminUser,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Not authorized.</p>
        <button
          onClick={() => navigate("/")}
          className="text-blue-500 text-sm hover:underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administrative</h1>
            <p className="text-sm text-gray-400 mt-0.5">Google login analytics</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back to app
          </button>
        </div>

        {dataLoading && (
          <p className="text-sm text-gray-400">Loading data…</p>
        )}

        {error && (
          <p className="text-sm text-red-500">Failed to load analytics.</p>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Last 24 h" value={data.stats.last24Hours} />
              <StatCard label="Last Week" value={data.stats.lastWeek} />
              <StatCard label="Last Month" value={data.stats.lastMonth} />
              <StatCard label="Last Year" value={data.stats.lastYear} />
              <StatCard label="All Time" value={data.stats.allTime} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartSection title="Last 24 Hours (by hour)" data={data.series.last24Hours} />
              <ChartSection title="Last Week (by day)" data={data.series.lastWeek} />
              <ChartSection title="Last Month (by day)" data={data.series.lastMonth} />
              <ChartSection title="Last Year (by month)" data={data.series.lastYear} />
            </div>
            <ChartSection title="All Time" data={data.series.allTime} />

            {/* Login table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Login History
                  <span className="ml-2 text-gray-400 font-normal">({data.visits.length} most recent)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.visits.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-800">{v.email ?? "—"}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(v.visitedAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                    {data.visits.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-5 py-6 text-center text-gray-400">
                          No logins recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
