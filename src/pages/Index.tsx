import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Adicionado DialogTitle
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
  const [voted, setVoted] = useState(false); // Inicializado como false para evitar hidratação incorreta

  useEffect(() => {
    // Verifica se já votou apenas no lado do cliente
    setVoted(hasVoted());
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar imagens");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!voterName.trim() || voterName.trim().length < 3) {
      toast.error("Por favor, digite seu nome completo (mínimo 3 caracteres).");
      return;
    }

    if (!selectedImageId) {
      toast.error("Selecione uma imagem para votar.");
      return;
    }

    setSubmitting(true);
    const sessionId = getSessionId();

    const { error: voteError } = await supabase.from("votes").insert({
      voter_name: voterName.trim(),
      image_id: selectedImageId,
      session_id: sessionId,
    });

    if (voteError) {
      toast.error("Erro ao registrar voto. Você já pode ter votado.");
      setSubmitting(false);
      return;
    }

    // Tenta enviar o e-mail em background
    try {
      const selectedImage = images.find((img) => img.id === selectedImageId);
      await supabase.functions.invoke("send-vote-email", {
        body: {
          voterName: voterName.trim(),
          imageTitle: selectedImage?.title || "Imagem desconhecida",
          votedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn("Falha ao enviar e-mail de confirmação, mas o voto foi registrado.");
    }

    markAsVoted();
    setVoted(true);
    setSubmitting(false);
    toast.success("Seu voto foi registrado com sucesso!");
  };

  if (voted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/10 backdrop-blur-lg border-none rounded-3xl shadow-2xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-400 mb-4" />
          <h1 className="text-2xl font-bold text-white">Obrigado pelo seu voto!</h1>
          <p className="text-white/70 mt-2">Sua participação no Conecta foi registrada com sucesso.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <header className="relative py-14 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-500/20 blur-3xl"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <img src="/conecta-logo.png" alt="Logo Conecta" className="mx-auto w-40 mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Votação Conecta</h1>
          <p className="text-white/70 text-lg">Escolha sua imagem favorita e participe 🎉</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
        <div className="max-w-md mx-auto space-y-2">
          <label className="text-sm font-medium text-white/80">Nome completo *</label>
          <Input
            placeholder="Digite seu nome completo"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-pink-500 focus:ring-pink-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-pink-400" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-white/60 py-12">Nenhuma imagem disponível.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <Card
                key={image.id}
                onClick={() => setSelectedImageId(image.id)}
                className={`group cursor-pointer overflow-hidden rounded-2xl border-0 transition-all duration-300 ${
                  selectedImageId === image.id
                    ? "scale-105 ring-4 ring-pink-500 shadow-2xl shadow-pink-500/40"
                    : "hover:scale-105 hover:shadow-xl"
                } bg-white/5 backdrop-blur-md`}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img src={image.image_url} alt={image.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <button
                    type="button"
                    className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(image);
                    }}
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="p-4 text-center">
                  <p className="font-semibold text-white truncate">{image.title}</p>
                  {selectedImageId === image.id && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pink-400">
                      <CheckCircle2 className="h-4 w-4" /> Selecionada
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button
              size="lg"
              onClick={handleVote}
              disabled={submitting || !selectedImageId || !voterName.trim()}
              className="px-10 py-6 text-lg font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg shadow-pink-500/30 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Enviando...
                </>
              ) : (
                <>
                  <Vote className="h-5 w-5 mr-2" /> Confirmar Voto
                </>
              )}
            </Button>
          </div>
        )}

        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="bg-slate-900 border-none max-w-[90vw] p-6">
            <DialogTitle className="sr-only">Visualização da Imagem</DialogTitle>
            {previewImage && (
              <div className="flex flex-col items-center gap-4">
                <img src={previewImage.image_url} alt={previewImage.title} className="max-h-[70vh] w-auto object-contain rounded-xl" />
                <p className="text-xl font-bold text-white">{previewImage.title}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;