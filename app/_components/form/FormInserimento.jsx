"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { calcMin, fmtOre } from "@/lib/utils";
import { useApp } from "@/app/_components/AppContext";
import { insertTurno } from "@/lib/actions";
import TimeSelect from "./TimeSelect";

// IDs dei lavori che richiedono macchinario
const LAVORI_CON_MEZZO = [8, 9, 10, 11, 12, 13, 14, 19]; // metti i tuoi ID
const CODICI_LETTERA = [76, 77, 78, 79, 80];

// Classi e stile comuni per tutti gli input/select del form
const inputCls =
  "w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-green-500";
const inputStyle = { background: "#374151" };

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
    shouldUnregister: true, // campi nascosti vengono rimossi dalla validazione
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
  const showMacchinari = LAVORI_CON_MEZZO.includes(Number(lavoro_id));
  const isAssenza = CODICI_LETTERA.includes(Number(cantiere_id));

  useEffect(() => {
    if (!showMacchinari) {
      setValue("macchinario_id", "");
      setValue("lavoro_finito", null);
    }
  }, [showMacchinari, setValue]);

  async function onSubmit(values) {
    setSaving(true);
    setErrore("");

    const cantiereObj = cantieri.find(
      (c) => c.id === Number(values.cantiere_id),
    );
    const macchinarioObj = macchinari.find(
      (m) => m.id === Number(values.macchinario_id),
    );
    const result = await insertTurno({
      values,
      cantiereObj,
      macchinarioObj,
      operaio,
    });

    if (!result.success) {
      setErrore(result.error ?? "Errore salvataggio");
      setSaving(false);
      return;
    }

    // Aggiunge il turno normalizzato al context senza reload
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-bold text-white">Inserisci Ore</h2>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Data</label>
        <input
          type="date"
          min={meseMin}
          max={meseMax}
          {...register("data", { required: true })}
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Cantiere</label>
        <select
          {...register("cantiere_id", { required: true })}
          className={inputCls}
          style={inputStyle}
        >
          <option value={""} disabled>
            Seleziona cantiere
          </option>
          {cantieri?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cantiere}
            </option>
          ))}
        </select>
      </div>

      {!isAssenza && (
        <>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Tipo Lavoro
            </label>
            <select
              {...register("lavoro_id", { required: true })}
              className={inputCls}
              style={inputStyle}
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
          {showMacchinari && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Macchinario
              </label>
              <select
                {...register("macchinario_id")}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Seleziona Macchinario</option>
                {macchinari?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mezzo} — {m.cod_mezzo}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Inizio
              </label>
              <Controller
                name="inizio"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TimeSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleziona ora"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Fine</label>
              <Controller
                name="fine"
                control={control}
                rules={{ required: true }}
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
          {/* Checkbox opzionale: lavoro finito sì/no */}
          {showMacchinari && (
            <Controller
              name="lavoro_finito"
              control={control}
              render={({ field }) => (
                <div
                  className="rounded-xl px-4 py-3 flex items-center gap-6"
                  style={{ background: "#374151" }}
                >
                  <span className="text-xs text-gray-400 shrink-0">
                    Lavoro finito
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value === true}
                      onChange={() =>
                        field.onChange(field.value === true ? null : true)
                      }
                      className="w-4 h-4 rounded accent-gray-400"
                    />
                    <span className="text-sm text-white">Sì</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value === false}
                      onChange={() =>
                        field.onChange(field.value === false ? null : false)
                      }
                      className="w-4 h-4 rounded accent-gray-400"
                    />
                    <span className="text-sm text-white">No</span>
                  </label>
                </div>
              )}
            />
          )}
          {minutiForm > 0 && (
            <div className="rounded-xl p-4 text-center border border-green-800 bg-green-950">
              <p className="text-xs text-green-400 mb-1">Ore calcolate</p>
              <p className="text-3xl font-black text-green-300">
                {fmtOre(minutiForm)}
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Note (opzionale)
            </label>
            <textarea
              {...register("note")}
              rows={2}
              placeholder="Aggiungi note..."
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={
          saving || (isAssenza ? !cantiere_id : !isValid || minutiForm <= 0)
        }
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40"
        style={{ background: "#16a34a" }}
      >
        {saving ? "Salvataggio..." : "💾 Salva Ore"}
      </button>

      {salvato && (
        <p className="text-center text-sm font-medium text-green-400">
          ✓ Salvato con successo!
        </p>
      )}
      {errore && (
        <p className="text-center text-sm font-medium text-red-400">
          ✗ {errore}
        </p>
      )}
    </form>
  );
}

export default FormInserimento;
