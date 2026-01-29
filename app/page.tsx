"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CheckCircle2, Layout, Lock, Zap } from "lucide-react";
import { DeveloperBadge } from "@/components/ui/DeveloperBadge";
import Image from "next/image";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-x-hidden font-sans">

      {/* Mesh Background */}
      <div className="fixed inset-0 bg-mesh z-0 pointer-events-none" />

      {/* Navigation - Glassmorphism */}
      <nav className="fixed w-full z-50 glass border-b border-white/20 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative drop-shadow-md">
                <Image
                  src="/logo_cisa.png"
                  alt="Hongson-CISA Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Hongson-CISA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/login"
                className="btn-liquid px-6 py-2.5 rounded-full text-white text-sm font-semibold tracking-wide"
              >
                เริ่มต้นใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass bg-white/40 dark:bg-slate-900/40 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-8 border border-white/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Next Gen Assessment
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 drop-shadow-sm">
            ระบบวัดและประเมินผล<br className="hidden md:block" />สมรรถนะผู้เรียน <span className="text-4xl lg:text-5xl block mt-2 font-serif italic text-blue-600/80 dark:text-blue-400/80">(Hongson-CISA)</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            การประเมินสมรรถนะตามแนวทาง PISA เพื่อพัฒนาศักยภาพผู้เรียนสู่ระดับสากล วิเคราะห์ผลแม่นยำด้วย AI
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link
              href="/login"
              className="btn-liquid w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-lg flex items-center justify-center gap-2 group"
            >
              เริ่มทำแบบทดสอบ
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full glass bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-semibold hover:bg-white/80 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-lg">
              ดูตัวอย่างระบบ
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 bg-white/60 dark:bg-slate-900/60">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-inner">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">ผลตอบรับทันที</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                ทราบผลคะแนนและได้รับข้อเสนอแนะ (Feedback) ในการพัฒนาตนเองทันทีหลังส่งคำตอบ
              </p>
            </div>

            <div className="glass-card p-8 bg-white/60 dark:bg-slate-900/60 transition-delay-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">มาตรฐาน PISA</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                ข้อสอบและเกณฑ์การวัดผลที่สอดคล้องกับมาตรฐาน PISA เพื่อเตรียมความพร้อมสู่การแข่งขันระดับโลก
              </p>
            </div>

            <div className="glass-card p-8 bg-white/60 dark:bg-slate-900/60 transition-delay-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">มั่นคงปลอดภัย</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                ระบบจัดการข้อมูลที่ปลอดภัย ออกแบบมาเพื่อรองรับผู้ใช้งานจำนวนมาก
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative py-12 glass border-t border-white/20 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <p className="mb-4 font-light">© 2026 Hongson-CISA. สงวนลิขสิทธิ์.</p>
          <DeveloperBadge />
        </div>
      </footer>
    </div>
  );
}
