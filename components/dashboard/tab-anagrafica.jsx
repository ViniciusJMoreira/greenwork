"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Users, Hammer, Tractor, ChevronDown,
  BriefcaseMedical, Pencil, X, Plus, Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  insertCantiere, insertDipendente, insertLavoro, insertMacchinario,
  updateCantiere, updateDipendente, updateLavoro, updateMacchinario,
  deleteCantiere, deleteDipendente, deleteLavoro, deleteMacchinario,
} from "@/lib/actions";
import toast from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";

const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none border transition-colors bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
const labelCls = "text-xs font-medium text-[var(--text-muted)]";
const fieldCls = "flex flex-col gap-1.5";

function SezioneConLista({ label, icon: Icon, count, children }) {
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
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
            {count}
          </span>
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
            <div className="border-t divide-y" style={{ borderColor: "var(--border)", divideColor: "var(--border)" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitBtn({ saving, disabled, label }) {
  return (
    <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving || disabled}
      className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "var(--primary)" }}
    >
      {saving ? <span className="flex items-center gap-2"><Spinner /> Salvataggio...</span> : label}
    </motion.button>
  );
}

function CancelBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>
      Annulla
    </button>
  );
}

function EditToggleBtn({ isEditing, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="p-1.5 rounded-lg shrink-0 transition-colors"
      style={{ color: isEditing ? "var(--primary)" : "var(--text-muted)", background: "var(--bg-subtle)" }}
    >
      {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
    </button>
  );
}

// Doppio click: prima conferma (rosso), poi elimina
function DeleteBtn({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  // Reset conferma se si allontana il mouse
  function handleBlur() { setConfirm(false); }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={handleBlur}
      disabled={deleting}
      className="p-1.5 rounded-lg shrink-0 transition-all text-xs font-semibold flex items-center gap-1"
      style={{
        color: confirm ? "white" : "#ef4444",
        background: confirm ? "#ef4444" : "transparent",
        border: `1px solid ${confirm ? "#ef4444" : "#ef444433"}`,
        minWidth: confirm ? 72 : undefined,
      }}
    >
      {deleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
      {confirm && !deleting && <span>Conferma</span>}
    </button>
  );
}

function Switch({ checked, onChange }) {
  return (
    <motion.button type="button" onClick={() => onChange(!checked)} whileTap={{ scale: 0.9 }}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ background: checked ? "var(--primary)" : "var(--border-strong)" }}
    >
      <motion.span animate={{ x: checked ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

function AddRowBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
      style={{ color: "var(--primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Plus className="h-4 w-4" /> Aggiungi nuovo
    </button>
  );
}

// ── DIPENDENTI ────────────────────────────────────────────────────────────────

function DipendenteRow({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { nome: item.nome, cognome: item.cognome, pin: item.pin, ruolo: item.ruolo },
  });

  async function onSubmit(values) {
    setSaving(true);
    const res = await updateDipendente(item.id, values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore aggiornamento");
    toast.success("Dipendente aggiornato");
    onSaved(res.data);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
            {item.nome} {item.cognome}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            PIN: <span className="font-mono">{item.pin}</span> · {item.ruolo}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DeleteBtn onDelete={async () => {
            const res = await deleteDipendente(item.id);
            if (!res.success) {
              const msg = res.error?.includes("foreign key")
                ? "Impossibile eliminare: ci sono turni associati a questo dipendente"
                : (res.error ?? "Errore eliminazione");
              return toast.error(msg, { duration: 4000 });
            }
            toast.success("Dipendente eliminato");
            onDeleted(item.id);
          }} />
          <EditToggleBtn isEditing={editing} onClick={() => setEditing((v) => !v)} />
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.form
            key="edit"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="px-4 pb-3 pt-2 flex flex-col gap-3" style={{ background: "var(--bg-subtle)" }}>
              <div className="grid grid-cols-2 gap-2">
                <div className={fieldCls}><label className={labelCls}>Nome</label><input {...register("nome", { required: true })} className={inputCls} /></div>
                <div className={fieldCls}><label className={labelCls}>Cognome</label><input {...register("cognome", { required: true })} className={inputCls} /></div>
                <div className={fieldCls}><label className={labelCls}>PIN</label><input {...register("pin", { required: true })} type="number" className={inputCls} /></div>
                <div className={fieldCls}>
                  <label className={labelCls}>Ruolo</label>
                  <select {...register("ruolo", { required: true })} className={inputCls}>
                    <option value="operaio">Operaio</option>
                    <option value="responsabile">Responsabile</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <SubmitBtn saving={saving} disabled={!isValid} label="Salva modifiche" />
                <CancelBtn onClick={() => setEditing(false)} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function DipendenteAddForm({ onAdded }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertDipendente(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Dipendente aggiunto`);
    onAdded(res.data);
    reset();
    setShow(false);
  }

  if (!show) return <AddRowBtn onClick={() => setShow(true)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 flex flex-col gap-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Nuovo Dipendente</p>
      <div className="grid grid-cols-2 gap-2">
        <div className={fieldCls}><label className={labelCls}>Nome *</label><input {...register("nome", { required: true })} placeholder="es. Mario" className={inputCls} /></div>
        <div className={fieldCls}><label className={labelCls}>Cognome *</label><input {...register("cognome", { required: true })} placeholder="es. Rossi" className={inputCls} /></div>
        <div className={fieldCls}><label className={labelCls}>PIN *</label><input {...register("pin", { required: true })} type="number" placeholder="es. 3621" className={inputCls} /></div>
        <div className={fieldCls}>
          <label className={labelCls}>Ruolo *</label>
          <select {...register("ruolo", { required: true })} className={inputCls}>
            <option value="">Seleziona</option>
            <option value="operaio">Operaio</option>
            <option value="responsabile">Responsabile</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi" />
        <CancelBtn onClick={() => { reset(); setShow(false); }} />
      </div>
    </form>
  );
}

function SezioneDipendenti({ dipendenti: initData }) {
  const [items, setItems] = useState(initData ?? []);
  function onSaved(updated) { setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); }
  function onAdded(item) { setItems((prev) => [...prev, item]); }
  function onDeleted(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  return (
    <SezioneConLista label="Dipendenti" icon={Users} count={items.length}>
      <DipendenteAddForm onAdded={onAdded} />
      {items.map((item) => (
        <DipendenteRow key={item.id} item={item} onSaved={onSaved} onDeleted={onDeleted} />
      ))}
    </SezioneConLista>
  );
}

// ── CANTIERI ──────────────────────────────────────────────────────────────────

function CantiereRow({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAssenza, setIsAssenza] = useState(!!item.isAssenza);
  const { register, handleSubmit, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { cantiere: item.cantiere, cod_cantiere: item.cod_cantiere },
  });

  async function onSubmit(values) {
    setSaving(true);
    const res = await updateCantiere(item.id, { ...values, isAssenza });
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore aggiornamento");
    toast.success("Cantiere aggiornato");
    onSaved(res.data);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{item.cantiere}</p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {item.cod_cantiere}
            {item.isAssenza && <span className="ml-2 non-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--primary-faint)", color: "var(--primary)" }}>Assenza</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DeleteBtn onDelete={async () => {
            const res = await deleteCantiere(item.id);
            if (!res.success) {
              const msg = res.error?.includes("foreign key")
                ? "Impossibile eliminare: ci sono turni associati a questo cantiere"
                : (res.error ?? "Errore eliminazione");
              return toast.error(msg, { duration: 4000 });
            }
            toast.success("Cantiere eliminato");
            onDeleted(item.id);
          }} />
          <EditToggleBtn isEditing={editing} onClick={() => setEditing((v) => !v)} />
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.form
            key="edit"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="px-4 pb-3 pt-2 flex flex-col gap-3" style={{ background: "var(--bg-subtle)" }}>
              <div className="grid grid-cols-2 gap-2">
                <div className={fieldCls}><label className={labelCls}>Nome cantiere</label><input {...register("cantiere", { required: true })} className={inputCls} /></div>
                <div className={fieldCls}><label className={labelCls}>Codice</label><input {...register("cod_cantiere", { required: true })} className={inputCls} /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
                style={{ background: isAssenza ? "var(--primary-faint)" : "transparent", borderColor: isAssenza ? "var(--primary)" : "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <BriefcaseMedical className="h-4 w-4" style={{ color: isAssenza ? "var(--primary)" : "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: isAssenza ? "var(--primary)" : "var(--text)" }}>Giornata fuori cantiere</span>
                </div>
                <Switch checked={isAssenza} onChange={setIsAssenza} />
              </div>
              <div className="flex gap-2">
                <SubmitBtn saving={saving} disabled={!isValid} label="Salva modifiche" />
                <CancelBtn onClick={() => setEditing(false)} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function CantiereAddForm({ onAdded }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAssenza, setIsAssenza] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertCantiere({ ...values, isAssenza });
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Cantiere aggiunto`);
    onAdded(res.data);
    reset();
    setIsAssenza(false);
    setShow(false);
  }

  if (!show) return <AddRowBtn onClick={() => setShow(true)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 flex flex-col gap-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Nuovo Cantiere</p>
      <div className="grid grid-cols-2 gap-2">
        <div className={fieldCls}><label className={labelCls}>Nome cantiere *</label><input {...register("cantiere", { required: true })} placeholder="es. Rivazzurra" className={inputCls} /></div>
        <div className={fieldCls}><label className={labelCls}>Codice *</label><input {...register("cod_cantiere", { required: true })} placeholder="es. 004501V15813" className={inputCls} /></div>
      </div>
      <div className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
        style={{ background: isAssenza ? "var(--primary-faint)" : "transparent", borderColor: isAssenza ? "var(--primary)" : "var(--border)" }}>
        <div className="flex items-center gap-2">
          <BriefcaseMedical className="h-4 w-4" style={{ color: isAssenza ? "var(--primary)" : "var(--text-muted)" }} />
          <span className="text-sm" style={{ color: isAssenza ? "var(--primary)" : "var(--text)" }}>Giornata fuori cantiere</span>
        </div>
        <Switch checked={isAssenza} onChange={setIsAssenza} />
      </div>
      <div className="flex gap-2">
        <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi" />
        <CancelBtn onClick={() => { reset(); setIsAssenza(false); setShow(false); }} />
      </div>
    </form>
  );
}

function SezioneCantieri({ cantieri: initData }) {
  const [items, setItems] = useState(initData ?? []);
  function onSaved(updated) { setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); }
  function onAdded(item) { setItems((prev) => [...prev, item]); }
  function onDeleted(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  return (
    <SezioneConLista label="Cantieri" icon={Building2} count={items.length}>
      <CantiereAddForm onAdded={onAdded} />
      {items.map((item) => (
        <CantiereRow key={item.id} item={item} onSaved={onSaved} onDeleted={onDeleted} />
      ))}
    </SezioneConLista>
  );
}

// ── LAVORI ────────────────────────────────────────────────────────────────────

function LavoroRow({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { lavoro: item.lavoro },
  });

  async function onSubmit(values) {
    setSaving(true);
    const res = await updateLavoro(item.id, values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore aggiornamento");
    toast.success("Lavoro aggiornato");
    onSaved(res.data);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <p className="text-sm flex-1 truncate" style={{ color: "var(--text)" }}>{item.lavoro}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <DeleteBtn onDelete={async () => {
            const res = await deleteLavoro(item.id);
            if (!res.success) return toast.error(res.error ?? "Errore");
            toast.success("Lavoro eliminato");
            onDeleted(item.id);
          }} />
          <EditToggleBtn isEditing={editing} onClick={() => setEditing((v) => !v)} />
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.form
            key="edit"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="px-4 pb-3 pt-2 flex flex-col gap-3" style={{ background: "var(--bg-subtle)" }}>
              <div className={fieldCls}><label className={labelCls}>Nome lavoro</label><input {...register("lavoro", { required: true })} className={inputCls} /></div>
              <div className="flex gap-2">
                <SubmitBtn saving={saving} disabled={!isValid} label="Salva modifiche" />
                <CancelBtn onClick={() => setEditing(false)} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function LavoroAddForm({ onAdded }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertLavoro(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Tipo lavoro aggiunto`);
    onAdded(res.data);
    reset();
    setShow(false);
  }

  if (!show) return <AddRowBtn onClick={() => setShow(true)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 flex flex-col gap-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Nuovo Tipo Lavoro</p>
      <div className={fieldCls}><label className={labelCls}>Nome *</label><input {...register("lavoro", { required: true })} placeholder="es. Manutenzione ordinaria" className={inputCls} /></div>
      <div className="flex gap-2">
        <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi" />
        <CancelBtn onClick={() => { reset(); setShow(false); }} />
      </div>
    </form>
  );
}

function SezioneLavori({ lavori: initData }) {
  const [items, setItems] = useState(initData ?? []);
  function onSaved(updated) { setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); }
  function onAdded(item) { setItems((prev) => [...prev, item]); }
  function onDeleted(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  return (
    <SezioneConLista label="Tipi di Lavoro" icon={Hammer} count={items.length}>
      <LavoroAddForm onAdded={onAdded} />
      {items.map((item) => (
        <LavoroRow key={item.id} item={item} onSaved={onSaved} onDeleted={onDeleted} />
      ))}
    </SezioneConLista>
  );
}

// ── MACCHINARI ────────────────────────────────────────────────────────────────

function MacchinarioRow({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { mezzo: item.mezzo, cod_mezzo: item.cod_mezzo },
  });

  async function onSubmit(values) {
    setSaving(true);
    const res = await updateMacchinario(item.id, values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore aggiornamento");
    toast.success("Macchinario aggiornato");
    onSaved(res.data);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{item.mezzo}</p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{item.cod_mezzo}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DeleteBtn onDelete={async () => {
            const res = await deleteMacchinario(item.id);
            if (!res.success) return toast.error(res.error ?? "Errore");
            toast.success("Macchinario eliminato");
            onDeleted(item.id);
          }} />
          <EditToggleBtn isEditing={editing} onClick={() => setEditing((v) => !v)} />
        </div>
      </div>
      <AnimatePresence>
        {editing && (
          <motion.form
            key="edit"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="px-4 pb-3 pt-2 flex flex-col gap-3" style={{ background: "var(--bg-subtle)" }}>
              <div className="grid grid-cols-2 gap-2">
                <div className={fieldCls}><label className={labelCls}>Nome macchinario</label><input {...register("mezzo", { required: true })} className={inputCls} /></div>
                <div className={fieldCls}><label className={labelCls}>Codice mezzo</label><input {...register("cod_mezzo", { required: true })} className={inputCls} /></div>
              </div>
              <div className="flex gap-2">
                <SubmitBtn saving={saving} disabled={!isValid} label="Salva modifiche" />
                <CancelBtn onClick={() => setEditing(false)} />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function MacchinarioAddForm({ onAdded }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: "onChange" });

  async function onSubmit(values) {
    setSaving(true);
    const res = await insertMacchinario(values);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Errore inserimento");
    toast.success(`Macchinario aggiunto`);
    onAdded(res.data);
    reset();
    setShow(false);
  }

  if (!show) return <AddRowBtn onClick={() => setShow(true)} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 flex flex-col gap-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Nuovo Macchinario</p>
      <div className="grid grid-cols-2 gap-2">
        <div className={fieldCls}><label className={labelCls}>Nome *</label><input {...register("mezzo", { required: true })} placeholder="es. Grillo FX27" className={inputCls} /></div>
        <div className={fieldCls}><label className={labelCls}>Codice *</label><input {...register("cod_mezzo", { required: true })} placeholder="es. RS066" className={inputCls} /></div>
      </div>
      <div className="flex gap-2">
        <SubmitBtn saving={saving} disabled={!isValid} label="Aggiungi" />
        <CancelBtn onClick={() => { reset(); setShow(false); }} />
      </div>
    </form>
  );
}

function SezioneMacchinari({ macchinari: initData }) {
  const [items, setItems] = useState(initData ?? []);
  function onSaved(updated) { setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); }
  function onAdded(item) { setItems((prev) => [...prev, item]); }
  function onDeleted(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  return (
    <SezioneConLista label="Macchinari" icon={Tractor} count={items.length}>
      <MacchinarioAddForm onAdded={onAdded} />
      {items.map((item) => (
        <MacchinarioRow key={item.id} item={item} onSaved={onSaved} onDeleted={onDeleted} />
      ))}
    </SezioneConLista>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export default function TabAnagrafica({ dipendenti, cantieri, lavori, macchinari }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Anagrafica</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Visualizza, modifica e aggiungi cantieri, dipendenti, lavori e macchinari
        </p>
      </div>
      <SezioneDipendenti dipendenti={dipendenti} />
      <SezioneCantieri cantieri={cantieri} />
      <SezioneLavori lavori={lavori} />
      <SezioneMacchinari macchinari={macchinari} />
    </div>
  );
}