import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/api';
import { User, UserRole, UserStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableSkeleton } from '../components/SkeletonLoader';
import { StatusBadge } from '../components/StatusBadge';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status toggle confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalTargetUser, setModalTargetUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'suspend' | 'activate' | 'role'>('suspend');
  const [newRolePending, setNewRolePending] = useState<UserRole>('student');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const handleStatusToggle = (u: User) => {
    if (u.id === currentUser?.id) {
      toast.error('You cannot suspend your own administrative account.');
      return;
    }
    setModalTargetUser(u);
    setModalAction(u.status === 'active' ? 'suspend' : 'activate');
    setConfirmModalOpen(true);
  };

  const handleRoleChangeSelect = (u: User, newRole: UserRole) => {
    if (u.id === currentUser?.id && newRole !== 'admin') {
      toast.error('You cannot demote yourself from Administrator.');
      return;
    }
    setModalTargetUser(u);
    setNewRolePending(newRole);
    setModalAction('role');
    setConfirmModalOpen(true);
  };

  const handleConfirmModal = async () => {
    if (!modalTargetUser) return;
    setIsUpdating(true);

    try {
      if (modalAction === 'role') {
        await adminService.updateRole(modalTargetUser.id, newRolePending);
        toast.success(`Role for ${modalTargetUser.name} updated to ${newRolePending}.`);
      } else {
        const nextStatus: UserStatus = modalTargetUser.status === 'active' ? 'suspended' : 'active';
        await adminService.updateStatus(modalTargetUser.id, nextStatus);
        toast.success(`Account for ${modalTargetUser.name} is now ${nextStatus}.`);
      }
      setConfirmModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          Campus Directory & Governance
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
          User Account Management
        </h1>
        <p className="text-sm text-[#334155] mt-1">
          Oversee campus user credentials, assign organizer permissions, and manage account statuses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by name, email, roll no, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
          >
            <option value="All">All Roles</option>
            <option value="student">Student</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Displaying <strong className="text-[#0F172A]">{users.length}</strong> of <strong className="text-[#0F172A]">{totalCount}</strong> users
          </span>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} />
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-[#64748B] py-14 text-center">No users matched your filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FAFC] text-[#475569] font-semibold uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3.5 px-5">User Details</th>
                  <th className="py-3.5 px-5">Department & Roll</th>
                  <th className="py-3.5 px-5">Platform Role</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors h-14">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded-full border border-[#DBEAFE]">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#64748B]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-5 text-[#334155]">
                        <p className="font-medium">{u.department || 'General'}</p>
                        <p className="text-[11px] font-mono text-[#64748B]">
                          {u.studentIdNumber || 'ID-N/A'}
                        </p>
                      </td>

                      <td className="py-3 px-5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChangeSelect(u, e.target.value as UserRole)}
                          disabled={isCurrent}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-60"
                        >
                          <option value="student">Student</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      <td className="py-3 px-5">
                        <StatusBadge status={u.status === 'active' ? 'Active' : 'Critical'} />
                      </td>

                      <td className="py-3 px-5 text-[#64748B]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-5 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleStatusToggle(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              u.status === 'active'
                                ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FEE2E2]'
                                : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#DCFCE7]'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#334155] font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title={
          modalAction === 'role'
            ? `Change Role to ${newRolePending}?`
            : modalAction === 'suspend'
            ? 'Suspend User Account?'
            : 'Activate User Account?'
        }
        message={
          modalAction === 'role'
            ? `Are you sure you want to change ${modalTargetUser?.name}'s role to ${newRolePending}? They will receive immediate permissions associated with this role.`
            : modalAction === 'suspend'
            ? `Suspending ${modalTargetUser?.name} will prevent them from signing in, booking events, or accessing ticket passes.`
            : `Re-activating ${modalTargetUser?.name} will immediately restore their account access.`
        }
        confirmText="Confirm"
        isDestructive={modalAction === 'suspend'}
        isLoading={isUpdating}
        onConfirm={handleConfirmModal}
        onClose={() => setConfirmModalOpen(false)}
      />
    </div>
  );
};
