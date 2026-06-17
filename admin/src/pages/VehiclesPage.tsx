import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { PageHeader, Badge, Loading, Empty } from '../components/ui';

export function VehiclesPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => adminApi.vehicles() });

  return (
    <>
      <PageHeader title="Vehicles" />
      {isLoading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <Empty message="No vehicles yet." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Registration</th>
              <th>Verified</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((v) => (
              <tr key={v.id}>
                <td>{v.title}</td>
                <td>{v.type.replace('_', ' ')}</td>
                <td>{v.registrationNumber}</td>
                <td>
                  <Badge tone={v.verifiedRegistration ? 'success' : 'warning'}>
                    {v.verifiedRegistration ? 'Verified' : 'Pending'}
                  </Badge>
                </td>
                <td>{v.isAvailable ? 'Available' : 'Off'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
