import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader, Badge, Loading, Empty } from '../components/ui';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  vehicle_owner: 'Vehicle Owner',
  driver: 'Driver',
};

export function UsersPage(): React.JSX.Element {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, role, status],
    queryFn: () => adminApi.users({ search, role, status }),
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'active' | 'suspended' }) =>
      adminApi.setUserStatus(id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <>
      <PageHeader title="Users" />
      <div className="filters">
        <input placeholder="Search name / phone / email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="vehicle_owner">Vehicle Owner</option>
          <option value="driver">Driver</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <Empty message="No users match." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Rating</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                <td>
                  {u.ratingSummary.count > 0
                    ? `★ ${u.ratingSummary.average.toFixed(1)} (${u.ratingSummary.count})`
                    : '—'}
                </td>
                <td>
                  <Badge tone={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                </td>
                <td>
                  {u.status === 'active' ? (
                    <button
                      className="btn small danger"
                      onClick={() => setStatusMut.mutate({ id: u.id, next: 'suspended' })}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      className="btn small"
                      onClick={() => setStatusMut.mutate({ id: u.id, next: 'active' })}
                    >
                      Reactivate
                    </button>
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
