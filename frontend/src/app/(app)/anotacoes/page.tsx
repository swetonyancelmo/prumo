"use client";

import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import {
  NotebookIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  ArrowLeftIcon,
  BoldIcon,
  ItalicIcon,
  CodeIcon,
  TerminalIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
} from "lucide-react";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { categoryColor } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AnotacoesPage() {
  return (
    <Suspense fallback={null}>
      <Anotacoes />
    </Suspense>
  );
}

function Anotacoes() {
  const notes = useResource<Note[]>("/notes");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = useMemo(() => {
    if (!activeNoteId || activeNoteId === "new") return null;
    return (notes.data ?? []).find((n) => n.id === activeNoteId) ?? null;
  }, [activeNoteId, notes.data]);

  useEffect(() => {
    setEditorMode("write"); // Reset to Write mode on note change
    if (activeNoteId === "new") {
      setTitle("");
      setContent("");
    } else if (activeNote) {
      setTitle(activeNote.title ?? "");
      setContent(activeNote.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [activeNoteId, activeNote]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const all = notes.data ?? [];
    if (!query) return all;
    return all.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    );
  }, [searchQuery, notes.data]);

  function openCreate() {
    setActiveNoteId("new");
  }

  function insertFormat(prefix: string, suffix = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setContent(newValue);

    // Refocus and select
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertFormat("**", "**");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertFormat("*", "*");
    }
  }

  const renderedHtml = useMemo(() => {
    if (!content) return '<p class="text-muted-foreground/60 italic text-sm">Sem conteúdo para visualizar...</p>';

    // Escape HTML to prevent XSS
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```js ... ```
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-xl my-4 font-mono text-sm overflow-x-auto border border-border/60 text-foreground"><code>$1</code></pre>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded font-mono text-xs border text-primary font-medium">$1</code>');

    // Bold: **text**
    html = html.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");

    // Italic: *text*
    html = html.replace(/\*([^\*]+)\*/g, "<em>$1</em>");

    // Headers (H1, H2, H3) - match from beginning of line
    html = html.replace(/^#\s+(.*?)$/gm, '<h1 class="text-xl md:text-2xl font-bold font-heading mt-6 mb-3 text-foreground first:mt-0">$1</h1>');
    html = html.replace(/^##\s+(.*?)$/gm, '<h2 class="text-lg md:text-xl font-bold font-heading mt-5 mb-2.5 text-foreground first:mt-0">$1</h2>');
    html = html.replace(/^###\s+(.*?)$/gm, '<h3 class="text-base md:text-lg font-bold font-heading mt-4 mb-2 text-foreground first:mt-0">$1</h3>');

    // Bullet points
    const lines = html.split("\n");
    let inList = false;
    const processedLines = [];

    for (const line of lines) {
      const listMatch = line.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        if (!inList) {
          processedLines.push('<ul class="list-disc ml-5 my-3 flex flex-col gap-1.5">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm leading-relaxed">${listMatch[1]}</li>`);
      } else {
        if (inList) {
          processedLines.push("</ul>");
          inList = false;
        }
        processedLines.push(line);
      }
    }
    if (inList) {
      processedLines.push("</ul>");
    }

    html = processedLines.join("\n");

    // Convert paragraphs
    const paragraphs = html.split(/\n\n+/);
    const formattedParagraphs = paragraphs.map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<h")
      ) {
        return trimmed;
      }
      const withBr = trimmed.replace(/\n/g, "<br />");
      return `<p class="mb-3 leading-relaxed text-sm md:text-base text-foreground/90">${withBr}</p>`;
    });

    return formattedParagraphs.join("\n");
  }, [content]);

  async function handleSave() {
    if (!content.trim()) {
      toast.error("O conteúdo da anotação não pode ser vazio.");
      return;
    }
    setSaving(true);
    try {
      if (activeNoteId === "new") {
        const res = await api.post<Note>("/notes", {
          title: title.trim() || null,
          content: content,
        });
        toast.success("Anotação criada.");
        await notes.refetch();
        setActiveNoteId(res.id);
      } else if (activeNoteId) {
        await api.patch(`/notes/${activeNoteId}`, {
          title: title.trim() || null,
          content: content,
        });
        toast.success("Anotação salva.");
        await notes.refetch();
      }
    } catch {
      toast.error("Não foi possível salvar a anotação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingNote) return;
    try {
      await api.delete(`/notes/${deletingNote.id}`);
      toast.success("Anotação excluída.");
      if (activeNoteId === deletingNote.id) {
        setActiveNoteId(null);
      }
      await notes.refetch();
    } catch {
      toast.error("Não foi possível excluir a anotação.");
    } finally {
      setDeletingNote(null);
    }
  }

  return (
    <>
      <div className={cn(activeNoteId !== null && "hidden md:block")}>
        <PageHeader
          title="Anotações"
          subtitle="Guarde suas ideias, anotações de aulas e lembretes rápidos"
          action={
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Nova anotação
            </Button>
          }
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:h-[650px] items-stretch w-full">
        {/* List column */}
        <div
          className={cn(
            "flex flex-col gap-4 w-full md:w-80 lg:w-96 shrink-0 md:border-r md:pr-6 h-full",
            activeNoteId !== null && "hidden md:flex"
          )}
        >
          {/* Search and Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar anotações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon-lg"
              className="size-9 h-9 pointer-coarse:size-9 md:hidden"
              onClick={openCreate}
              aria-label="Nova anotação"
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[300px] pr-1">
            {notes.loading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <Empty className="py-8 bg-card/20 rounded-xl border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <NotebookIcon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchQuery ? "Nenhum resultado" : "Nenhuma anotação"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? "Experimente buscar por outros termos."
                      : "Crie uma anotação para começar."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              filteredNotes.map((note) => {
                const active = note.id === activeNoteId;
                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={cn(
                      "flex items-stretch text-left w-full rounded-xl border p-3 gap-3 transition-all hover:bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-secondary/60 border-primary/30 ring-1 ring-primary/20"
                        : "bg-card border-border"
                    )}
                  >
                    {/* Color tab signature */}
                    <span
                      aria-hidden
                      className="w-1 shrink-0 rounded-full my-0.5"
                      style={{ backgroundColor: categoryColor(note.id) }}
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-heading font-medium text-sm text-foreground truncate flex-1">
                          {note.title || "Sem título"}
                        </h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-all font-sans">
                        {note.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Editor column */}
        <div
          className={cn(
            "flex-1 flex flex-col gap-4 h-full",
            activeNoteId === null && "hidden md:flex"
          )}
        >
          {activeNoteId === null ? (
            <div className="flex-1 hidden md:flex items-center justify-center border rounded-xl bg-card/40 p-8 text-center text-muted-foreground">
              <div className="max-w-sm flex flex-col items-center gap-2">
                <NotebookIcon className="size-8 opacity-40 mb-2" />
                <p className="font-medium text-base">Nenhuma anotação selecionada</p>
                <p className="text-sm text-muted-foreground/80">
                  Escolha uma anotação na lista ao lado ou crie uma nova para começar a escrever.
                </p>
              </div>
            </div>
          ) : (
            <Card className="flex-1 flex flex-col h-full overflow-hidden border bg-card rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 gap-4 px-4 md:px-6">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile back button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setActiveNoteId(null)}
                    aria-label="Voltar para a lista"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground truncate">
                    {activeNoteId === "new"
                      ? "Nova Anotação"
                      : `Atualizado em ${formatDate(activeNote?.updatedAt ?? "")}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeNoteId !== "new" && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => activeNote && setDeletingNote(activeNote)}
                      aria-label="Excluir anotação"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={saving || !content.trim()}
                  >
                    {saving && <Spinner data-icon="inline-start" />}
                    Salvar
                  </Button>
                </div>
              </CardHeader>

              {/* Tab Selector */}
              <div className="flex border-b text-xs px-4 md:px-6 bg-muted/20">
                <button
                  onClick={() => setEditorMode("write")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer",
                    editorMode === "write"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Escrever
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 font-medium transition-colors cursor-pointer",
                    editorMode === "preview"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Visualizar
                </button>
              </div>

              <CardContent className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-hidden">
                {editorMode === "write" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Título da anotação..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="text-xl md:text-2xl font-bold font-heading bg-transparent border-0 outline-none w-full placeholder:text-muted-foreground/40 focus:ring-0 text-foreground"
                    />

                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-border/40">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("**", "**")}
                        title="Negrito (Ctrl+B)"
                      >
                        <BoldIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("*", "*")}
                        title="Itálico (Ctrl+I)"
                      >
                        <ItalicIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("`", "`")}
                        title="Código inline"
                      >
                        <CodeIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("```\n", "\n```")}
                        title="Bloco de código"
                      >
                        <TerminalIcon className="size-3.5" />
                      </Button>
                      <span className="w-px h-4 bg-border mx-1" />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("# ")}
                        title="Título Principal"
                      >
                        <Heading1Icon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("## ")}
                        title="Subtítulo"
                      >
                        <Heading2Icon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => insertFormat("- ")}
                        title="Lista com Marcadores"
                      >
                        <ListIcon className="size-3.5" />
                      </Button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      placeholder="Comece a escrever sua anotação aqui (suporta Markdown)..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 w-full bg-transparent resize-none outline-none border-0 focus:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/40 text-foreground overflow-y-auto font-sans"
                    />
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-4">
                      {title || "Sem título"}
                    </h1>
                    <div
                      className="prose dark:prose-invert max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deletingNote !== null}
        onOpenChange={(o) => !o && setDeletingNote(null)}
        title="Excluir anotação?"
        description="Esta ação não pode ser desfeita e removerá permanentemente a anotação."
        onConfirm={handleDelete}
      />
    </>
  );
}
