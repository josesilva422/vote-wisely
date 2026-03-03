import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Vote, Loader2 } from "lucide-react";
import { getSessionId, hasVoted, markAsVoted } from "@/lib/session";
import type { Tables } from "@/integrations/supabase/types";

type Image = Tables<"images">;

const Index = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [voterName, setVoterName] = useState("");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
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
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Obrigado pelo seu voto!</h1>
          <p className="text-muted-foreground">
            Seu voto foi registrado com sucesso. Agradecemos a sua participação!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Vote className="mx-auto h-10 w-10 mb-3" />
          <h1 className="text-3xl font-bold mb-2">Votação Online</h1>
          <p className="text-primary-foreground/80">
            Escolha sua imagem favorita e registre seu voto
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Name field */}
        <div className="max-w-md mx-auto space-y-2">
          <label htmlFor="voter-name" className="text-sm font-medium text-foreground">
            Nome completo <span className="text-destructive">*</span>
          </label>
          <Input
            id="voter-name"
            placeholder="Digite seu nome completo"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Nenhuma imagem disponível para votação no momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedImageId === image.id
                    ? "ring-3 ring-primary shadow-lg scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
                onClick={() => setSelectedImageId(image.id)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="font-medium text-sm text-foreground">{image.title}</p>
                  {selectedImageId === image.id && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary font-semibold">
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
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleVote}
              disabled={submitting || !selectedImageId || !voterName.trim()}
              className="min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4" /> Confirmar Voto
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
