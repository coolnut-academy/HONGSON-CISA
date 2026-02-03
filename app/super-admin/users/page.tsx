"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { Users, Search, Loader2, UserCog, Trash2, Eye, Upload, RefreshCw, UserCheck, Clock, UserPlus, Edit, CheckSquare, Square, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, writeBatch } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassSelect, GlassInput } from "@/components/ui/GlassInput";
import Link from "next/link";

interface UserData {
    id: string;
    studentId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    classRoom?: string;
    createdAt?: any;
    source: 'registered' | 'pre_registered';
}

export default function UserManagementPage() {
    const { isLoading } = useRoleProtection(['super_admin', 'admin']);
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'registered' | 'pre_registered'>('all');

    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isReadOnly = currentUser?.role === 'admin';
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [saving, setSaving] = useState(false);
    const [newUser, setNewUser] = useState({
        studentId: '',
        firstName: '',
        lastName: '',
        classRoom: ''
    });
    const [editProfile, setEditProfile] = useState({
        firstName: '',
        lastName: '',
        classRoom: '',
        studentId: ''
    });
    const [addError, setAddError] = useState("");
    const [editError, setEditError] = useState("");

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    async function fetchAllUsers() {
        setLoading(true);
        try {
            // Fetch registered users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const registeredUsers: UserData[] = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                source: 'registered' as const
            }));

            // Fetch pre-registered students
            const preRegSnapshot = await getDocs(collection(db, "pre_registered_students"));
            const preRegStudents: UserData[] = preRegSnapshot.docs.map(doc => ({
                id: doc.id,
                studentId: doc.data().studentId,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                classRoom: doc.data().classRoom,
                role: 'student',
                email: `${doc.data().studentId}@hongsoncisa.com`,
                source: 'pre_registered' as const
            }));

            // Filter out pre-registered students that already have registered accounts
            const registeredStudentIds = new Set(registeredUsers.map(u => u.studentId).filter(Boolean));
            const uniquePreReg = preRegStudents.filter(p => !registeredStudentIds.has(p.studentId));

            setUsers([...registeredUsers, ...uniquePreReg]);
        } catch (e) {
            console.error("Error fetching users:", e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(u => {
        // Tab filter
        if (activeTab === 'registered' && u.source !== 'registered') return false;
        if (activeTab === 'pre_registered' && u.source !== 'pre_registered') return false;

        // Search filter
        const query = searchQuery.toLowerCase();
        return (
            (u.firstName?.toLowerCase() || "").includes(query) ||
            (u.lastName?.toLowerCase() || "").includes(query) ||
            (u.email?.toLowerCase() || "").includes(query) ||
            (u.studentId?.toLowerCase() || "").includes(query) ||
            (u.classRoom?.toLowerCase() || "").includes(query)
        );
    });

    const registeredCount = users.filter(u => u.source === 'registered').length;
    const preRegCount = users.filter(u => u.source === 'pre_registered').length;

    // Toggle select for a user
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Select all visible users
    const selectAll = () => {
        const allIds = new Set(filteredUsers.map(u => u.id));
        setSelectedIds(allIds);
    };

    // Deselect all
    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    // Toggle select mode
    const toggleSelectMode = () => {
        if (isSelectMode) {
            setSelectedIds(new Set());
        }
        setIsSelectMode(!isSelectMode);
    };

    const handleEditRole = async () => {
        if (!selectedUser || !newRole) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", selectedUser.id), { role: newRole });
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
            setShowEditModal(false);
            setSelectedUser(null);
        } catch (e) {
            console.error("Error updating role:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleEditProfile = async () => {
        if (!selectedUser) return;

        // Validation
        if (!editProfile.firstName.trim()) {
            setEditError("กรุณากรอกชื่อ");
            return;
        }
        if (!editProfile.lastName.trim()) {
            setEditError("กรุณากรอกนามสกุล");
            return;
        }

        setSaving(true);
        setEditError("");
        try {
            const collectionName = selectedUser.source === 'registered' ? 'users' : 'pre_registered_students';
            const updateData: any = {
                firstName: editProfile.firstName.trim(),
                lastName: editProfile.lastName.trim(),
                classRoom: editProfile.classRoom.trim()
            };

            // Only update studentId for pre-registered users
            if (selectedUser.source === 'pre_registered' && editProfile.studentId !== selectedUser.studentId) {
                updateData.studentId = editProfile.studentId.trim();
            }

            await updateDoc(doc(db, collectionName, selectedUser.id), updateData);

            setUsers(users.map(u => u.id === selectedUser.id ? {
                ...u,
                ...updateData,
                email: selectedUser.source === 'pre_registered' ? `${updateData.studentId || u.studentId}@hongsoncisa.com` : u.email
            } : u));

            setShowEditProfileModal(false);
            setSelectedUser(null);
        } catch (e) {
            console.error("Error updating profile:", e);
            setEditError("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            // Delete from appropriate collection based on source
            const collectionName = selectedUser.source === 'registered' ? 'users' : 'pre_registered_students';
            await deleteDoc(doc(db, collectionName, selectedUser.id));
            setUsers(users.filter(u => u.id !== selectedUser.id));
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (e) {
            console.error("Error deleting user:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setSaving(true);
        try {
            const batch = writeBatch(db);
            const idsToDelete = Array.from(selectedIds);

            idsToDelete.forEach(id => {
                const user = users.find(u => u.id === id);
                if (user) {
                    const collectionName = user.source === 'registered' ? 'users' : 'pre_registered_students';
                    batch.delete(doc(db, collectionName, id));
                }
            });

            await batch.commit();

            setUsers(users.filter(u => !selectedIds.has(u.id)));
            setSelectedIds(new Set());
            setShowBulkDeleteModal(false);
            setIsSelectMode(false);
        } catch (e) {
            console.error("Error bulk deleting users:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleAddUser = async () => {
        // Validation
        if (!newUser.studentId.trim()) {
            setAddError("กรุณากรอกรหัสนักเรียน");
            return;
        }
        if (!newUser.firstName.trim()) {
            setAddError("กรุณากรอกชื่อ");
            return;
        }
        if (!newUser.lastName.trim()) {
            setAddError("กรุณากรอกนามสกุล");
            return;
        }

        // Check for duplicate studentId
        const existingUser = users.find(u => u.studentId === newUser.studentId.trim());
        if (existingUser) {
            setAddError("รหัสนักเรียนนี้มีอยู่ในระบบแล้ว");
            return;
        }

        setSaving(true);
        setAddError("");
        try {
            const studentId = newUser.studentId.trim();
            const userData = {
                studentId: studentId,
                firstName: newUser.firstName.trim(),
                lastName: newUser.lastName.trim(),
                classRoom: newUser.classRoom.trim(),
                createdAt: new Date(),
            };

            // Add to pre_registered_students collection
            await setDoc(doc(db, "pre_registered_students", studentId), userData);

            // Add to local state
            const newUserData: UserData = {
                id: studentId,
                ...userData,
                role: 'student',
                email: `${studentId}@hongsoncisa.com`,
                source: 'pre_registered'
            };
            setUsers([...users, newUserData]);

            // Reset form and close modal
            setNewUser({ studentId: '', firstName: '', lastName: '', classRoom: '' });
            setShowAddModal(false);
        } catch (e) {
            console.error("Error adding user:", e);
            setAddError("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    const openEditProfileModal = (user: UserData) => {
        setSelectedUser(user);
        setEditProfile({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            classRoom: user.classRoom || '',
            studentId: user.studentId || ''
        });
        setEditError("");
        setShowEditProfileModal(true);
    };

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'student':
                return <GlassBadge variant="primary">นักเรียน</GlassBadge>;
            case 'admin':
                return <GlassBadge variant="success">แอดมิน</GlassBadge>;
            case 'super_admin':
                return <GlassBadge variant="secondary">ผู้ดูแลสูงสุด</GlassBadge>;
            case 'general_user':
                return <GlassBadge variant="warning">บุคคลทั่วไป</GlassBadge>;
            default:
                return <GlassBadge>{role || '-'}</GlassBadge>;
        }
    };

    const getStatusBadge = (source: 'registered' | 'pre_registered') => {
        if (source === 'registered') {
            return (
                <GlassBadge variant="success" className="flex items-center gap-1">
                    <UserCheck size={12} />
                    เข้าใช้แล้ว
                </GlassBadge>
            );
        }
        return (
            <GlassBadge variant="warning" className="flex items-center gap-1">
                <Clock size={12} />
                รอเข้าใช้
            </GlassBadge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-secondary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <GlassCard padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-[var(--accent-secondary)]">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                                        จัดการผู้ใช้งาน
                                    </h1>
                                    {isReadOnly && (
                                        <GlassBadge variant="warning" className="flex items-center gap-1">
                                            <Eye size={12} />
                                            View Only
                                        </GlassBadge>
                                    )}
                                </div>
                                <p className="text-[var(--text-secondary)]">
                                    เข้าใช้แล้ว {registeredCount} คน • รอเข้าใช้ {preRegCount} คน
                                    {isReadOnly && " • โหมดดูอย่างเดียว"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {isSuperAdmin && (
                                <>
                                    {/* Select Mode Toggle */}
                                    <GlassButton
                                        variant={isSelectMode ? "primary" : "ghost"}
                                        icon={isSelectMode ? <CheckSquare size={16} /> : <Square size={16} />}
                                        onClick={toggleSelectMode}
                                    >
                                        {isSelectMode ? "ยกเลิกเลือก" : "เลือกหลายคน"}
                                    </GlassButton>

                                    {isSelectMode && selectedIds.size > 0 && (
                                        <GlassButton
                                            variant="danger"
                                            icon={<Trash2 size={16} />}
                                            onClick={() => setShowBulkDeleteModal(true)}
                                        >
                                            ลบ ({selectedIds.size})
                                        </GlassButton>
                                    )}

                                    <GlassButton
                                        variant="secondary"
                                        icon={<UserPlus size={16} />}
                                        onClick={() => { setShowAddModal(true); setAddError(""); }}
                                    >
                                        เพิ่มรายบุคคล
                                    </GlassButton>
                                    <Link href="/admin/students/import">
                                        <GlassButton variant="primary" icon={<Upload size={16} />}>
                                            นำเข้า CSV
                                        </GlassButton>
                                    </Link>
                                </>
                            )}
                            <GlassButton
                                variant="ghost"
                                icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
                                onClick={fetchAllUsers}
                                disabled={loading}
                            >
                                รีเฟรช
                            </GlassButton>
                        </div>
                    </div>

                    {/* Tabs and Search */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
                        <div className="flex gap-2 flex-wrap">
                            {isSelectMode && (
                                <>
                                    <button
                                        onClick={selectAll}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
                                    >
                                        เลือกทั้งหมด
                                    </button>
                                    <button
                                        onClick={deselectAll}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-solid)] transition-colors"
                                    >
                                        ยกเลิกทั้งหมด
                                    </button>
                                    <div className="w-px h-6 bg-[var(--glass-border-subtle)] mx-2" />
                                </>
                            )}
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-solid)]'
                                    }`}
                            >
                                ทั้งหมด ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('registered')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'registered'
                                        ? 'bg-[var(--accent-success)] text-white'
                                        : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-solid)]'
                                    }`}
                            >
                                <UserCheck size={14} />
                                เข้าใช้แล้ว ({registeredCount})
                            </button>
                            <button
                                onClick={() => setActiveTab('pre_registered')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pre_registered'
                                        ? 'bg-[var(--accent-warning)] text-white'
                                        : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-solid)]'
                                    }`}
                            >
                                <Clock size={14} />
                                รอเข้าใช้ ({preRegCount})
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
                            <input
                                type="text"
                                placeholder="ค้นหาผู้ใช้งาน..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-glass pl-10"
                            />
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Users Table */}
            <GlassCard padding="none" hover={false}>
                {loading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-secondary)] mx-auto mb-2" />
                        <p className="text-[var(--text-tertiary)]">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    {isSelectMode && <th className="w-12"></th>}
                                    <th>รหัส</th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>อีเมล</th>
                                    <th>บทบาท</th>
                                    <th>ห้องเรียน</th>
                                    <th>สถานะ</th>
                                    {isSuperAdmin && <th className="text-center">จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? (isSelectMode ? 9 : 8) : (isSelectMode ? 8 : 7)} className="text-center py-8 text-[var(--text-tertiary)]">
                                            {searchQuery ? "ไม่พบผู้ใช้งานที่ค้นหา" : "ไม่พบข้อมูลผู้ใช้งาน"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className={selectedIds.has(u.id) ? 'bg-[var(--accent-primary)]/10' : ''}>
                                            {isSelectMode && (
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => toggleSelect(u.id)}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                                                    >
                                                        {selectedIds.has(u.id) ? (
                                                            <CheckSquare size={18} className="text-[var(--accent-primary)]" />
                                                        ) : (
                                                            <Square size={18} className="text-[var(--text-tertiary)]" />
                                                        )}
                                                    </button>
                                                </td>
                                            )}
                                            <td className="font-medium">{u.studentId || '-'}</td>
                                            <td className="font-medium">{u.firstName || '-'} {u.lastName || ''}</td>
                                            <td className="text-[var(--text-secondary)] text-xs">{u.email || '-'}</td>
                                            <td>{getRoleBadge(u.role)}</td>
                                            <td>{u.classRoom || '-'}</td>
                                            <td>{getStatusBadge(u.source)}</td>
                                            {isSuperAdmin && (
                                                <td>
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* Edit Profile Button */}
                                                        <button
                                                            onClick={() => openEditProfileModal(u)}
                                                            className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--accent-secondary)] transition-colors"
                                                            title="แก้ไขข้อมูล"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        {/* Edit Role Button (only for registered users) */}
                                                        {u.source === 'registered' && (
                                                            <button
                                                                onClick={() => { setSelectedUser(u); setNewRole(u.role || 'student'); setShowEditModal(true); }}
                                                                className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                                                                title="แก้ไขบทบาท"
                                                            >
                                                                <UserCog size={18} />
                                                            </button>
                                                        )}
                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                                                            className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] transition-colors"
                                                            title="ลบผู้ใช้"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Edit Role Modal */}
            <GlassModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
                title="แก้ไขบทบาทผู้ใช้"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowEditModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton variant="primary" onClick={handleEditRole} loading={saving}>
                            บันทึก
                        </GlassButton>
                    </>
                }
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)]">
                            <p className="font-semibold text-[var(--text-primary)]">
                                {selectedUser.firstName} {selectedUser.lastName}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
                        </div>
                        <GlassSelect
                            label="เลือกบทบาทใหม่"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            options={[
                                { value: 'student', label: 'นักเรียน' },
                                { value: 'general_user', label: 'บุคคลทั่วไป' },
                                { value: 'admin', label: 'แอดมิน' },
                                { value: 'super_admin', label: 'ผู้ดูแลสูงสุด' },
                            ]}
                        />
                    </div>
                )}
            </GlassModal>

            {/* Edit Profile Modal */}
            <GlassModal
                isOpen={showEditProfileModal}
                onClose={() => { setShowEditProfileModal(false); setSelectedUser(null); setEditError(""); }}
                title="แก้ไขข้อมูลผู้ใช้"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowEditProfileModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton variant="primary" onClick={handleEditProfile} loading={saving}>
                            บันทึก
                        </GlassButton>
                    </>
                }
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-[var(--glass-bg)] text-sm">
                            <p className="text-[var(--text-secondary)]">
                                📧 อีเมล: <span className="text-[var(--text-primary)]">{selectedUser.email}</span>
                            </p>
                            <p className="text-[var(--text-secondary)]">
                                📋 สถานะ: {selectedUser.source === 'registered' ? 'เข้าใช้แล้ว' : 'รอเข้าใช้'}
                            </p>
                        </div>

                        {selectedUser.source === 'pre_registered' && (
                            <GlassInput
                                label="รหัสนักเรียน"
                                value={editProfile.studentId}
                                onChange={(e) => setEditProfile({ ...editProfile, studentId: e.target.value })}
                                maxLength={10}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <GlassInput
                                label="ชื่อ *"
                                placeholder="ชื่อจริง"
                                value={editProfile.firstName}
                                onChange={(e) => setEditProfile({ ...editProfile, firstName: e.target.value })}
                            />
                            <GlassInput
                                label="นามสกุล *"
                                placeholder="นามสกุล"
                                value={editProfile.lastName}
                                onChange={(e) => setEditProfile({ ...editProfile, lastName: e.target.value })}
                            />
                        </div>
                        <GlassInput
                            label="ห้องเรียน"
                            placeholder="เช่น ม.1/1"
                            value={editProfile.classRoom}
                            onChange={(e) => setEditProfile({ ...editProfile, classRoom: e.target.value })}
                        />

                        {editError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--accent-danger)] text-sm">
                                {editError}
                            </div>
                        )}
                    </div>
                )}
            </GlassModal>

            {/* Delete Confirmation Modal */}
            <GlassModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                title="ยืนยันการลบผู้ใช้"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton variant="danger" onClick={handleDeleteUser} loading={saving}>
                            ลบผู้ใช้
                        </GlassButton>
                    </>
                }
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-[var(--accent-danger)] font-medium mb-2">
                                คุณกำลังจะลบผู้ใช้งานนี้:
                            </p>
                            <p className="font-semibold text-[var(--text-primary)]">
                                {selectedUser.firstName} {selectedUser.lastName}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
                        </div>
                        <p className="text-sm text-[var(--text-tertiary)]">
                            การลบผู้ใช้จะไม่สามารถกู้คืนได้ กรุณายืนยันการดำเนินการ
                        </p>
                    </div>
                )}
            </GlassModal>

            {/* Bulk Delete Modal */}
            <GlassModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                title="ยืนยันการลบหลายคน"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowBulkDeleteModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton variant="danger" onClick={handleBulkDelete} loading={saving}>
                            ลบทั้งหมด ({selectedIds.size} คน)
                        </GlassButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-[var(--accent-danger)] font-medium mb-2">
                            คุณกำลังจะลบผู้ใช้ทั้งหมด {selectedIds.size} คน:
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {Array.from(selectedIds).map(id => {
                                const user = users.find(u => u.id === id);
                                return user ? (
                                    <p key={id} className="text-sm text-[var(--text-primary)]">
                                        • {user.firstName} {user.lastName} ({user.studentId || user.email})
                                    </p>
                                ) : null;
                            })}
                        </div>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">
                        ⚠️ การลบผู้ใช้จะไม่สามารถกู้คืนได้ กรุณายืนยันการดำเนินการ
                    </p>
                </div>
            </GlassModal>

            {/* Add User Modal */}
            <GlassModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setNewUser({ studentId: '', firstName: '', lastName: '', classRoom: '' });
                    setAddError("");
                }}
                title="เพิ่มผู้ใช้ใหม่"
                footer={
                    <>
                        <GlassButton variant="ghost" onClick={() => setShowAddModal(false)}>
                            ยกเลิก
                        </GlassButton>
                        <GlassButton variant="primary" onClick={handleAddUser} loading={saving}>
                            เพิ่มผู้ใช้
                        </GlassButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <GlassInput
                        label="รหัสนักเรียน *"
                        placeholder="เช่น 67001"
                        value={newUser.studentId}
                        onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                        maxLength={10}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                            label="ชื่อ *"
                            placeholder="ชื่อจริง"
                            value={newUser.firstName}
                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        />
                        <GlassInput
                            label="นามสกุล *"
                            placeholder="นามสกุล"
                            value={newUser.lastName}
                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        />
                    </div>
                    <GlassInput
                        label="ห้องเรียน"
                        placeholder="เช่น ม.1/1"
                        value={newUser.classRoom}
                        onChange={(e) => setNewUser({ ...newUser, classRoom: e.target.value })}
                    />

                    {addError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--accent-danger)] text-sm">
                            {addError}
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-[var(--glass-bg)] text-sm text-[var(--text-tertiary)]">
                        <p>📧 อีเมล: <span className="text-[var(--text-secondary)]">{newUser.studentId || 'xxxxx'}@hongsoncisa.com</span></p>
                        <p>🔑 รหัสผ่าน: <span className="text-[var(--text-secondary)]">hongsoncisa{newUser.studentId || 'xxxxx'}</span></p>
                    </div>
                </div>
            </GlassModal>
        </div>
    );
}
