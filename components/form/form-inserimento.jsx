"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { calcMin, fmtOre } from "@/lib/utils";
import { useApp } from "@/components/app-context";
import { insertTurno } from "@/lib/actions";
import TimeSelect from "./time-select";

// ── Stili form condivisi ────────────────────────────────────────────────────
const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

function FormInserimento() {
  const { operaio, cantieri, lavori, macchinari, aggiungiTurno } = useApp();

  const [saving, setSaving] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const [errore, setErrore] = useState("");

  const oggi = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dataOggi = `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}-${pad(oggi.getDate())}`;
  const meseMin = `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}-01`;
  const ultimoGiorno = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
  const meseMax = `${ultimoGiorno.getFullYear()}-${pad(ultimoGiorno.getMonth() + 1)}-${pad(ultimoGiorno.getDate())}`;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isValid },
  } = useForm({
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      data: dataOggi,
      cantiere_id: "",
      lavoro_id: "",
      macchinario_id: "",
      inizio: "",
      fine: "",
      note: "",
      lavoro_finito: null,
    },
  });

  // Valori osservati per calcolo ore e codice lavoro in real-time
  const cantiere_id = useWatch({ control, name: "cantiere_id" });
  const lavoro_id = useWatch({ control, name: "lavoro_id" });
  const inizio = useWatch({ control, name: "inizio" });
  const fine = useWatch({ control, name: "fine" });

  const minutiForm = calcMin(inizio, fine);
  const showMacchinari = lavori.find((l) => l.id === Number(lavoro_id))?.required_mezzo ?? false;
  const isAssenza = cantieri.find((c) => c.id === Number(cantiere_id))?.isAssenza ?? false;

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
    setErrore("");

    const cantiereObj = cantieri.find((c) => c.id === Number(values.cantiere_id));
    const macchinarioObj = macchinari.find((m) => m.id === Number(values.macchinario_id));

    const result = await insertTurno({ values, cantiereObj, macchinarioObj, operaio });

    if (!result.success) {
      setErrore(result.error ?? "Errore salvataggio");
      setSaving(false);
      return;
    }

    aggiungiTurno(result.data);

    reset({
      data: dataOggi,
      cantiere_id: "",
      lavoro_id: "",
      macchinario_id: "",
      inizio: "",
      fine: "",
      note: "",
      lavoro_finito: null,
    });

    setSaving(false);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 2500);
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* Data */}
      <div className={fieldCls}>
        <label className={labelCls}>Data</label>
        <input
          type="date"
          min={meseMin}
          max={meseMax}
          {...register("data", { required: true })}
          className={inputCls}
        />
      </div>

      {/* Cantiere */}
      <div className={fieldCls}>
        <label className={labelCls}>Cantiere</label>
        <select {...register("cantiere_id", { required: true })} className={inputCls}>
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
          <select {...register("lavoro_id", { required: true })} className={inputCls}>
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
          <p className="text-xs font-medium mb-1" style={{ color: "var(--primary)" }}>Ore calcolate</p>
          <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>{fmtOre(minutiForm)}</p>
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
        {saving ? "Salvataggio in corso..." : "Salva Ore"}
      </button>

      {/* Feedback */}
      {salvato && (
        <p className="text-center text-sm font-medium text-emerald-500">✓ Salvato con successo!</p>
      )}
      {errore && (
        <p className="text-center text-sm font-medium" style={{ color: "var(--destructive)" }}>
          ✗ {errore}
        </p>
      )}
    </form>
  );
}

export default FormInserimento;