"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { calcMin, fmtOre } from "@/lib/utils";
import { useApp } from "@/components/app-context";
import { insertTurno } from "@/lib/actions";
import TimeSelect from "./time-select";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

// ── Stili form condivisi ────────────────────────────────────────────────────
const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

// Opzioni ore macchinario: 30 min → 12 h con step 30 min
const ORE_MEZZO_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const val = (i + 1) * 0.5;
  const h = Math.floor(val);
  const m = val % 1 !== 0;
  const label = h === 0 ? "30 min" : m ? `${h} h 30 min` : `${h} h`;
  return { value: val, label };
});

// Wrapper animato per sezioni condizionali del form
function FadeField({ show, children }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toggle switch riutilizzabile
function Switch({ checked, onChange }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.9 }}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{
        background: checked ? "var(--primary)" : "var(--border-strong)",
      }}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

function FormBody({ onSuccess }) {
  const { operaio, cantieri, lavori, macchinari, aggiungiTurno } = useApp();

  const [saving, setSaving] = useState(false);
  // Switch — macchinario
  const [usaMacchinario, setUsaMacchinario] = useState(false);
  // Switch — spostamento km
  const [usaKm, setUsaKm] = useState(false);

  const oggi = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dataOggi = `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}-${pad(oggi.getDate())}`;
  const meseMin = `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}-01`;
  const ultimoGiorno = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
  const meseMax = `${ultimoGiorno.getFullYear()}-${pad(ultimoGiorno.getMonth() + 1)}-${pad(ultimoGiorno.getDate())}`;

  const { register, handleSubmit, control, setValue } = useForm({
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      data: dataOggi,
      cantiere_id: "",
      lavoro_id: "",
      macchinario_id: "",
      ore_mezzo: "",
      inizio: "",
      fine: "",
      note: "",
      lavoro_finito: null,
      km_percorso: "",
      km_totale: "",
    },
  });

  // Valori osservati per calcolo ore e logica condizionale in real-time
  const cantiere_id = useWatch({ control, name: "cantiere_id" });
  const lavoro_id = useWatch({ control, name: "lavoro_id" });
  const inizio = useWatch({ control, name: "inizio" });
  const fine = useWatch({ control, name: "fine" });
  const macchinario_id = useWatch({ control, name: "macchinario_id" });
  const ore_mezzo = useWatch({ control, name: "ore_mezzo" });
  const km_percorso = useWatch({ control, name: "km_percorso" });
  const km_totale = useWatch({ control, name: "km_totale" });

  const minutiForm = calcMin(inizio, fine);
  const isAssenza =
    cantieri.find((c) => c.id === Number(cantiere_id))?.isAssenza ?? false;

  // Verifica manuale campi obbligatori — più affidabile di isValid con mode:onChange
  const campiBase =
    !!cantiere_id && !!lavoro_id && !!inizio && !!fine && minutiForm > 0;
  const campiMezzo = !usaMacchinario || (!!macchinario_id && !!ore_mezzo);
  const campiKm =
    !usaKm || (!!km_percorso.trim() && !!km_totale && parseFloat(km_totale) > 0);
  const canSubmit = isAssenza ? !!cantiere_id : campiBase && campiMezzo && campiKm;

  // Pulisce i campi dipendenti quando cambiano le selezioni principali
  useEffect(() => {
    if (isAssenza) {
      setValue("lavoro_id", "");
      setValue("inizio", "");
      setValue("fine", "");
      setValue("note", "");
    }
  }, [isAssenza, setValue]);

  // Pulisce i campi macchinario quando lo switch viene spento
  useEffect(() => {
    if (!usaMacchinario) {
      setValue("macchinario_id", "");
      setValue("ore_mezzo", "");
      setValue("lavoro_finito", null);
    }
  }, [usaMacchinario, setValue]);

  // Pulisce i campi km quando lo switch spostamento viene spento
  useEffect(() => { // eslint-disable-line react-hooks/set-state-in-effect
    if (!usaKm) {
      setValue("km_percorso", "");
      setValue("km_totale", "");
    }
  }, [usaKm, setValue]);

  async function onSubmit(values) {
    setSaving(true);

    const cantiereObj = cantieri.find(
      (c) => c.id === Number(values.cantiere_id),
    );
    const macchinarioObj = usaMacchinario
      ? macchinari.find((m) => m.id === Number(values.macchinario_id))
      : null;

    const result = await insertTurno({
      values,
      cantiereObj,
      macchinarioObj,
      operaio,
    });

    if (!result.success) {
      toast.error(result.error ?? "Errore salvataggio");
      setSaving(false);
      return;
    }

    aggiungiTurno(result.data);
    setSaving(false);
    toast.success("Turno salvato con successo!");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Data */}
      <div className={fieldCls}>
        <label className={labelCls}>Data</label>
        <input
          type="date"
          min={meseMin}
          max={meseMax}
          {...register("data")}
          className={inputCls + " appearance-none min-w-0"}
        />
      </div>

      {/* Cantiere */}
      <div className={fieldCls}>
        <label className={labelCls}>Cantiere</label>
        <select
          {...register("cantiere_id")}
          className={inputCls}
        >
          <option value="" disabled>
            Seleziona cantiere
          </option>
          {cantieri?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cantiere}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo lavoro — slide-in animato */}
      <FadeField show={!!(cantiere_id && !isAssenza)}>
        <div className={fieldCls}>
          <label className={labelCls}>Tipo Lavoro</label>
          <select
            {...register("lavoro_id")}
            className={inputCls}
          >
            <option value="" disabled>
              Seleziona lavoro
            </option>
            {lavori?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lavoro}
              </option>
            ))}
          </select>
        </div>
      </FadeField>

      {/* Orario — slide-in animato */}
      <FadeField show={!!lavoro_id}>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldCls}>
            <label className={labelCls}>Inizio</label>
            <Controller
              name="inizio"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleziona ora"
                />
              )}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Fine</label>
            <Controller
              name="fine"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleziona ora"
                  minTime={inizio}
                />
              )}
            />
          </div>
        </div>
      </FadeField>

      {/* Ore calcolate — pop-in 3D */}
      <AnimatePresence>
        {minutiForm > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8, rotateX: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: "spring", damping: 20, stiffness: 320 }}
            style={{
              borderColor: "var(--primary)",
              background: "var(--primary-faint)",
              transformPerspective: 700,
            }}
            className="rounded-lg p-4 text-center border-2"
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "var(--primary)" }}
            >
              Ore calcolate
            </p>
            <motion.p
              key={minutiForm}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="text-2xl font-black"
              style={{ color: "var(--primary)" }}
            >
              {fmtOre(minutiForm)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch macchinario */}
      <FadeField show={!!lavoro_id}>
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between border"
          style={{
            background: "var(--bg-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            Hai usato un macchinario/mezzo?
          </span>
          <Switch checked={usaMacchinario} onChange={setUsaMacchinario} />
        </div>
      </FadeField>

      {/* Macchinario + ore mezzo */}
      <FadeField show={!!(lavoro_id && usaMacchinario)}>
        <div className="flex flex-col gap-4">
          <div className={fieldCls}>
            <label className={labelCls}>Macchinario</label>
            <select
              {...register("macchinario_id")}
              className={inputCls}
            >
              <option value="">Seleziona macchinario</option>
              {macchinari?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mezzo} — {m.cod_mezzo}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>Ore macchinario</label>
            <select
              {...register("ore_mezzo")}
              className={inputCls}
            >
              <option value="">Seleziona ore</option>
              {ORE_MEZZO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lavoro finito */}
          <Controller
            name="lavoro_finito"
            control={control}
            render={({ field }) => (
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-6 border"
                style={{
                  background: "var(--bg-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <span className={labelCls + " shrink-0"}>Lavoro finito</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={() =>
                      field.onChange(field.value === true ? null : true)
                    }
                    className="w-4 h-4 rounded accent-red-600"
                  />
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    Sì
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value === false}
                    onChange={() =>
                      field.onChange(field.value === false ? null : false)
                    }
                    className="w-4 h-4 rounded accent-red-600"
                  />
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    No
                  </span>
                </label>
              </div>
            )}
          />
        </div>
      </FadeField>

      {/* Switch spostamento km */}
      <FadeField show={!!lavoro_id}>
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between border"
          style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Rimborso chilometrico?
          </span>
          <Switch checked={usaKm} onChange={setUsaKm} />
        </div>
      </FadeField>

      {/* Spostamento: percorso + km */}
      <FadeField show={!!(lavoro_id && usaKm)}>
        <div className="flex flex-col gap-4">
          <div className={fieldCls}>
            <label className={labelCls}>Percorso effettuato</label>
            <textarea
              {...register("km_percorso")}
              rows={2}
              placeholder="es. da Viserbella a Spadarolo"
              className={inputCls + " resize-none"}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Chilometri percorsi</label>
            <Controller
              name="km_totale"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="es. 12.5"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.replace(",", "."))}
                  className={inputCls}
                />
              )}
            />
          </div>
        </div>
      </FadeField>

      {/* Note */}
      <FadeField show={!!lavoro_id}>
        <div className={fieldCls}>
          <label className={labelCls}>Note (opzionale)</label>
          <textarea
            {...register("note")}
            rows={2}
            placeholder="Aggiungi note..."
            className={inputCls + " resize-none"}
          />
        </div>
      </FadeField>

      {/* Submit */}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.97, rotateX: 4 }}
        style={{
          background: saving ? "var(--primary-hover)" : "var(--primary)",
          transformPerspective: 600,
        }}
        disabled={saving || !canSubmit}
        className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> Salvataggio...
          </span>
        ) : (
          "Salva Ore"
        )}
      </motion.button>
    </form>
  );
}

// Wrapper che rimonta FormBody al cambio di formKey — reset completo senza window.reload
function FormInserimento() {
  const [formKey, setFormKey] = useState(0);
  return <FormBody key={formKey} onSuccess={() => setFormKey((k) => k + 1)} />;
}

export default FormInserimento;
