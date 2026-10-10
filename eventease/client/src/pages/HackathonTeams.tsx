import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Tag,
  Code,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserPlus,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService, teamService, authService } from '../services/api';
import { Event, Team, User } from '../types';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '../hooks/useAuth';

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'AI/ML',
  'UI/UX Design',
  'Mobile / Flutter',
  'Cloud / DevOps',
  'Cybersecurity',
  'Blockchain',
  'FastAPI',
  'Data Science',
];

export const HackathonTeams: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('');

  // Skills editor modal / drawer
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>(user?.skills || []);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  // Create Team modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    requiredSkills: [] as string[],
    maxMembers: 4,
  });
  const [skillTagInput, setSkillTagInput] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Join Request modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [targetTeam, setTargetTeam] = useState<Team | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [isSendingJoin, setIsSendingJoin] = useState(false);

  // Load Hackathons and relevant events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents({ limit: 100 });
        const allEvents = Array.isArray(res?.data) ? res.data : [];
        // Prioritize Hackathon or Workshop categories
        const hackathons = allEvents.filter(
          (e) => e.category === 'Hackathon' || e.category === 'Workshop' || e.category === 'Technical'
        );
        const list = hackathons.length > 0 ? hackathons : allEvents;
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const fetchTeams = async (eventId: string, skill?: string) => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await teamService.getEventTeams(eventId, skill || undefined);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load teams:', err);
      setTeams([]);
      toast.error('Failed to load hackathon teams.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchTeams(selectedEventId, skillFilter);
    }
  }, [selectedEventId, skillFilter]);

  // Skills handlers
  const handleToggleUserSkill = (skill: string) => {
    if (userSkills.includes(skill)) {
      setUserSkills(userSkills.filter((s) => s !== skill));
    } else {
      setUserSkills([...userSkills, skill]);
    }
  };

  const handleAddCustomUserSkill = () => {
    if (!customSkillInput.trim()) return;
    const s = customSkillInput.trim();
    if (!userSkills.includes(s)) {
      setUserSkills([...userSkills, s]);
    }
    setCustomSkillInput('');
  };

  const handleSaveUserSkills = async () => {
    setIsSavingSkills(true);
    try {
      await teamService.updateSkills(userSkills);
      toast.success('Your skills portfolio updated!');
      setSkillsModalOpen(false);
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update skills');
    } finally {
      setIsSavingSkills(false);
    }
  };

  // Create Team handlers
  const handleToggleRequiredSkill = (skill: string) => {
    if (teamForm.requiredSkills.includes(skill)) {
      setTeamForm({
        ...teamForm,
        requiredSkills: teamForm.requiredSkills.filter((s) => s !== skill),
      });
    } else {
      setTeamForm({
        ...teamForm,
        requiredSkills: [...teamForm.requiredSkills, skill],
      });
    }
  };

  const handleAddCustomRequiredSkill = () => {
    if (!skillTagInput.trim()) return;
    const s = skillTagInput.trim();
    if (!teamForm.requiredSkills.includes(s)) {
      setTeamForm({
        ...teamForm,
        requiredSkills: [...teamForm.requiredSkills, s],
      });
    }
    setSkillTagInput('');
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Select an event first');
      return;
    }
    if (!teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsCreatingTeam(true);
    try {
      await teamService.createTeam({
        eventId: selectedEventId,
        name: teamForm.name,
        description: teamForm.description,
        requiredSkills: teamForm.requiredSkills,
        maxMembers: teamForm.maxMembers,
      });
      toast.success('Hackathon team created successfully!');
      setCreateModalOpen(false);
      setTeamForm({ name: '', description: '', requiredSkills: [], maxMembers: 4 });
      fetchTeams(selectedEventId, skillFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Join Request handlers
  const handleOpenJoinModal = (team: Team) => {
    setTargetTeam(team);
    setJoinMessage('');
    setJoinModalOpen(true);
  };

  const handleSendJoinRequest = async () => {
    if (!targetTeam) return;
    setIsSendingJoin(true);
    try {
      await teamService.sendJoinRequest(targetTeam._id, joinMessage);
      toast.success('Join request sent to team leader!', { icon: '🚀' });
      setJoinModalOpen(false);
      fetchTeams(selectedEventId, skillFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setIsSendingJoin(false);
    }
  };

  const handleRespondRequest = async (teamId: string, requestId: string, action: 'accept' | 'reject') => {
    try {
      await teamService.respondJoinRequest(teamId, requestId, action);
      toast.success(`Request ${action === 'accept' ? 'accepted' : 'rejected'}`);
      fetchTeams(selectedEventId, skillFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleLeaveOrRemoveMember = async (teamId: string, memberId?: string) => {
    try {
      await teamService.leaveOrRemoveTeam(teamId, memberId);
      toast.success(memberId ? 'Member removed from team.' : 'You have left the team.');
      fetchTeams(selectedEventId, skillFilter);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const currentUserId = user?.id || (user as any)?._id;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Collaborative Project Workspaces
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Hackathon Team Finder
          </h1>
          <p className="text-sm text-[#334155] mt-1">
            Discover squads, match complimentary tech skills, recruit teammates, and assemble hackathon crews.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* My Skills Button */}
          <button
            onClick={() => {
              setUserSkills(user?.skills || []);
              setSkillsModalOpen(true);
            }}
            className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>My Skills Portfolio ({user?.skills?.length || 0})</span>
          </button>

          {/* Event Selector */}
          <div className="w-full md:w-60">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A]"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            disabled={!selectedEventId}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Filter by skill chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#64748B] font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
          Filter Skill:
        </span>
        <button
          onClick={() => setSkillFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
            skillFilter === ''
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
          }`}
        >
          All Teams
        </button>
        {POPULAR_SKILLS.slice(0, 8).map((sk) => (
          <button
            key={sk}
            onClick={() => setSkillFilter(sk === skillFilter ? '' : sk)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
              skillFilter === sk
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            {sk}
          </button>
        ))}
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No teams formed yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Be the first to create a squad for this event and invite fellow students to join your project.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => {
            const isLeader =
              typeof team.leaderId === 'object'
                ? team.leaderId._id === currentUserId
                : team.leaderId === currentUserId;

            const isMember = team.members.some((m) =>
              typeof m.userId === 'object'
                ? m.userId._id === currentUserId
                : m.userId === currentUserId
            );

            const hasPendingRequest = team.joinRequests?.some(
              (r) =>
                (typeof r.userId === 'object' ? r.userId._id === currentUserId : r.userId === currentUserId) &&
                r.status === 'Pending'
            );

            const pendingRequests = isLeader
              ? team.joinRequests?.filter((r) => r.status === 'Pending') || []
              : [];

            return (
              <div
                key={team._id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                        team.status === 'Open'
                          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]'
                          : team.status === 'Full'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          team.status === 'Open'
                            ? 'bg-[#22C55E]'
                            : team.status === 'Full'
                            ? 'bg-[#3B82F6]'
                            : 'bg-[#EF4444]'
                        }`}
                      />
                      {team.status} ({team.members.length}/{team.maxMembers} members)
                    </span>

                    {isLeader && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                        Leader
                      </span>
                    )}

                    {!isLeader && isMember && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                        Joined
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                    {team.name}
                  </h3>

                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{team.description}</p>

                  {/* Required Skills */}
                  {team.requiredSkills.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                        Looking For:
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {team.requiredSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members Roster */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Roster:
                    </div>
                    <div className="space-y-1.5">
                      {team.members.map((m) => {
                        const mUser = typeof m.userId === 'object' ? m.userId : null;
                        const isMLeader = m.role === 'Leader';
                        return (
                          <div
                            key={mUser?._id || m.joinedAt}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]/60"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#0F172A]">
                                {mUser?.name || 'Member'}
                              </span>
                              {isMLeader && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                                  Leader
                                </span>
                              )}
                            </div>

                            {isLeader && !isMLeader && (
                              <button
                                onClick={() => handleLeaveOrRemoveMember(team._id, mUser?._id)}
                                className="text-[10px] text-[#DC2626] hover:underline font-semibold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leader: Pending Requests Notification Box */}
                  {isLeader && pendingRequests.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-xs">
                      <div className="font-bold text-[#D97706] mb-2 flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Pending Join Requests ({pendingRequests.length})</span>
                      </div>
                      <div className="space-y-2">
                        {pendingRequests.map((req) => (
                          <div
                            key={req._id}
                            className="bg-white p-2.5 rounded-lg border border-[#FEF3C7] flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#0F172A]">
                                {req.userId?.name || 'Applicant'}
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                {req.userId?.department}
                              </span>
                            </div>

                            {req.message && (
                              <p className="text-[11px] text-[#334155] italic">
                                &quot;{req.message}&quot;
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => handleRespondRequest(team._id, req._id, 'reject')}
                                className="px-2.5 py-0.5 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-[10px] font-semibold"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleRespondRequest(team._id, req._id, 'accept')}
                                className="px-2.5 py-0.5 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white text-[10px] font-semibold"
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Card Actions */}
                <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  {!isMember && !isLeader && (
                    <>
                      {hasPendingRequest ? (
                        <span className="text-xs font-semibold text-[#D97706] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Request Pending</span>
                        </span>
                      ) : team.status === 'Full' ? (
                        <span className="text-xs font-semibold text-[#64748B]">Team is Full</span>
                      ) : (
                        <button
                          onClick={() => handleOpenJoinModal(team)}
                          className="btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Request to Join</span>
                        </button>
                      )}
                    </>
                  )}

                  {isMember && !isLeader && (
                    <button
                      onClick={() => handleLeaveOrRemoveMember(team._id)}
                      className="text-xs font-semibold text-[#DC2626] hover:underline inline-flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Team</span>
                    </button>
                  )}

                  {isLeader && (
                    <span className="text-[11px] text-[#64748B]">Managing Team</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: My Skills Portfolio */}
      {skillsModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">
              My Technical Skills Portfolio
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Select or type skills you bring to hackathon teams. These are displayed to potential teammates.
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.map((sk) => {
                  const isSelected = userSkills.includes(sk);
                  return (
                    <button
                      type="button"
                      key={sk}
                      onClick={() => handleToggleUserSkill(sk)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {sk}
                    </button>
                  );
                })}
              </div>

              {/* Custom skill adder */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom skill..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomUserSkill();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <button
                  type="button"
                  onClick={handleAddCustomUserSkill}
                  className="btn-primary px-3 py-1.5 text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {/* Current selected list */}
              {userSkills.length > 0 && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Active Portfolio ({userSkills.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {userSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center gap-1"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleUserSkill(sk)}
                          className="hover:text-[#DC2626]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSkillsModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingSkills}
                  onClick={handleSaveUserSkills}
                  className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isSavingSkills ? 'Saving...' : 'Save Portfolio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Team */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-lg w-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">Create Hackathon Team</h2>
            <p className="text-xs text-[#64748B] mb-4">
              Form a squad for this event. You will be assigned as the Team Leader.
            </p>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ByteForce, Neural Ninjas, Quantum Loop"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Project Vision / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What problem are you building for? What kind of teammates do you need?"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Maximum Members (2 to 8)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={teamForm.maxMembers}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, maxMembers: parseInt(e.target.value) || 4 })
                  }
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Required Skills Wanted
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_SKILLS.slice(0, 8).map((sk) => {
                    const isSelected = teamForm.requiredSkills.includes(sk);
                    return (
                      <button
                        type="button"
                        key={sk}
                        onClick={() => handleToggleRequiredSkill(sk)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {sk}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom needed skill..."
                    value={skillTagInput}
                    onChange={(e) => setSkillTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomRequiredSkill();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRequiredSkill}
                    className="btn-primary px-3 py-1.5 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isCreatingTeam ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request to Join Team */}
      {joinModalOpen && targetTeam && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#0F172A] mb-1">
              Join {targetTeam.name}
            </h2>
            <p className="text-xs text-[#64748B] mb-4">
              Send a request to the team leader. Introduce your skills and what you want to work on.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Intro Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hi! I have 2 years experience in React and Node.js. Excited to build the frontend with you!"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendJoinRequest}
                  disabled={isSendingJoin}
                  className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isSendingJoin ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
