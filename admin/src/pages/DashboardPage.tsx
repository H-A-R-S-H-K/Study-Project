import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader, StatCard, Loading } from '../components/ui';

export function DashboardPage(): React.JSX.Element {
  const { data: stats, isLoading } = useQuery({ queryKey: ['stats'], queryFn: adminApi.stats });

  return (
    <>
      <PageHeader title="Dashboard" />
      {isLoading || !stats ? (
        <Loading />
      ) : (
        <>
          <section className="stat-grid">
            <StatCard label="Total users" value={stats.users.total} />
            <StatCard label="Customers" value={stats.users.customers} />
            <StatCard label="Vehicle owners" value={stats.users.vehicleOwners} />
            <StatCard label="Drivers" value={stats.users.drivers} />
            <StatCard label="Suspended" value={stats.users.suspended} />
            <StatCard label="Pending documents" value={stats.documents.pending} hint="Needs review" />
          </section>

          <h2 className="section-title">Requests</h2>
          <section className="stat-grid">
            <StatCard label="Total" value={stats.requests.total} />
            <StatCard label="Open" value={stats.requests.open} />
            <StatCard label="Matched" value={stats.requests.matched} />
            <StatCard label="Completed" value={stats.requests.completed} />
            <StatCard label="Cancelled" value={stats.requests.cancelled} />
            <StatCard label="Offers" value={stats.offers.total} />
          </section>
        </>
      )}
    </>
  );
}
