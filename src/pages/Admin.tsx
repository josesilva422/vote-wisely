import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, LogOut, Loader2, BarChart3, ImageIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Image = Tables<"images">;
type Vote = Tables<"votes">;

const Admin = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [votes, setVotes] = useState<(Vote & { image_title?: string })[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }
    await Promise.all([fetchImages(), fetchVotes()]);
    setLoading(false);
  };

  const fetchImages = async () => {
    const { data } = await supabase.from("images").select("*").order("display_order");
    setImages(data || []);
  };

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("votes")
      .select("*, images(title)")
      .order("created_at", { ascending: false });
    
    setVotes(
      (data || []).map((v: any) => ({
        ...v,
        image_title: v.images?.title || "Imagem removida",
      }))
    );
  };

  const addImage = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Preencha título e URL da imagem.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("images").insert({
      title: newTitle.trim(),
      image_url: newUrl.trim(),
      display_order: images.length,
    });
    if (error) {
      toast.error("Erro ao adicionar imagem.");
    } else {
      toast.success("Imagem adicionada!");
      setNewTitle("");
      setNewUrl("");
      await fetchImages();
    }
    setAdding(false);
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("images").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover imagem.");
    } else {
      toast.success("Imagem removida.");
      await fetchImages();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Chart data
  const voteCounts = images.map((img) => ({
    name: img.title,
    votos: votes.filter((v) => v.image_id === img.id).length,
  }));

  const chartConfig = {
    votos: { label: "Votos", color: "hsl(var(--primary))" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="images">
          <TabsList className="mb-6">
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-1" /> Imagens
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 className="h-4 w-4 mr-1" /> Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-6">
            {/* Add image form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Imagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Título da imagem"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    maxLength={100}
                  />
                  <Input
                    placeholder="URL da imagem"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    maxLength={500}
                  />
                  <Button onClick={addImage} disabled={adding} className="shrink-0">
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Galeria ({images.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma imagem cadastrada.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-medium mt-1 text-foreground truncate">{img.title}</p>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteImage(img.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Chart */}
            {voteCounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Votos por Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={voteCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="votos" fill="var(--color-votos)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Votes table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de Votos ({votes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {votes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum voto registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Votou em</TableHead>
                          <TableHead>Data/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {votes.map((vote) => (
                          <TableRow key={vote.id}>
                            <TableCell className="font-medium">{vote.voter_name}</TableCell>
                            <TableCell>{vote.image_title}</TableCell>
                            <TableCell>
                              {new Date(vote.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
