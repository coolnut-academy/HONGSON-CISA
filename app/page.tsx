"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CheckCircle2, Layout, Lock, Zap } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role
      switch (user.role as string) {
        case 'student':
          router.push('/student/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'super_admin':
        case 'superadmin': // Handle potential typo in DB
          router.push('/super-admin/dashboard');
          break;
        case 'general_user':
          router.push('/general/dashboard');
          break;
        default:
          // If role is undefined or invalid, go to unauthorized instead of login to prevent loop
          router.push('/unauthorized');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  // Landing Page for non-authenticated users
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20" />
              <span className="font-bold text-xl tracking-tight">Hongson-CISA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg shadow-blue-500/20"
              >
                เริ่มต้นใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10 opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next Gen Assessment
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            ระบบวัดและประเมินผลสมรรถนะผู้เรียน <br className="hidden md:block" /> (Hongson-CISA)
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            การประเมินสมรรถนะตามแนวทาง PISA เพื่อพัฒนาศักยภาพผู้เรียนสู่ระดับสากล วิเคราะห์ผลแม่นยำด้วย AI
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 group"
            >
              เริ่มทำแบบทดสอบ
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              ดูตัวอย่างระบบ
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">ผลตอบรับทันที (Real-time Feedback)</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                ทราบผลคะแนนและได้รับข้อเสนอแนะในการพัฒนาตนเองทันทีหลังส่งคำตอบ
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">มาตรฐาน PISA</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                ข้อสอบและเกณฑ์การวัดผลที่สอดคล้องกับมาตรฐาน PISA เพื่อเตรียมความพร้อมสู่การแข่งขันระดับโลก
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">มั่นคงปลอดภัย</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                ระบบจัดการข้อมูลที่ปลอดภัย ออกแบบมาเพื่อรองรับผู้ใช้งานจำนวนมาก
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <p>© 2026 Hongson-CISA. สงวนลิขสิทธิ์.</p>
        </div>
      </footer>
    </div>
  );
}
