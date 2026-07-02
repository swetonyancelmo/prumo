"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import {
  toDateInputValue,
  dateInputToISO,
  dateTimeInputToISO,
  toTimeInputValue,
} from "@/lib/format";
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
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const NO_REPEAT = "__none__";
const RRULE_LABELS: Record<string, string> = {
  "FREQ=DAILY": "Todo dia",
  "FREQ=WEEKLY": "Toda semana",
  "FREQ=MONTHLY": "Todo mês",
};

export function TaskDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Task | null;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = editing !== null;
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState<string>(NO_REPEAT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Hidrata o formulário a partir das props quando o diálogo abre.
    /* eslint-disable react-hooks/set-state-in-effect */
    setDescription(editing?.description ?? "");
    setDueDate(toDateInputValue(editing?.dueDate ?? null));
    setDueTime(editing?.hasTime ? toTimeInputValue(editing.dueDate) : "");
    setRecurrence(editing?.recurrenceRule ?? NO_REPEAT);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Descreva a tarefa.");
      return;
    }
    setSaving(true);
    try {
      const isRecurring = recurrence !== NO_REPEAT;
      const recurrenceRule = isRecurring ? recurrence : null;
      // Sem data → sem hora. Com data + hora → compromisso (hasTime). Com data
      // e sem hora → dia inteiro (ancorado ao meio-dia local).
      const hasTime = !!dueDate && !!dueTime;
      const iso = dueDate
        ? hasTime
          ? dateTimeInputToISO(dueDate, dueTime)
          : dateInputToISO(dueDate)
        : null;

      if (isEdit) {
        await api.patch(`/tasks/${editing.id}`, {
          description: description.trim(),
          dueDate: iso,
          hasTime,
          isRecurring,
          recurrenceRule,
        });
      } else {
        await api.post("/tasks", {
          description: description.trim(),
          ...(iso ? { dueDate: iso } : {}),
          hasTime,
          isRecurring,
          ...(isRecurring ? { recurrenceRule } : {}),
        });
      }
      toast.success(isEdit ? "Tarefa atualizada." : "Tarefa criada.");
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
          <DialogTitle>{isEdit ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Uma coisa para não esquecer — com ou sem data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="task-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="task-desc">O que precisa fazer?</FieldLabel>
              <Input
                id="task-desc"
                placeholder="Pagar conta de luz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="task-due">Vencimento</FieldLabel>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (!e.target.value) setDueTime("");
                }}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="task-time">Horário</FieldLabel>
              <Input
                id="task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!dueDate}
              />
              <FieldDescription>
                Opcional. Com horário, vira um compromisso na sua agenda.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Repetir</FieldLabel>
              <Select
                value={recurrence}
                onValueChange={(v) => setRecurrence(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Não repete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_REPEAT}>Não repete</SelectItem>
                  {Object.entries(RRULE_LABELS).map(([rule, label]) => (
                    <SelectItem key={rule} value={rule}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Button type="submit" form="task-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {isEdit ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
