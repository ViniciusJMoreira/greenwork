"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Users, Hammer, Wrench, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { insertCantiere, insertDipendente, insertLavoro, insertMacchinario } from "@/lib/actions";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";


function Sezione({ label, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-faint)" }}>
            <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Aggiungi {label}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}
          >
            <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormCantiere() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertCantiere(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Cantiere "${values.cantiere}" aggiunto!`);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={fieldCls}>
          <label className={labelCls}>Nome cantiere *</label>
          <input {...register("cantiere", { required: true })} placeholder="es. Rivazzurra" className={inputCls} />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>Codice cantiere *</label>
          <input {...register("cod_cantiere", { required: true })} placeholder="es. 004501V15813" className={inputCls} />
        </div>
      </div>
      <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi Cantiere" />
    </form>
  );
}

function FormDipendente() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertDipendente(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Dipendente "${values.nome} ${values.cognome}" aggiunto!`);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={fieldCls}>
          <label className={labelCls}>Nome *</label>
          <input {...register("nome", { required: true })} placeholder="es. Vinicius" className={inputCls} />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>Cognome *</label>
          <input {...register("cognome", { required: true })} placeholder="es. Moreira" className={inputCls} />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>Codice Dipendente *</label>
          <input {...register("pin", { required: true, minLength: 4 })} type="number" placeholder="es. 3621" className={inputCls} />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>Ruolo *</label>
          <select {...register("ruolo", { required: true })} className={inputCls}>
            <option value="">Seleziona ruolo</option>
            <option value="operaio">Operaio</option>
            <option value="responsabile">Responsabile</option>
          </select>
        </div>
      </div>
      <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi Dipendente" />
    </form>
  );
}

function FormLavoro() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertLavoro(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Tipo lavoro "${values.lavoro}" aggiunto!`);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className={fieldCls}>
        <label className={labelCls}>Nome tipo lavoro *</label>
        <input {...register("lavoro", { required: true })} placeholder="es. Manutenzione ordinaria" className={inputCls} />
      </div>
      <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi Tipo Lavoro" />
    </form>
  );
}

function FormMacchinario() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertMacchinario(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Macchinario "${values.mezzo}" aggiunto!`);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={fieldCls}>
          <label className={labelCls}>Nome macchinario *</label>
          <input {...register("mezzo", { required: true })} placeholder="es. Grillo FX27" className={inputCls} />
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>Codice mezzo *</label>
          <input {...register("cod_mezzo", { required: true })} placeholder="es. RS066" className={inputCls} />
        </div>
      </div>
      <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi Macchinario" />
    </form>
  );
}

function SubmitBtn({ saving, disabled, label }) {
  return (
    <motion.button
      type="submit"
      whileTap={{ scale: 0.97 }}
      disabled={saving || disabled}
      className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "var(--primary)" }}
    >
      {saving ? <span className="flex items-center justify-center gap-2"><Spinner /> Salvataggio...</span> : label}
    </motion.button>
  );
}

export default function TabAnagrafica() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Anagrafica</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Aggiungi cantieri, dipendenti, lavori e macchinari</p>
      </div>
      <Sezione id="cantiere"    label="Cantiere"    icon={Building2}><FormCantiere    /></Sezione>
      <Sezione id="dipendente"  label="Dipendente"  icon={Users}    ><FormDipendente  /></Sezione>
      <Sezione id="lavoro"      label="Tipo Lavoro" icon={Hammer}   ><FormLavoro      /></Sezione>
      <Sezione id="macchinario" label="Macchinario" icon={Wrench}   ><FormMacchinario /></Sezione>
    </div>
  );
}