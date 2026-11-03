import { useEffect, useState } from 'react';
import {
  FiUsers, FiUserCheck, FiUserX, FiShield, FiSearch, FiTrash2,
  FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { deleteAdminUser, getAdminStats, getAdminUsers, updateAdminUser } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import './Admin.css';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadStats = () => {
    getAdminStats()
      .then((data) => setStats(data.stats))
      .catch((err) => showToast(getErrorMessage(err), 'error'));
  };

  const loadUsers = (page = 1) => {
    setLoading(true);
    getAdminUsers({ search, role: roleFilter, page })
      .then((data) => {
        setUsers(data.users);
        setPagination(data.pagination);
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleToggleActive = async (targetUser) => {
    setBusyId(targetUser.id);
    try {
      await updateAdminUser(targetUser.id, { isActive: !targetUser.isActive });
      showToast(targetUser.isActive ? 'User disabled' : 'User re-enabled');
      loadUsers(pagination.page);
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${targetUser.name}'s role to "${nextRole}"?`)) return;
    setBusyId(targetUser.id);
    try {
      await updateAdminUser(targetUser.id, { role: nextRole });
      showToast(`${targetUser.name} is now ${nextRole === 'admin' ? 'an admin' : 'a regular user'}`);
      loadUsers(pagination.page);
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Permanently delete ${targetUser.name} (${targetUser.email}) and all of their data? This can't be undone.`)) return;
    setBusyId(targetUser.id);
    try {
      await deleteAdminUser(targetUser.id);
      showToast('User deleted');
      loadUsers(pagination.page);
      loadStats();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><FiShield /> Admin — Manage Users</h1>
        <p>View, search, promote, disable, or remove user accounts.</p>
      </div>

      {stats && (
        <div className="grid grid-3 mb-24">
          <div className="card card-accent">
            <span className="stat-label"><FiUsers /> Total users</span>
            <h2 className="mt-24">{stats.totalUsers}</h2>
          </div>
          <div className="card card-accent">
            <span className="stat-label"><FiUserCheck /> Active</span>
            <h2 className="mt-24">{stats.activeUsers}</h2>
          </div>
          <div className="card card-accent">
            <span className="stat-label"><FiUserX /> Disabled</span>
            <h2 className="mt-24">{stats.disabledUsers}</h2>
          </div>
        </div>
      )}

      <div className="card">
        <form className="admin-filters" onSubmit={handleSearchSubmit}>
          <div className="admin-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); }}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">Apply</button>
        </form>

        {loading ? (
          <Loading label="Loading users…" />
        ) : users.length === 0 ? (
          <EmptyState icon={<FiUsers />} title="No users found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Mood check-ins</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isBusy = busyId === u.id;
                    return (
                      <tr key={u.id} className={!u.isActive ? 'row-disabled' : ''}>
                        <td>{u.name}{isSelf && <span className="you-tag">you</span>}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-pill ${u.role}`}>{u.role}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${u.isActive ? 'active' : 'disabled'}`}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>{u.moodCheckIns}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="admin-actions">
                          <button
                            className="icon-btn"
                            title={u.isActive ? 'Disable user' : 'Enable user'}
                            disabled={isSelf || isBusy}
                            onClick={() => handleToggleActive(u)}
                          >
                            {u.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                          </button>
                          <button
                            className="icon-btn"
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                            disabled={isSelf || isBusy}
                            onClick={() => handleToggleRole(u)}
                          >
                            {u.role === 'admin' ? <FiArrowDown /> : <FiArrowUp />}
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete user"
                            disabled={isSelf || isBusy}
                            onClick={() => handleDelete(u)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
              >
                <FiChevronLeft /> Prev
              </button>
              <span className="text-soft">Page {pagination.page} of {pagination.totalPages} · {pagination.total} users</span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadUsers(pagination.page + 1)}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
