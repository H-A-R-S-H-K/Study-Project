import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader, Badge, Loading, Empty } from '../components/ui';
import { apiError } from '../api/client';

const TYPE_LABEL: Record<string, string> = {
  driving_license: 'Driving Licence',
  vehicle_registration: 'Vehicle Registration',
  identity: 'Identity',
};

const STATUS_TONE = { pending: 'warning', verified: 'success', rejected: 'danger' } as const;

export function DocumentsPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useQuery({
    queryKey: ['documents', status],
    queryFn: () => adminApi.documents(status || undefined),
  });

  const review = useMutation({
    mutationFn: (args: { id: string; status: 'verified' | 'rejected'; reason?: string }) =>
      adminApi.verifyDocument(args.id, args.status, args.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
    onError: (e) => alert(apiError(e)),
  });

  const reject = (id: string): void => {
    const reason = window.prompt('Reason for rejection?');
    if (reason && reason.trim()) review.mutate({ id, status: 'rejected', reason: reason.trim() });
  };

  return (
    <>
      <PageHeader title="Document Verification" />
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <Empty message="Nothing in this queue." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Submitted by</th>
              <th>Type</th>
              <th>Number</th>
              <th>File</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((d) => (
              <tr key={d.id}>
                <td>
                  {d.owner.name}
                  <div className="muted small">{d.owner.phone}</div>
                </td>
                <td>{TYPE_LABEL[d.type] ?? d.type}</td>
                <td>{d.number ?? '—'}</td>
                <td>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                </td>
                <td>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                </td>
                <td>
                  {d.status === 'pending' ? (
                    <div className="row-actions">
                      <button
                        className="btn small"
                        onClick={() => review.mutate({ id: d.id, status: 'verified' })}
                      >
                        Approve
                      </button>
                      <button className="btn small danger" onClick={() => reject(d.id)}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
