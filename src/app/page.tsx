import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardCheck, FileText, ListTodo, Wallet, Lock, Users, History, Image, ArrowRight } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-6">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            TRACKY
          </h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto mb-8">
            Organiza tu familia en un solo lugar. Listas, notas y control de deudas.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-xl active:scale-[0.98] transition-transform"
          >
            Comenzar gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={<FileText className="w-6 h-6 text-violet-400" />}
            title="Notas"
            description="Guarda información con fotos adjuntas"
          />
          <FeatureCard
            icon={<ListTodo className="w-6 h-6 text-violet-400" />}
            title="Listas"
            description="Compras y tareas con checkboxes"
          />
          <FeatureCard
            icon={<Wallet className="w-6 h-6 text-violet-400" />}
            title="Deudas"
            description="Control de quién debe qué"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-6">
            Personal + Compartido
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard icon={<Lock className="w-5 h-5 text-gray-400" />} title="Privado" subtitle="Solo tú" />
            <InfoCard icon={<Users className="w-5 h-5 text-gray-400" />} title="Grupos" subtitle="Familia" />
            <InfoCard icon={<History className="w-5 h-5 text-gray-400" />} title="Historial" subtitle="Todo registrado" />
            <InfoCard icon={<Image className="w-5 h-5 text-gray-400" />} title="Fotos" subtitle="Adjuntos" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 mb-4">Gratis. Sin tarjeta.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-medium rounded-xl active:scale-[0.98] transition-transform"
        >
          Crear cuenta
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          © 2025 TRACKY
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5">
      {icon}
      <h3 className="text-lg font-semibold text-white mt-3">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </div>
  )
}

function InfoCard({ icon, title, subtitle }: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="bg-[#252525] rounded-xl p-4 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="text-white font-medium text-sm mt-2">{title}</p>
      <p className="text-gray-500 text-xs">{subtitle}</p>
    </div>
  )
}
