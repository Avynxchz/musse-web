import dynamic from 'next/dynamic'
import Hero from '@/components/Hero'
import AuthRedirect from '@/components/AuthRedirect'
import LoginReasons from '@/components/LoginReasons'
import Steps from '@/components/sections/Steps'
import Testimonials from '@/components/sections/Testimonials'
import { FinalCta, Footer } from '@/components/Closing'

/* Komponen berat di bawah layar: code-split via next/dynamic.
   Placeholder min-height mencegah layout shift saat chunk dimuat. */
const DemoAnimasi = dynamic(() => import('@/components/DemoAnimasi'), {
  loading: () => <div className="min-h-[560px] border-b border-[#111111]" aria-hidden="true" />,
})
const Features = dynamic(() => import('@/components/landing/features/Features'), {
  loading: () => <div className="min-h-[900px] border-b border-[#111111]" aria-hidden="true" />,
})
const Pricing = dynamic(() => import('@/components/sections/Pricing'), {
  loading: () => <div className="min-h-[600px] border-b border-[#111111]" aria-hidden="true" />,
})
const Faq = dynamic(() => import('@/components/sections/Faq'), {
  loading: () => <div className="min-h-[500px] border-b border-[#111111]" aria-hidden="true" />,
})

export const metadata = {
  title: 'musse — Latihan TKA Siap Tempur | Gratis',
  description:
    '990+ soal TKA sesuai kisi-kisi 2026, pembahasan AI langkah per langkah, analisis kelemahan otomatis. Masuk dengan Google — gratis.',
}

export default function Home() {
  return (
    <main className="min-h-dvh bg-[var(--musse-bg)] font-sans text-[var(--musse-text)] antialiased">
      <AuthRedirect />
      <Hero />
      <LoginReasons />
      <div className="cv-auto">
        <DemoAnimasi />
      </div>
      <div className="cv-auto-tall">
        <Features />
      </div>
      <div className="cv-auto">
        <Steps />
      </div>
      <div className="cv-auto">
        <Testimonials />
      </div>
      <div className="cv-auto">
        <Pricing />
      </div>
      <div className="cv-auto">
        <Faq />
      </div>
      <FinalCta />
      <Footer />
    </main>
  )
}
