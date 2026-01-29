"use client";

import { useRoleProtection } from "@/hooks/useRoleProtection";
import { useAuth } from "@/context/AuthContext";
import { Users, Search, Loader2, UserCog, Trash2, Shield, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassSelect } from "@/components/ui/GlassInput";

export default function UserManagementPage() {
    const { isLoading } = useRoleProtection(['super_admin', 'admin']);
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isReadOnly = currentUser?.role === 'admin';
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        } catch (e) {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        return (
            (u.firstName?.toLowerCase() || "").includes(query) ||
            (u.lastName?.toLowerCase() || "").includes(query) ||
            (u.email?.toLowerCase() || "").includes(query) ||
            (u.studentId?.toLowerCase() || "").includes(query) ||
            (u.classRoom?.toLowerCase() || "").includes(query)
        );
    });

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

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await deleteDoc(doc(db, "users", selectedUser.id));
            setUsers(users.filter(u => u.id !== selectedUser.id));
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (e) {
            console.error("Error deleting user:", e);
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'student':
                return <GlassBadge variant="primary">นักเรียน</GlassBadge>;
            case 'admin':
                return <GlassBadge variant="success">แอดมิน</GlassBadge>;
            case 'super_admin':
                return <GlassBadge variant="secondary">ผู้ดูแลสูงสุด</GlassBadge>;
            default:
                return <GlassBadge>{role}</GlassBadge>;
        }
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
                
                <div className="relative z-10">
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
                                    ทั้งหมด {users.length} คน
                                    {isReadOnly && " • โหมดดูอย่างเดียว (เฉพาะ Super Admin เท่านั้นที่แก้ไขได้)"}
                                </p>
                            </div>
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
                                    <th>รหัส</th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>อีเมล</th>
                                    <th>บทบาท</th>
                                    <th>ห้องเรียน</th>
                                    {isSuperAdmin && <th className="text-center">จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-[var(--text-tertiary)]">
                                            {searchQuery ? "ไม่พบผู้ใช้งานที่ค้นหา" : "ไม่พบข้อมูลผู้ใช้งาน"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td className="font-medium">{u.studentId || '-'}</td>
                                            <td className="font-medium">{u.firstName || '-'} {u.lastName || ''}</td>
                                            <td className="text-[var(--text-secondary)]">{u.email || '-'}</td>
                                            <td>{getRoleBadge(u.role)}</td>
                                            <td>{u.classRoom || '-'}</td>
                                            {isSuperAdmin && (
                                                <td>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowEditModal(true); }}
                                                            className="p-2 rounded-lg hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                                                            title="แก้ไขบทบาท"
                                                        >
                                                            <UserCog size={18} />
                                                        </button>
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
                                { value: 'admin', label: 'แอดมิน' },
                                { value: 'super_admin', label: 'ผู้ดูแลสูงสุด' },
                            ]}
                        />
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
        </div>
    );
}
