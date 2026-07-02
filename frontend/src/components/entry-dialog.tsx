"use client";

import { useEffect, useState } from "react";
import type { Category, Expense, Income } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { parseAmount, toDateInputValue, dateInputToISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EntryKind } from "@/components/entry-row";
import { toast } from "sonner";

const NONE = "__none__";
const NEW = "__new__";

/** Converte "45,90" / "45.90" / "R$ 45" em número. */
function parseCurrencyInput(raw: string): number {
  const cleaned = raw
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // remove separador de milhar
    .replace(",", ".");
  return parseAmount(cleaned);
}

type Editing =
  | { kind: "expense"; entry: Expense }
  | { kind: "income"; entry: Income }
  | null;

export function EntryDialog({
  open,
  onOpenChange,
  editing,
  categories,
  onSaved,
  onCategoryCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Editing;
  categories: Category[];
  onSaved: () => void | Promise<void>;
  onCategoryCreated: () => void | Promise<void>;
}) {
  const isEdit = editing !== null;
  const [kind, setKind] = useState<EntryKind>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [categoryValue, setCategoryValue] = useState<string>(NONE);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const despesaCategories = categories.filter((c) => c.type === "despesa");

  // (Re)inicializa o formulário quando abre.
  useEffect(() => {
    if (!open) return;
    // Hidrata o formulário a partir das props quando o diálogo abre.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing?.kind === "expense") {
      setKind("expense");
      setAmount(String(parseAmount(editing.entry.amount)).replace(".", ","));
      setDescription(editing.entry.description ?? "");
      setDate(toDateInputValue(editing.entry.occurredAt));
      setCategoryValue(editing.entry.categoryId ?? NONE);
    } else if (editing?.kind === "income") {
      setKind("income");
      setAmount(String(parseAmount(editing.entry.amount)).replace(".", ","));
      setDescription(editing.entry.description ?? "");
      setDate(toDateInputValue(editing.entry.receivedAt));
    } else {
      setKind("expense");
      setAmount("");
      setDescription("");
      setDate(toDateInputValue(new Date().toISOString()));
      setCategoryValue(NONE);
    }
    setNewCategory("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseCurrencyInput(amount);
    if (!(value > 0)) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setSaving(true);
    try {
      const isoDate = date ? dateInputToISO(date) : undefined;

      if (kind === "expense") {
        let categoryId: string | undefined;
        if (categoryValue === NEW && newCategory.trim()) {
          const created = await api.post<Category>("/categories", {
            name: newCategory.trim(),
            type: "despesa",
          });
          categoryId = created.id;
          await onCategoryCreated();
        } else if (categoryValue !== NONE && categoryValue !== NEW) {
          categoryId = categoryValue;
        }

        const body = {
          amount: value,
          description: description.trim() || undefined,
          occurredAt: isoDate,
          ...(categoryId ? { categoryId } : {}),
        };
        if (editing?.kind === "expense") {
          await api.patch(`/expenses/${editing.entry.id}`, body);
        } else {
          await api.post("/expenses", body);
        }
      } else {
        const body = {
          amount: value,
          description: description.trim() || undefined,
          receivedAt: isoDate,
        };
        if (editing?.kind === "income") {
          await api.patch(`/incomes/${editing.entry.id}`, body);
        } else {
          await api.post("/incomes", body);
        }
      }

      toast.success(isEdit ? "Lançamento atualizado." : "Lançamento salvo.");
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Não foi possível salvar.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar lançamento" : "Novo lançamento"}
          </DialogTitle>
          <DialogDescription>
            {kind === "expense"
              ? "Uma saída de dinheiro."
              : "Uma entrada de dinheiro."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="entry-form">
          <FieldGroup>
            {/* Tipo — só na criação */}
            {!isEdit && (
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                <TypeButton
                  active={kind === "expense"}
                  onClick={() => setKind("expense")}
                >
                  Despesa
                </TypeButton>
                <TypeButton
                  active={kind === "income"}
                  onClick={() => setKind("income")}
                >
                  Receita
                </TypeButton>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="amount">Valor</FieldLabel>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Input
                id="description"
                placeholder={
                  kind === "expense" ? "Almoço, mercado…" : "Salário, freela…"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
              />
            </Field>

            {kind === "expense" && (
              <Field>
                <FieldLabel>Categoria</FieldLabel>
                <Select
                  value={categoryValue}
                  onValueChange={(v) => setCategoryValue(v as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem categoria</SelectItem>
                    {despesaCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW}>➕ Nova categoria…</SelectItem>
                  </SelectContent>
                </Select>
                {categoryValue === NEW && (
                  <Input
                    className="mt-2"
                    placeholder="Nome da categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                )}
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="date">Data</FieldLabel>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="entry-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {isEdit ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
