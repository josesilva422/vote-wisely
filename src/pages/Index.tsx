import { Card } from "@/components/ui/card";
import { CheckCircle2, CalendarX } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00223B] via-[#003355] to-[#0a1628] px-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />

      <Card className="max-w-lg w-full p-10 text-center space-y-6 bg-white/10 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl relative z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-full p-4 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <img
              src="/conecta-logo.png"
              alt="Conecta"
              className="w-20 h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] brightness-110"
            />
          </div>
        </div>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center">
          <CalendarX className="h-8 w-8 text-sky-400" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Votação Encerrada
          </h1>
          <p className="text-white/60 text-lg">
            O período de votação foi finalizado
          </p>
        </div>

        {/* Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent mx-auto" />

        {/* Thank you message */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sky-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Obrigado pela sua participação!</span>
          </div>
          <p className="text-white/50">
            Agradecemos a todos que votaram e contribuíram para o sucesso do evento Conecta. 
            Em breve divulgaremos os resultados!
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 text-sm text-white/30">
          Conecta 2025
        </div>
      </Card>
    </div>
  );
};

export default Index;
