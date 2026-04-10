"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { calcMin, fmtOre } from "@/lib/utils";
import { useApp } from "@/components/app-context";
import { updateTurno } from "@/lib/actions";
import TimeSelect from "./time-select";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

// ── Stili form condivisi ────────────────────────────────────────────────────
const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

// turno     — record completo da modificare
// onSuccess — callback chiamato con il turno aggiornato dopo salvataggio
function FormModifica({ turno, onSuccess }) {
  const { cantieri, lavori, macchinari } = useApp();

  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isValid },
  } = useForm({
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      data: turno.data ?? "",
      cantiere_id: String(turno.cantiere_id ?? ""),
      lavoro_id: String(turno.lavoro_id ?? ""),
      macchinario_id: String(turno.mezzo_id ?? ""),
      inizio: turno.inizio ?? "",
      fine: turno.fine ?? "",
      note: turno.note ?? "",
      lavoro_finito: turno.lavoro_finito ?? null,
    },
  });

  // Valori osservati per logica condizionale e calcolo ore in real-time
  const cantiere_id = useWatch({ control, name: "cantiere_id" });
  const lavoro_id = useWatch({ control, name: "lavoro_id" });
  const inizio = useWatch({ control, name: "inizio" });
  const fine = useWatch({ control, name: "fine" });

  const minutiForm = calcMin(inizio, fine);
  const showMacchinari =
    lavori.find((l) => l.id === Number(lavoro_id))?.required_mezzo ?? false;
  const isAssenza =
    cantieri.find((c) => c.id === Number(cantiere_id))?.isAssenza ?? false;

  useEffect(() => {
    if (isAssenza) {
      setValue("lavoro_id", "");
      setValue("inizio", "");
      setValue("fine", "");
      setValue("note", "");
    }
    if (!showMacchinari) {
      setValue("macchinario_id", "");
      setValue("lavoro_finito", null);
    }
  }, [isAssenza, showMacchinari, setValue]);

  async function onSubmit(values) {
    setSaving(true);

    const cantiereObj = cantieri.find((c) => c.id === Number(values.cantiere_id));
    const macchinarioObj = macchinari.find((m) => m.id === Number(values.macchinario_id));

    const result = await updateTurno(turno.id, { values, cantiereObj, macchinarioObj });

    if (!result.success) {
      toast.error(result.error ?? "Errore modifica turno");
      setSaving(false);
      return;
    }

    setSaving(false);
    toast.success("Turno modificato con successo!");
    onSuccess(result.data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Data */}
      <div className={fieldCls}>
        <label className={labelCls}>Data</label>
        <input
          type="date"
          {...register("data", { required: true })}
          className={inputCls + " appearance-none min-w-0"}
        />
      </div>

      {/* Cantiere */}
      <div className={fieldCls}>
        <label className={labelCls}>Cantiere</label>
        <select
          {...register("cantiere_id", { required: true })}
          className={inputCls}
        >
          <option value="" disabled>Seleziona cantiere</option>
          {cantieri?.map((c) => (
            <option key={c.id} value={c.id}>{c.cantiere}</option>
          ))}
        </select>
      </div>

      {/* Tipo lavoro */}
      {cantiere_id && !isAssenza && (
        <div className={fieldCls}>
          <label className={labelCls}>Tipo Lavoro</label>
          <select
            {...register("lavoro_id", { required: true })}
            className={inputCls}
          >
            <option value="" disabled>Seleziona lavoro</option>
            {lavori?.map((l) => (
              <option key={l.id} value={l.id}>{l.lavoro}</option>
            ))}
          </select>
        </div>
      )}

      {/* Macchinario */}
      {lavoro_id && showMacchinari && (
        <div className={fieldCls}>
          <label className={labelCls}>Macchinario</label>
          <select {...register("macchinario_id")} className={inputCls}>
            <option value="">Seleziona macchinario</option>
            {macchinari?.map((m) => (
              <option key={m.id} value={m.id}>{m.mezzo} — {m.cod_mezzo}</option>
            ))}
          </select>
        </div>
      )}

      {/* Orario */}
      {lavoro_id && (
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldCls}>
            <label className={labelCls}>Inizio</label>
            <Controller
              name="inizio"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TimeSelect value={field.value} onChange={field.onChange} placeholder="Seleziona ora" />
              )}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Fine</label>
            <Controller
              name="fine"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TimeSelect value={field.value} onChange={field.onChange} placeholder="Seleziona ora" minTime={inizio} />
              )}
            />
          </div>
        </div>
      )}

      {/* Lavoro finito */}
      {lavoro_id && showMacchinari && (
        <Controller
          name="lavoro_finito"
          control={control}
          render={({ field }) => (
            <div
              className="rounded-lg px-4 py-3 flex items-center gap-6 border"
              style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}
            >
              <span className={labelCls + " shrink-0"}>Lavoro finito</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onChange={() => field.onChange(field.value === true ? null : true)}
                  className="w-4 h-4 rounded accent-red-600"
                />
                <span className="text-sm" style={{ color: "var(--text)" }}>Sì</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value === false}
                  onChange={() => field.onChange(field.value === false ? null : false)}
                  className="w-4 h-4 rounded accent-red-600"
                />
                <span className="text-sm" style={{ color: "var(--text)" }}>No</span>
              </label>
            </div>
          )}
        />
      )}

      {/* Ore calcolate */}
      {minutiForm > 0 && (
        <div
          className="rounded-lg p-4 text-center border-2"
          style={{ borderColor: "var(--primary)", background: "var(--primary-faint)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--primary)" }}>
            Ore calcolate
          </p>
          <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>
            {fmtOre(minutiForm)}
          </p>
        </div>
      )}

      {/* Note */}
      {lavoro_id && (
        <div className={fieldCls}>
          <label className={labelCls}>Note (opzionale)</label>
          <textarea
            {...register("note")}
            rows={2}
            placeholder="Aggiungi note..."
            className={inputCls + " resize-none"}
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || (isAssenza ? !cantiere_id : !isValid || minutiForm <= 0)}
        className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        style={{ background: saving ? "var(--primary-hover)" : "var(--primary)" }}
      >
        {saving ? <span className="flex items-center justify-center gap-2"><Spinner /> Salvataggio...</span> : "Salva Modifiche"}
      </button>
    </form>
  );
}

export default FormModifica;