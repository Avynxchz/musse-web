import Hero from '@/components/Hero'
import LoginReasons from '@/components/LoginReasons'
import LockedPreview from '@/components/LockedPreview'
import Features from '@/components/Features'
import Steps from '@/components/sections/Steps'
import Testimonials from '@/components/sections/Testimonials'
import Pricing from '@/components/sections/Pricing'
import Faq from '@/components/sections/Faq'
import { FinalCta, Footer } from '@/components/Closing'

export const metadata = {
  title: 'musse — Latihan TKA Siap Tempur | Gratis',
  description:
    '990+ soal TKA sesuai kisi-kisi 2026, pembahasan AI langkah per langkah, analisis kelemahan otomatis. Masuk dengan Google — gratis.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--musse-bg)] font-sans text-[var(--musse-text)] antialiased">
      <Hero />
      <LoginReasons />
      <LockedPreview />
      <Features />
      <Steps />
      <Testimonials />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  )
}
