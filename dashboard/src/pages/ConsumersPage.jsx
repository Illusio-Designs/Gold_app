import React, { useState, useEffect } from 'react';
import TableWithControls from '../components/common/TableWithControls';
import { SkeletonTable, SkeletonStats } from '../components/common/Skeleton';
import StatCards from '../components/common/StatCards';
import Badge from '../components/common/Badge';
import { showErrorToast } from '../utils/toast';
import { getAdminToken } from '../utils/authUtils';
import { getConsumers } from '../services/adminApiService';
import '../styles/pages/ConsumersPage.css';

// Dashboard page listing B2C consumer accounts (users.type = 'consumer').
// These are the retail shoppers from the B2C app — distinct from the B2B
// wholesale businesses shown on the Users page. Consumers can order without
// the admin-approval step, so this page is a read-only directory.
const ConsumersPage = () => {
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getAdminToken();
        const data = await getConsumers(token);
        setConsumers(Array.isArray(data) ? data : []);
      } catch (err) {
        showErrorToast(
          err?.response?.data?.error || 'Failed to load consumers'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtAddress = (row) => {
    const parts = [row.address_line1, row.address_line2, row.landmark, row.city, row.state, row.country]
      .filter((p) => p && String(p).trim());
    return parts.length ? parts.join(', ') : '—';
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
  };

  const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase() || '?';

  const columns = [
    {
      header: 'Consumer',
      accessor: 'name',
      cell: (row) => (
        <div className="au-cell">
          <span className="au-thumb" aria-hidden="true">{initialOf(row.name)}</span>
          <span className="au-stack">
            <span className="au-ono">{row.name || 'N/A'}</span>
            <Badge tone="info">B2C</Badge>
          </span>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone_number',
      cell: (row) => <span className="tnum">{row.phone_number || '—'}</span>,
    },
    {
      header: 'Email',
      accessor: 'email',
      cell: (row) => <span className="au-sub">{row.email || '—'}</span>,
    },
    {
      header: 'Shipping address',
      accessor: 'address',
      cell: (row) => <span className="au-sub">{fmtAddress(row)}</span>,
    },
    {
      header: 'Joined',
      accessor: 'created_at',
      cell: (row) => <span className="tnum au-sub">{fmtDate(row.created_at)}</span>,
    },
  ];

  const stats = [
    { label: 'Total Consumers', value: consumers.length, tone: 'brand' },
  ];

  if (loading) {
    return (
      <div className="consumers-page">
        <SkeletonStats count={1} />
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="consumers-page">
      <StatCards stats={stats} />
      <div className="au-notice" role="note">
        <span className="au-notice-ic" aria-hidden="true">i</span>
        <span>
          Consumers are B2C retail shoppers from the storefront app. They order without the
          admin-approval step, so this is a read-only directory.
        </span>
      </div>
      <TableWithControls
        columns={columns}
        data={consumers}
        searchFields={["name", "phone_number", "email", "city"]}
        pageTitle="Consumers (B2C)"
        loading={loading}
      />
    </div>
  );
};

export default ConsumersPage;
