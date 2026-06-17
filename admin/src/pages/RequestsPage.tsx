import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader, Badge, Loading, Empty } from '../components/ui';

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  open: 'warning',
  matched: 'neutral',
  in_progress: 'neutral',
  completed: 'success',
  cancelled: 'danger',
  expired: 'danger',
};

export function RequestsPage(): React.JSX.Element {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['requests', status],
    queryFn: () => adminApi.requests(status || undefined),
  });

  return (
    <>
      <PageHeader title="Requests" />
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="matched">Matched</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <Empty message="No requests." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Service</th>
              <th>Vehicle</th>
              <th>Offers</th>
              <th>Status</th>
              <th>Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.pickup.address} → {r.destination.address}
                </td>
                <td>{r.serviceType.replace(/_/g, ' ')}</td>
                <td>{r.vehicleType?.replace('_', ' ') ?? '—'}</td>
                <td>{r.offersCount}</td>
                <td>
                  <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge>
                </td>
                <td>{new Date(r.scheduledAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
