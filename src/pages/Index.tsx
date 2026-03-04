import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, Vote, Loader2, ZoomIn } from "lucide-react";
import { getSessionId, hasVoted, markAsVoted } from "@/lib/session";
import type { Tables } from "@/integrations/supabase/types";

type Image = Tables<"images">;

const Index = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [voterName, setVoterName] = useState("");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(hasVoted());

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar imagens");
      return;
    }
    setImages(data || []);
    setLoading(false);
  };

  const handleVote = async () => {
    if (!voterName.trim()) {
      toast.error("Por favor, digite seu nome completo.");
      return;
    }
    if (voterName.trim().length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!selectedImageId) {
      toast.error("Por favor, selecione uma imagem para votar.");
      return;
    }

    setSubmitting(true);

    const sessionId = getSessionId();

    const { error } = await supabase.from("votes").insert({
      voter_name: voterName.trim(),
      image_id: selectedImageId,
      session_id: sessionId,
    });

    if (error) {
      toast.error("Erro ao registrar voto. Tente novamente.");
      setSubmitting(false);
      return;
    }

    // Try to send email notification (non-blocking)
    try {
      const selectedImage = images.find((img) => img.id === selectedImageId);
      await supabase.functions.invoke("send-vote-email", {
        body: {
          voterName: voterName.trim(),
          imageTitle: selectedImage?.title || "Imagem desconhecida",
          votedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Email is non-critical
    }

    markAsVoted();
    setVoted(true);
    setSubmitting(false);
    toast.success("Seu voto foi registrado com sucesso!");
  };

  if (voted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1145] via-[#2d1b69] to-[#0f172a] px-4 relative overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px]" />

        <Card className="max-w-md w-full p-10 text-center space-y-5 bg-white/10 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl relative z-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Obrigado pelo seu voto!</h1>
          <p className="text-white/60 text-lg">
            Seu voto foi registrado com sucesso. Agradecemos a sua participação!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1145] via-[#2d1b69] to-[#0f172a] relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative py-10 md:py-14 px-4">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-4">
          {/* Logo + Title row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            {/* Logo with glow background */}
            <div className="bg-white/10 backdrop-blur-md rounded-full p-3 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <img
                src="/conecta-logo.png"
                alt="Conecta"
                className="w-16 sm:w-20 md:w-24 h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] brightness-110"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center sm:text-left">
              Votação Online
            </h1>
          </div>
          <p className="text-white/50 text-lg max-w-md text-center">
            Escolha sua imagem favorita e registre seu voto
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10 relative z-10">
        {/* Name field */}
        <div className="max-w-md mx-auto space-y-2">
          <label htmlFor="voter-name" className="text-sm font-medium text-white/80">
            Nome completo <span className="text-pink-400">*</span>
          </label>
          <Input
            id="voter-name"
            placeholder="Digite seu nome completo"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            maxLength={100}
            className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-purple-500/50 focus-visible:border-purple-400/50 backdrop-blur-sm rounded-xl h-12"
          />
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-white/40 py-12">
            Nenhuma imagem disponível para votação no momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className={`overflow-hidden cursor-pointer transition-all duration-300 bg-white/5 border-white/10 rounded-2xl backdrop-blur-sm group ${
                  selectedImageId === image.id
                    ? "ring-2 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-[1.03]"
                    : "hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/20"
                }`}
                onClick={() => setSelectedImageId(image.id)}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(image);
                    }}
                    aria-label="Ampliar imagem"
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="p-3 text-center">
                  <p className="font-semibold text-sm text-white/90">{image.title}</p>
                  {selectedImageId === image.id && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-purple-300 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selecionada
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Submit */}
        {images.length > 0 && (
          <div className="flex justify-center pb-8">
            <Button
              size="lg"
              onClick={handleVote}
              disabled={submitting || !selectedImageId || !voterName.trim()}
              className="min-w-[220px] rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-base font-bold h-13 px-10 shadow-[0_4px_25px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_35px_rgba(139,92,246,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Vote className="h-5 w-5" /> Confirmar Voto
                </>
              )}
            </Button>
          </div>
        )}

        {/* Fullscreen Image Preview */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:p-4">
            {previewImage && (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={previewImage.image_url}
                  alt={previewImage.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-md"
                />
                <p className="text-lg font-semibold text-foreground">{previewImage.title}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;
