"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { calcMin, fmtOre, fmtData, getMeseLimiti } from "@/lib/utils";
import { useApp } from "@/components/app-context";
import { updateTurno } from "@/lib/actions";
import TimeSelect from "./time-select";
import KmPercorsoInput from "./km-percorso-input";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const inputCls =
  "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const ORE_MEZZO_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const val = (i + 1) * 0.5;
  const h = Math.floor(val);
  const m = val % 1 !== 0;
  const label = h === 0 ? "30 min" : m ? `${h} h 30 min` : `${h} h`;
  return { value: val, label };
});

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

// Pannello conflitto renderizzato inline nel dialog di modifica,
// così non combatte mai con z-index o stacking context.
function ConflittoPannello({ conflitto, onClose }) {
  return (
    <motion.div
      key="conflitto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-5 py-6"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.12)" }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="text-center flex flex-col gap-2">
        <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
          Modifica rifiutata
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Il <strong>{fmtData(conflitto.data)}</strong> esiste già un turno
          dalle <strong>{conflitto.inizio}</strong> alle{" "}
          <strong>{conflitto.fine}</strong>.
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Gli orari si sovrappongono — puoi modificare il turno per iniziare
          dalle <strong>{conflitto.fine}</strong> in poi.
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClose}
        className="w-full py-2.5 rounded-xl font-semibold text-sm"
        style={{ background: "var(--primary)", color: "white" }}
      >
        Capito
      </motion.button>
    </motion.div>
  );
}

function FormModifica({ turno, onSuccess, onChiudi, bloccaData = false }) {
  const { cantieri, lavori, macchinari } = useApp();

  const [saving, setSaving] = useState(false);
  const [conflitto, setConflitto] = useState(null);
  const { meseMin, meseMax } = getMeseLimiti();
  const [usaMacchinario, setUsaMacchinario] = useState(!!turno.mezzo_id);
  const [usaKm, setUsaKm] = useState(!!turno.km_totale);

  const { register, handleSubmit, control, setValue } = useForm({
    mode: "onChange",
    shouldUnregister: true,
    defaultValues: {
      data: turno.data ?? "",
      cantiere_id: String(turno.cantiere_id ?? ""),
      lavoro_id: String(turno.lavoro_id ?? ""),
      macchinario_id: String(turno.mezzo_id ?? ""),
      ore_mezzo: turno.ore_mezzo ? String(turno.ore_mezzo) : "",
      inizio: turno.inizio ?? "",
      fine: turno.fine ?? "",
      note: turno.note ?? "",
      lavoro_finito: turno.lavoro_finito ?? null,
      km_percorso: turno.km_percorso ?? "",
      km_totale: turno.km_totale ? String(turno.km_totale) : "",
    },
  });

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
  const cantieriNormali = cantieri.filter((c) => !c.isAssenza);

  const campiBase =
    !!cantiere_id && !!lavoro_id && !!inizio && !!fine && minutiForm > 0;
  const campiMezzo = !usaMacchinario || (!!macchinario_id && !!ore_mezzo);
  const campiKm =
    !usaKm ||
    (!!(km_percorso ?? "").trim() && !!km_totale && parseFloat(km_totale) > 0);
  const canSubmit = isAssenza
    ? !!cantiere_id
    : campiBase && campiMezzo && campiKm;

  useEffect(() => {
    if (isAssenza) {
      setValue("lavoro_id", "");
      setValue("inizio", "");
      setValue("fine", "");
      setValue("note", "");
    }
  }, [isAssenza, setValue]);

  useEffect(() => {
    // eslint-disable-line react-hooks/set-state-in-effect
    if (!usaMacchinario) {
      setValue("macchinario_id", "");
      setValue("ore_mezzo", "");
      setValue("lavoro_finito", null);
    }
  }, [usaMacchinario, setValue]);

  useEffect(() => {
    // eslint-disable-line react-hooks/set-state-in-effect
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

    const result = await updateTurno(turno.id, {
      values,
      cantiereObj,
      macchinarioObj,
    });

    setSaving(false);

    if (!result.success) {
      if (result.error?.includes("TURNO_SOVRAPPOSTO")) {
        const [, inizio, fine] = result.error.split("|");
        setConflitto({ inizio, fine, data: values.data });
      } else {
        toast.error(result.error ?? "Errore modifica turno");
      }
      return;
    }

    toast.success("Turno modificato con successo!");
    onSuccess(result.data);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {conflitto ? (
        <ConflittoPannello
          key="conflitto"
          conflitto={conflitto}
          onClose={onChiudi}
        />
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            {/* Data */}
            <div className={fieldCls}>
              <label className={labelCls}>Data</label>
              <input
                type="date"
                {...register("data")}
                min={bloccaData ? meseMin : undefined}
                max={bloccaData ? meseMax : undefined}
                className={inputCls + " appearance-none min-w-0"}
              />
            </div>

            {/* Cantiere */}
            <div className={fieldCls}>
              <label className={labelCls}>Cantiere</label>
              <select {...register("cantiere_id")} className={inputCls}>
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

            {/* Tipo lavoro */}
            <FadeField show={!!(cantiere_id && !isAssenza)}>
              <div className={fieldCls}>
                <label className={labelCls}>Tipo Lavoro</label>
                <select {...register("lavoro_id")} className={inputCls}>
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

            {/* Orario */}
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

            {/* Ore calcolate */}
            <AnimatePresence>
              {minutiForm > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 8, rotateX: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 8 }}
                  transition={{ type: "spring", damping: 20, stiffness: 320 }}
                  className="rounded-lg p-4 text-center border-2"
                  style={{
                    borderColor: "var(--primary)",
                    background: "var(--primary-faint)",
                    transformPerspective: 700,
                  }}
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
                  <select {...register("macchinario_id")} className={inputCls}>
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
                  <select {...register("ore_mezzo")} className={inputCls}>
                    <option value="">Seleziona ore</option>
                    {ORE_MEZZO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                      <span className={labelCls + " shrink-0"}>
                        Lavoro finito
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value === true}
                          onChange={() =>
                            field.onChange(field.value === true ? null : true)
                          }
                          className="w-4 h-4 rounded accent-red-600"
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--text)" }}
                        >
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
                        <span
                          className="text-sm"
                          style={{ color: "var(--text)" }}
                        >
                          No
                        </span>
                      </label>
                    </div>
                  )}
                />
              </div>
            </FadeField>

            {/* Switch km */}
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
                  Rimborso chilometrico?
                </span>
                <Switch checked={usaKm} onChange={setUsaKm} />
              </div>
            </FadeField>

            {/* Percorso + km */}
            <FadeField show={!!(lavoro_id && usaKm)}>
              <div className="flex flex-col gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Percorso effettuato</label>
                  <Controller
                    name="km_percorso"
                    control={control}
                    render={({ field }) => (
                      <KmPercorsoInput
                        value={field.value}
                        onChange={field.onChange}
                        cantieri={cantieriNormali}
                      />
                    )}
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
                        onChange={(e) =>
                          field.onChange(e.target.value.replace(",", "."))
                        }
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
              disabled={saving || !canSubmit}
              className="w-full py-3 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              style={{
                background: saving ? "var(--primary-hover)" : "var(--primary)",
                transformPerspective: 600,
              }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Salvataggio...
                </span>
              ) : (
                "Salva Modifiche"
              )}
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FormModifica;
