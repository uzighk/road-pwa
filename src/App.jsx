import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Flame, Zap, Clipboard, CheckCircle, Circle,
  Trash2, Plus, Calendar, Save, Download, Upload,
  TrendingUp, Award, MoreHorizontal,
  ListTodo, RotateCcw, X, RefreshCw, Search,
  Timer, Play, Pause, Square,
  Activity, CalendarClock, ChevronRight, ChevronDown,
  GripVertical, AlertTriangle, Keyboard, Pencil, Coffee,
  Map, Route, Target, Flag, Milestone, CircleDot, Clock
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import confetti from 'canvas-confetti'
const APP_VERSION = '3.9.0'
const APP_NAME = 'Road Checklist'
const API_URL = 'https://api.road.centralraposa.com'
const WS_URL = 'wss://api.road.centralraposa.com/ws'

/* ═══════════════════════════════════════════
   POMODORO CONFIG
   ═══════════════════════════════════════════ */
const POMODORO_WORK_SECONDS = 25 * 60  // 25 minutos
const POMODORO_BREAK_SECONDS = 5 * 60  // 5 minutos

/* ═══════════════════════════════════════════
   CATEGORIAS DISPONÍVEIS
   ═══════════════════════════════════════════ */
const CATEGORIAS = [
  { key: 'geral', label: 'Geral', color: 'hsl(0,0%,50%)' },
  { key: 'cliente', label: 'Cliente', color: 'hsl(24,100%,50%)' },
  { key: 'interno', label: 'Interno', color: 'hsl(200,80%,55%)' },
  { key: 'urgente', label: 'Urgente', color: 'hsl(0,70%,55%)' },
  { key: 'pessoal', label: 'Pessoal', color: 'hsl(280,60%,55%)' },
]

/* ═══════════════════════════════════════════
   DADOS INICIAIS
   ═══════════════════════════════════════════ */
const tarefasIniciais = [
  { id: 1, titulo: 'Ajustar Linkwin Carrinho Interceptado via Wix VELO', descricao: '', concluida: false, prioridade: 'alta', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 2, titulo: 'Ajustar Site da Iskynet criando páginas que faltam', descricao: '', concluida: false, prioridade: 'alta', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 3, titulo: 'Criar Página da HomeGamers via Wix Vibes', descricao: '', concluida: false, prioridade: 'media', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 4, titulo: 'Ajustar Página de Frases do Gnomus Bowls', descricao: '', concluida: false, prioridade: 'media', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 5, titulo: 'Adicionar Domínio do Encontralar', descricao: '', concluida: false, prioridade: 'alta', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 6, titulo: 'Finalizar Orçamento do Rúben e Enviar (Bot + Site)', descricao: '', concluida: false, prioridade: 'alta', categoria: 'cliente', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
  { id: 7, titulo: 'Criar Contratos dos novos Vendedores', descricao: '', concluida: false, prioridade: 'media', categoria: 'interno', dataAdicionada: new Date().toISOString(), dataEntrega: null, subtarefas: [] },
]

/* ═══════════════════════════════════════════
   HELPERS (stable — never re-created)
   ═══════════════════════════════════════════ */
const getDeadlineInfo = (dataEntrega) => {
  if (!dataEntrega) return null
  const date = new Date(dataEntrega)
  if (isPast(date) && !isToday(date)) return { label: 'Atrasado', color: 'hsl(0,70%,55%)', urgent: true }
  if (isToday(date)) return { label: 'Hoje', color: 'hsl(24,100%,50%)', urgent: true }
  if (isTomorrow(date)) return { label: 'Amanhã', color: 'hsl(45,100%,50%)', urgent: false }
  const days = differenceInDays(date, new Date())
  if (days <= 3) return { label: `${days}d`, color: 'hsl(45,100%,50%)', urgent: false }
  return { label: format(date, 'dd/MM'), color: 'hsl(0,0%,45%)', urgent: false }
}

const getCategoriaColor = (key) => CATEGORIAS.find(c => c.key === key)?.color || 'hsl(0,0%,50%)'
const getCategoriaLabel = (key) => CATEGORIAS.find(c => c.key === key)?.label || key
const getPrioridadeClass = (p) => p === 'alta' ? 'priority-alta' : p === 'baixa' ? 'priority-baixa' : 'priority-media'
const getPrioridadeAccent = (p) => p === 'alta' ? 'hsl(24,100%,50%)' : p === 'baixa' ? 'hsl(200,80%,55%)' : 'hsl(45,100%,50%)'

/* ═══════════════════════════════════════════
   CUSTOM SPARKLE ICON (better than lucide)
   ═══════════════════════════════════════════ */
const SparkleIcon = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" fillOpacity="0.9"/>
    <path d="M19 4L19.8 6.2L22 7L19.8 7.8L19 10L18.2 7.8L16 7L18.2 6.2L19 4Z" fill="currentColor" fillOpacity="0.7"/>
    <path d="M7 16L7.6 17.4L9 18L7.6 18.6L7 20L6.4 18.6L5 18L6.4 17.4L7 16Z" fill="currentColor" fillOpacity="0.6"/>
  </svg>
)

/* ═══════════════════════════════════════════
   THROTTLE UTIL
   ═══════════════════════════════════════════ */
function useThrottle(fn, delay) {
  const lastRun = useRef(0)
  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastRun.current >= delay) {
      lastRun.current = now
      fn(...args)
    }
  }, [fn, delay])
}

/* ═══════════════════════════════════════════
   SUBTASK INPUT (isolated — own state)
   ═══════════════════════════════════════════ */
function SubtaskInput({ onAdd }) {
  const [value, setValue] = useState('')
  const handleSubmit = () => {
    if (value.trim()) { onAdd(value.trim()); setValue('') }
  }
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Nova subtarefa..." className="input-glass"
        style={{ fontSize: '12px', padding: '8px 12px' }} />
      <button onClick={handleSubmit}
        style={{ background: 'hsla(24,100%,50%,0.1)', border: '1px solid hsla(24,100%,50%,0.2)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'hsl(24,100%,55%)', flexShrink: 0 }}>
        <Plus size={14} />
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   TASK CARD
   ═══════════════════════════════════════════ */
function TaskCard({
  tarefa, isExpanded,
  onToggle, onRemove, onExpand, onDescricao,
  onAddSub, onToggleSub, onRemoveSub, onEdit,
  onAddWorkedTime
}) {
  const [showChecklist, setShowChecklist] = useState(false)
  const deadline = getDeadlineInfo(tarefa.dataEntrega)
  const subTotal = tarefa.subtarefas?.length || 0
  const subProgress = subTotal ? tarefa.subtarefas.filter(s => s.concluida).length : 0
  const accentColor = tarefa.concluida ? 'hsl(140,60%,50%)' : getPrioridadeAccent(tarefa.prioridade)

  // ── Drag Controls (long press to drag) ──
  const dragControls = useDragControls()
  const [isDragEnabled, setIsDragEnabled] = useState(false)
  const longPressTimer = useRef(null)

  const handlePointerDown = (e) => {
    longPressTimer.current = setTimeout(() => {
      setIsDragEnabled(true)
      dragControls.start(e)
      // Vibrate on mobile if supported
      if (navigator.vibrate) navigator.vibrate(50)
    }, 200)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    // Reset drag state after a short delay
    setTimeout(() => setIsDragEnabled(false), 100)
  }

  // ── Pomodoro State (interno ao card) ──
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState('work') // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_WORK_SECONDS)
  const [paused, setPaused] = useState(false)

  const totalSeconds = pomodoroMode === 'work' ? POMODORO_WORK_SECONDS : POMODORO_BREAK_SECONDS
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100

  // Timer effect
  useEffect(() => {
    if (!pomodoroActive || paused) return

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Ciclo acabou
          if (pomodoroMode === 'work') {
            // Adiciona tempo trabalhado
            onAddWorkedTime(tarefa.id, POMODORO_WORK_SECONDS)
            // Notifica e muda para break
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pomodoro concluído!', { body: 'Hora da pausa de 5 minutos.' })
            }
            setPomodoroMode('break')
            return POMODORO_BREAK_SECONDS
          } else {
            // Notifica e muda para work
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pausa acabou!', { body: 'Volta ao trabalho!' })
            }
            setPomodoroMode('work')
            return POMODORO_WORK_SECONDS
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [pomodoroActive, paused, pomodoroMode, tarefa.id, onAddWorkedTime])

  const startPomodoro = () => {
    setPomodoroActive(true)
    setPomodoroMode('work')
    setSecondsLeft(POMODORO_WORK_SECONDS)
    setPaused(false)
    // Pedir permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const stopPomodoro = () => {
    setPomodoroActive(false)
    setPomodoroMode('work')
    setSecondsLeft(POMODORO_WORK_SECONDS)
    setPaused(false)
  }

  const togglePause = () => setPaused(p => !p)

  const formatTime = (s) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatWorkedTime = (s) => {
    if (!s || s <= 0) return null
    const hours = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    if (hours > 0) return `${hours}h${mins > 0 ? mins + 'm' : ''}`
    return `${mins}m`
  }

  const pomodoroColor = pomodoroMode === 'work' ? 'hsl(24,100%,50%)' : 'hsl(140,60%,50%)'
  const workedTimeDisplay = formatWorkedTime(tarefa.totalWorkedSeconds)

  return (
    <Reorder.Item value={tarefa}
      dragListener={false}
      dragControls={dragControls}
      className={`card-surface ${tarefa.concluida ? 'card-completed' : ''} ${isExpanded ? 'card-expanded' : ''} ${isDragEnabled ? 'dragging' : ''}`}
      style={{
        borderRadius: 'clamp(16px,3vw,22px)', padding: 'clamp(20px,4vw,28px)', cursor: isDragEnabled ? 'grabbing' : 'default', listStyle: 'none',
        '--card-accent': accentColor,
        borderColor: deadline?.urgent && !tarefa.concluida ? `${deadline.color}33` : undefined,
        touchAction: 'pan-y',
      }}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 50 }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(10px,2vw,14px)' }}>
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ color: isDragEnabled ? 'hsl(24,100%,50%)' : 'hsl(0,0%,20%)', cursor: 'grab', padding: '6px', marginTop: '0px', flexShrink: 0, touchAction: 'none', transition: 'color 0.15s' }}>
          <GripVertical size={16} />
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onToggle(tarefa.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0, marginTop: '1px', display: 'flex' }}>
          {tarefa.concluida ? <CheckCircle size={20} style={{ color: 'hsl(140,60%,50%)' }} /> : <Circle size={20} style={{ color: 'hsl(0,0%,28%)' }} />}
        </motion.button>
        <p style={{ flex: 1, minWidth: 0, fontSize: 'clamp(14px,2vw,16px)', fontWeight: 600, color: tarefa.concluida ? 'hsl(0,0%,40%)' : 'hsl(0,0%,92%)', textDecoration: tarefa.concluida ? 'line-through' : 'none', lineHeight: 1.4, wordBreak: 'break-word', margin: 0, paddingRight: '8px' }}>
          {tarefa.titulo}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'clamp(10px,2vw,14px)', flexWrap: 'wrap', paddingLeft: 'clamp(36px,5vw,48px)' }}>
        <span className={getPrioridadeClass(tarefa.prioridade)} style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {tarefa.prioridade === 'alta' ? <Flame size={11} /> : tarefa.prioridade === 'baixa' ? <Clipboard size={11} /> : <Zap size={11} />}
          {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
        </span>
        <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: `${getCategoriaColor(tarefa.categoria)}15`, color: getCategoriaColor(tarefa.categoria), border: `1px solid ${getCategoriaColor(tarefa.categoria)}25`, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {getCategoriaLabel(tarefa.categoria)}
        </span>
        {tarefa.dataEntrega && (
          <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: deadline?.urgent ? `${deadline.color}15` : 'hsla(0,0%,100%,0.04)', border: `1px solid ${deadline?.urgent ? `${deadline.color}30` : 'hsla(0,0%,100%,0.08)'}`, color: deadline?.color || 'hsl(0,0%,50%)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {deadline?.urgent && <AlertTriangle size={10} />}
            <CalendarClock size={10} />
            {deadline?.label || format(new Date(tarefa.dataEntrega), 'dd/MM')}
          </span>
        )}
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        marginTop: 'clamp(10px,2vw,14px)',
        marginLeft: 'calc(-1 * clamp(20px,4vw,28px))',
        marginRight: 'calc(-1 * clamp(20px,4vw,28px))',
        marginBottom: (showChecklist && subTotal > 0) || isExpanded ? '0' : 'calc(-1 * clamp(20px,4vw,28px))',
        padding: '6px clamp(12px,2.5vw,20px)',
        background: 'hsla(0,0%,100%,0.02)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
        borderRadius: (showChecklist && subTotal > 0) || isExpanded ? '0' : '0 0 clamp(15px,2.8vw,21px) clamp(15px,2.8vw,21px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Barra de progresso como background da toolbar inteira */}
        {pomodoroActive && (
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${progressPercent}%`,
            background: pomodoroMode === 'work'
              ? 'hsla(24,100%,50%,0.15)'
              : 'hsla(140,60%,50%,0.15)',
            transition: 'width 1s linear',
            pointerEvents: 'none',
          }} />
        )}

        {/* ESQUERDA: Pomodoro controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
          {!tarefa.concluida && (
            pomodoroActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pomodoroMode === 'work' ? <Flame size={12} style={{ color: pomodoroColor }} /> : <Coffee size={12} style={{ color: pomodoroColor }} />}
                <span style={{ fontSize: '11px', fontWeight: 700, color: pomodoroColor, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(secondsLeft)}
                </span>
                <button onClick={(e) => { e.stopPropagation(); togglePause() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: pomodoroColor }}>
                  {paused ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); stopPomodoro() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'hsl(0,60%,55%)' }}>
                  <Square size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={(e) => { e.stopPropagation(); startPomodoro() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.15s', color: 'hsl(0,0%,40%)', fontSize: '10px', fontWeight: 600, fontFamily: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(24,100%,50%,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Iniciar Pomodoro">
                  <Timer size={11} style={{ color: 'hsl(24,100%,55%)' }} />
                </button>
                {workedTimeDisplay && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(200,80%,55%)' }}>
                    {workedTimeDisplay}
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {/* DIREITA: Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative', zIndex: 1 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onEdit(tarefa) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(24,100%,50%,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Editar">
            <Pencil size={11} style={{ color: 'hsl(24,100%,55%)' }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onRemove(tarefa.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(0,70%,50%,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Remover">
            <Trash2 size={11} style={{ color: 'hsl(0,60%,55%)' }} />
          </motion.button>
          {subTotal > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setShowChecklist(!showChecklist) }}
              style={{ background: showChecklist ? 'hsla(140,60%,50%,0.1)' : 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.15s', color: showChecklist ? 'hsl(140,60%,50%)' : 'hsl(0,0%,40%)', fontSize: '10px', fontWeight: 600, fontFamily: 'inherit' }}
              onMouseEnter={(e) => !showChecklist && (e.currentTarget.style.background = 'hsla(0,0%,100%,0.05)')}
              onMouseLeave={(e) => !showChecklist && (e.currentTarget.style.background = 'none')} title={showChecklist ? 'Esconder' : 'Checklist'}>
              <ListTodo size={11} /><span>{subProgress}/{subTotal}</span>
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onExpand(tarefa.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(0,0%,100%,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Detalhes">
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
              <ChevronRight size={12} style={{ color: 'hsl(0,0%,35%)' }} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Checklist Inline */}
      <AnimatePresence>
        {showChecklist && subTotal > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginLeft: 'calc(-1 * clamp(20px,4vw,28px))', marginRight: 'calc(-1 * clamp(20px,4vw,28px))', marginBottom: 'calc(-1 * clamp(20px,4vw,28px))', marginTop: '0' }}>
            <div style={{ background: 'hsla(0,0%,0%,0.15)', borderTop: '1px solid hsla(0,0%,100%,0.03)', borderRadius: '0 0 clamp(15px,2.8vw,21px) clamp(15px,2.8vw,21px)', padding: 'clamp(10px,2vw,14px) clamp(16px,3vw,24px)' }}>
              {(tarefa.subtarefas || []).map(sub => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                  <button onClick={(e) => { e.stopPropagation(); onToggleSub(tarefa.id, sub.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {sub.concluida ? <CheckCircle size={13} style={{ color: 'hsl(140,60%,50%)' }} /> : <Circle size={13} style={{ color: 'hsl(0,0%,28%)' }} />}
                  </button>
                  <span style={{ fontSize: '12px', color: sub.concluida ? 'hsl(0,0%,35%)' : 'hsl(0,0%,65%)', textDecoration: sub.concluida ? 'line-through' : 'none', flex: 1 }}>{sub.texto || sub.titulo}</span>
                  <button onClick={(e) => { e.stopPropagation(); onRemoveSub(tarefa.id, sub.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'hsl(0,60%,55%)', opacity: 0.4, transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginLeft: 'calc(-1 * clamp(20px,4vw,28px))', marginRight: 'calc(-1 * clamp(20px,4vw,28px))', marginBottom: 'calc(-1 * clamp(20px,4vw,28px))' }}>
            <div style={{ background: 'hsla(0,0%,0%,0.12)', borderTop: '1px solid hsla(0,0%,100%,0.03)', borderRadius: '0 0 clamp(15px,2.8vw,21px) clamp(15px,2.8vw,21px)', padding: 'clamp(14px,2.5vw,20px) clamp(16px,3vw,24px)' }}>
              <textarea value={tarefa.descricao} onChange={(e) => onDescricao(tarefa.id, e.target.value)}
                onClick={(e) => e.stopPropagation()} placeholder="Adicione uma descrição..."
                className="input-glass" style={{ resize: 'none', minHeight: '80px', fontSize: 'clamp(13px,1.6vw,14px)', marginBottom: 'clamp(14px,2.5vw,18px)' }} rows={3} />
              <div style={{ marginBottom: 'clamp(14px,2.5vw,18px)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(0,0%,50%)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Subtarefas {subTotal > 0 && <span style={{ fontSize: '10px', color: subProgress === subTotal ? 'hsl(140,60%,50%)' : 'hsl(0,0%,35%)', fontWeight: 600 }}>({subProgress}/{subTotal})</span>}
                </div>
                {(tarefa.subtarefas || []).map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid hsla(0,0%,100%,0.03)' }}>
                    <button onClick={(e) => { e.stopPropagation(); onToggleSub(tarefa.id, sub.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      {sub.concluida ? <CheckCircle size={15} style={{ color: 'hsl(140,60%,50%)' }} /> : <Circle size={15} style={{ color: 'hsl(0,0%,28%)' }} />}
                    </button>
                    <span style={{ fontSize: '13px', color: sub.concluida ? 'hsl(0,0%,35%)' : 'hsl(0,0%,75%)', textDecoration: sub.concluida ? 'line-through' : 'none', flex: 1 }}>{sub.texto || sub.titulo}</span>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveSub(tarefa.id, sub.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'hsl(0,60%,55%)', opacity: 0.5, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <SubtaskInput onAdd={(titulo) => onAddSub(tarefa.id, titulo)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

/* ═══════════════════════════════════════════
   ROADMAP PROJECT STATUS HELPERS
   ═══════════════════════════════════════════ */
const PROJECT_STATUS = {
  planning: { label: 'Planejamento', color: 'hsl(280,60%,55%)', bg: 'hsla(280,60%,55%,0.1)', icon: 'planning' },
  in_progress: { label: 'Em Andamento', color: 'hsl(200,80%,55%)', bg: 'hsla(200,80%,55%,0.1)', icon: 'progress' },
  review: { label: 'Revisão', color: 'hsl(45,100%,50%)', bg: 'hsla(45,100%,50%,0.1)', icon: 'review' },
  completed: { label: 'Concluído', color: 'hsl(140,60%,50%)', bg: 'hsla(140,60%,50%,0.1)', icon: 'completed' },
}

const PROJECT_COLORS = [
  { key: 'blue', color: 'hsl(200,80%,55%)', label: 'Azul' },
  { key: 'purple', color: 'hsl(280,60%,55%)', label: 'Roxo' },
  { key: 'green', color: 'hsl(140,60%,50%)', label: 'Verde' },
  { key: 'orange', color: 'hsl(24,100%,50%)', label: 'Laranja' },
  { key: 'pink', color: 'hsl(330,70%,55%)', label: 'Rosa' },
  { key: 'cyan', color: 'hsl(180,70%,45%)', label: 'Ciano' },
]

const getProjectColor = (key) => PROJECT_COLORS.find(c => c.key === key)?.color || PROJECT_COLORS[0].color

/* ═══════════════════════════════════════════
   PROJECT CARD (card compacto clicável)
   ═══════════════════════════════════════════ */
const ProjectCard = memo(function ProjectCard({ project, onClick }) {
  const totalPhases = project.stages?.length || 0
  const completedPhases = project.stages?.filter(s => s.status === 'completed').length || 0
  const progress = totalPhases ? Math.round((completedPhases / totalPhases) * 100) : 0
  const projectColor = getProjectColor(project.color)
  const statusInfo = PROJECT_STATUS[project.status] || PROJECT_STATUS.planning

  // Calcular dias restantes
  const getDaysInfo = () => {
    if (!project.dueDate) return null
    const due = new Date(project.dueDate)
    const today = new Date()
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { text: `${Math.abs(diff)}d atrasado`, urgent: true }
    if (diff === 0) return { text: 'Hoje', urgent: true }
    if (diff === 1) return { text: 'Amanhã', urgent: false }
    return { text: `${diff} dias`, urgent: false }
  }
  const daysInfo = getDaysInfo()

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="card-surface"
      style={{
        borderRadius: 'clamp(16px,3vw,22px)',
        padding: 'clamp(18px,3.5vw,24px)',
        cursor: 'pointer',
        borderLeft: `3px solid ${projectColor}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100px',
        height: '100%',
        background: `linear-gradient(90deg, ${projectColor}08, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: statusInfo.color,
              background: statusInfo.bg,
              padding: '3px 8px',
              borderRadius: '999px',
              border: `1px solid ${statusInfo.color}25`,
            }}>
              {statusInfo.label}
            </span>
            {daysInfo && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: daysInfo.urgent ? 'hsl(0,70%,55%)' : 'hsl(0,0%,45%)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}>
                <CalendarClock size={10} />
                {daysInfo.text}
              </span>
            )}
          </div>
          <h3 style={{
            fontSize: 'clamp(16px,2.5vw,20px)',
            fontWeight: 700,
            color: project.status === 'completed' ? 'hsl(0,0%,50%)' : 'hsl(0,0%,95%)',
            lineHeight: 1.3,
            margin: 0,
          }}>
            {project.name}
          </h3>
          {project.client && (
            <p style={{ fontSize: '12px', color: projectColor, marginTop: '4px', fontWeight: 600 }}>
              {project.client}
            </p>
          )}
        </div>
        <ChevronRight size={18} style={{ color: 'hsl(0,0%,30%)', flexShrink: 0, marginTop: '4px' }} />
      </div>

      {/* Progress */}
      {totalPhases > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(0,0%,45%)', fontWeight: 600 }}>
              {completedPhases} de {totalPhases} fases
            </span>
            <span style={{ fontSize: '12px', color: progress === 100 ? 'hsl(140,60%,50%)' : projectColor, fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            background: 'hsla(0,0%,100%,0.06)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: '999px',
                background: progress === 100
                  ? 'linear-gradient(90deg, hsl(140,60%,45%), hsl(140,60%,55%))'
                  : `linear-gradient(90deg, ${projectColor}, ${projectColor}cc)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Última atualização */}
      {project.lastUpdate && (
        <p style={{
          fontSize: '10px',
          color: 'hsl(0,0%,35%)',
          marginTop: '10px',
          fontStyle: 'italic',
        }}>
          Última atualização: {format(new Date(project.lastUpdate), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
    </motion.div>
  )
})

/* ═══════════════════════════════════════════
   PROJECT DETAIL VIEW (tela de fases)
   ═══════════════════════════════════════════ */
const ProjectDetailView = memo(function ProjectDetailView({
  project, onClose, onTogglePhase, onAddPhase, onRemovePhase,
  onEditPhase, onAddUpdate, onEditProject, onDeleteProject
}) {
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [newUpdate, setNewUpdate] = useState('')
  const [showAddPhase, setShowAddPhase] = useState(false)
  const projectColor = getProjectColor(project.color)
  const statusInfo = PROJECT_STATUS[project.status] || PROJECT_STATUS.planning

  const totalPhases = project.stages?.length || 0
  const completedPhases = project.stages?.filter(s => s.status === 'completed').length || 0
  const progress = totalPhases ? Math.round((completedPhases / totalPhases) * 100) : 0

  const handleAddPhase = () => {
    if (newPhaseTitle.trim()) {
      onAddPhase(project.id, newPhaseTitle.trim())
      setNewPhaseTitle('')
      setShowAddPhase(false)
    }
  }

  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      onAddUpdate(project.id, newUpdate.trim())
      setNewUpdate('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'hsl(0,0%,6%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header fixo */}
      <div style={{
        padding: 'clamp(16px,4vw,24px)',
        borderBottom: '1px solid hsla(0,0%,100%,0.06)',
        background: 'hsla(0,0%,6%,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'hsla(0,0%,100%,0.06)',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(0,0%,60%)',
            }}
          >
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </motion.button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: statusInfo.color,
                background: statusInfo.bg,
                padding: '3px 8px',
                borderRadius: '999px',
              }}>
                {statusInfo.label}
              </span>
              {project.client && (
                <span style={{ fontSize: '11px', color: projectColor, fontWeight: 600 }}>
                  {project.client}
                </span>
              )}
            </div>
            <h1 style={{
              fontSize: 'clamp(20px,4vw,28px)',
              fontWeight: 800,
              color: 'hsl(0,0%,95%)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {project.name}
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onEditProject(project)}
            style={{
              background: 'hsla(0,0%,100%,0.06)',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(0,0%,60%)',
            }}
          >
            <Pencil size={16} />
          </motion.button>
        </div>

        {/* Progress bar grande */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'hsl(0,0%,50%)', fontWeight: 600 }}>
              Progresso: {completedPhases}/{totalPhases} fases
            </span>
            <span style={{ fontSize: '14px', color: progress === 100 ? 'hsl(140,60%,50%)' : projectColor, fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            background: 'hsla(0,0%,100%,0.08)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: '999px',
                background: progress === 100
                  ? 'linear-gradient(90deg, hsl(140,60%,45%), hsl(140,60%,55%))'
                  : `linear-gradient(90deg, ${projectColor}, ${projectColor}cc)`,
              }}
            />
          </div>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
          {project.startDate && (
            <span style={{ fontSize: '11px', color: 'hsl(0,0%,45%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> Início: {format(new Date(project.startDate), 'dd/MM/yyyy')}
            </span>
          )}
          {project.dueDate && (
            <span style={{ fontSize: '11px', color: 'hsl(0,0%,45%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flag size={12} /> Prazo: {format(new Date(project.dueDate), 'dd/MM/yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,4vw,24px)', paddingBottom: '100px' }}>
        {/* Descrição */}
        {project.description && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(0,0%,45%)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Descrição
            </h3>
            <p style={{ fontSize: '14px', color: 'hsl(0,0%,70%)', lineHeight: 1.6 }}>
              {project.description}
            </p>
          </div>
        )}

        {/* Fases */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(0,0%,45%)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fases do Projeto
            </h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddPhase(!showAddPhase)}
              style={{
                background: showAddPhase ? `${projectColor}20` : 'hsla(0,0%,100%,0.06)',
                border: `1px solid ${showAddPhase ? projectColor + '40' : 'transparent'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: showAddPhase ? projectColor : 'hsl(0,0%,60%)',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={14} /> Nova Fase
            </motion.button>
          </div>

          {/* Input para nova fase */}
          <AnimatePresence>
            {showAddPhase && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: '12px' }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newPhaseTitle}
                    onChange={(e) => setNewPhaseTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
                    placeholder="Nome da fase..."
                    className="input-glass"
                    style={{ fontSize: '14px' }}
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddPhase}
                    style={{
                      background: projectColor,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0 16px',
                      cursor: 'pointer',
                      color: 'white',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    Adicionar
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de fases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(project.stages || []).length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: 'hsla(0,0%,100%,0.02)',
                borderRadius: '16px',
                border: '1px dashed hsla(0,0%,100%,0.1)',
              }}>
                <Target size={32} style={{ color: 'hsl(0,0%,25%)', marginBottom: '8px' }} />
                <p style={{ color: 'hsl(0,0%,40%)', fontSize: '13px' }}>
                  Nenhuma fase criada ainda
                </p>
                <p style={{ color: 'hsl(0,0%,30%)', fontSize: '11px', marginTop: '4px' }}>
                  Adicione fases para acompanhar o progresso
                </p>
              </div>
            ) : (
              project.stages.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-light"
                  style={{
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onTogglePhase(project.id, stage.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      marginTop: '2px',
                    }}
                  >
                    {stage.status === 'completed' ? (
                      <CheckCircle size={20} style={{ color: 'hsl(140,60%,50%)' }} />
                    ) : stage.status === 'current' ? (
                      <CircleDot size={20} style={{ color: 'hsl(24,100%,50%)' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'hsl(0,0%,30%)' }} />
                    )}
                  </motion.button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: stage.status === 'completed' ? 'hsl(0,0%,45%)' : 'hsl(0,0%,88%)',
                      textDecoration: stage.status === 'completed' ? 'line-through' : 'none',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {stage.title}
                    </p>
                    {stage.status === 'current' && (
                      <p style={{ fontSize: '10px', color: 'hsl(24,100%,50%)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CircleDot size={10} /> Em andamento
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemovePhase(project.id, stage.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'hsl(0,60%,55%)',
                      opacity: 0.4,
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Atualizações / Histórico */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(0,0%,45%)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Atualizações
          </h3>

          {/* Input para nova atualização */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUpdate()}
              placeholder="Adicionar atualização..."
              className="input-glass"
              style={{ fontSize: '13px' }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddUpdate}
              disabled={!newUpdate.trim()}
              style={{
                background: newUpdate.trim() ? projectColor : 'hsla(0,0%,100%,0.06)',
                border: 'none',
                borderRadius: '12px',
                padding: '0 14px',
                cursor: newUpdate.trim() ? 'pointer' : 'default',
                color: newUpdate.trim() ? 'white' : 'hsl(0,0%,35%)',
                fontWeight: 700,
                fontFamily: 'inherit',
                flexShrink: 0,
                fontSize: '12px',
              }}
            >
              Postar
            </motion.button>
          </div>

          {/* Lista de atualizações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(project.updates || []).length === 0 ? (
              <p style={{ color: 'hsl(0,0%,35%)', fontSize: '12px', fontStyle: 'italic' }}>
                Nenhuma atualização ainda
              </p>
            ) : (
              [...(project.updates || [])].reverse().map((update, index) => (
                <div
                  key={update.id}
                  style={{
                    paddingLeft: '16px',
                    borderLeft: `2px solid ${projectColor}40`,
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'hsl(0,0%,75%)', lineHeight: 1.5, margin: 0 }}>
                    {update.text}
                  </p>
                  <p style={{ fontSize: '10px', color: 'hsl(0,0%,40%)', marginTop: '6px' }}>
                    {format(new Date(update.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botão de deletar projeto */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid hsla(0,0%,100%,0.05)' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onDeleteProject(project.id)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid hsla(0,70%,50%,0.2)',
              background: 'hsla(0,70%,50%,0.08)',
              color: 'hsl(0,60%,55%)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Trash2 size={16} /> Excluir Projeto
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
function App() {
  // ── Core State ──
  const [tarefas, setTarefas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncError, setSyncError] = useState(null)
  const [novaTarefa, setNovaTarefa] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novaPrioridade, setNovaPrioridade] = useState('media')
  const [novaCategoria, setNovaCategoria] = useState('geral')
  const [novaDataEntrega, setNovaDataEntrega] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [ultimoSalvo, setUltimoSalvo] = useState(null)
  const [tarefaExpandida, setTarefaExpandida] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // ── Token Monitor ──
  const [monitorData, setMonitorData] = useState(null)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [monitorError, setMonitorError] = useState(null)

  // ── Edit Task ──
  const [editingTask, setEditingTask] = useState(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editPrioridade, setEditPrioridade] = useState('media')
  const [editCategoria, setEditCategoria] = useState('geral')
  const [editDataEntrega, setEditDataEntrega] = useState('')

  // ── App Mode (checklist ou roadmap) ──
  const [appMode, setAppMode] = useState(() => localStorage.getItem('road-app-mode') || 'checklist')
  const holdTimerRef = useRef(null)
  const [isHolding, setIsHolding] = useState(false)

  // ── Projects (modo roadmap) ──
  const [projects, setProjects] = useState([])

  // ── Project View (projeto aberto) ──
  const [selectedProject, setSelectedProject] = useState(null)

  // ── Project Edit ──
  const [editingProject, setEditingProject] = useState(null)
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectClient, setEditProjectClient] = useState('')
  const [editProjectDescription, setEditProjectDescription] = useState('')
  const [editProjectColor, setEditProjectColor] = useState('blue')
  const [editProjectStatus, setEditProjectStatus] = useState('planning')
  const [editProjectStartDate, setEditProjectStartDate] = useState('')
  const [editProjectDueDate, setEditProjectDueDate] = useState('')

  // ── Add Project Sheet ──
  const [showAddProjectSheet, setShowAddProjectSheet] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectClient, setNewProjectClient] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('blue')
  const [newProjectStartDate, setNewProjectStartDate] = useState('')
  const [newProjectDueDate, setNewProjectDueDate] = useState('')

  // ── Nav & Sheets ──
  const [activeTab, setActiveTab] = useState('tarefas')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showMoreSheet, setShowMoreSheet] = useState(false)
  // Monitor removido de sheet - agora é uma tab
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ── Scroll (throttled) ──
  const scrollRef = useRef(null)
  const searchRef = useRef(null)
  const [scrollState, setScrollState] = useState({ top: true, bottom: false })

  const updateScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollState({
      top: el.scrollTop < 10,
      bottom: el.scrollHeight - el.scrollTop - el.clientHeight < 10,
    })
  }, [])

  const handleScroll = useThrottle(updateScroll, 100)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    updateScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll, updateScroll])

  // ── API Sync - Load initial data ──
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setSyncError(null)
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch(`${API_URL}/tasks`),
          fetch(`${API_URL}/projects`)
        ])
        if (!tasksRes.ok || !projectsRes.ok) throw new Error('Erro ao carregar dados')
        const tasksData = await tasksRes.json()
        const projectsData = await projectsRes.json()
        // Map API fields to app fields
        setTarefas(tasksData.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descricao: t.descricao || '',
          concluida: t.concluida,
          prioridade: t.prioridade,
          categoria: t.categoria,
          dataAdicionada: t.data_adicionada,
          dataEntrega: t.data_entrega,
          totalWorkedSeconds: t.total_worked_seconds || 0,
          subtarefas: (t.subtarefas || []).map(s => ({
            id: s.id,
            texto: s.texto,
            concluida: s.concluida
          }))
        })))
        setProjects(projectsData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          status: p.status,
          color: p.color,
          stages: (p.stages || []).map(s => ({
            id: s.id,
            title: s.title,
            status: s.status
          }))
        })))
      } catch (err) {
        setSyncError(err.message)
        // Fallback to localStorage
        const savedTasks = localStorage.getItem('roadmap-tarefas-v5')
        if (savedTasks) setTarefas(JSON.parse(savedTasks))
        const savedProjects = localStorage.getItem('road-projects-v1')
        if (savedProjects) setProjects(JSON.parse(savedProjects))
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // ── WebSocket Real-time Sync ──
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    const connect = () => {
      ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('[WS] Connected')
        reconnectAttempts = 0
      }

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data)

          // Helper to map API task to app task
          const mapTask = (t) => ({
            id: t.id,
            titulo: t.titulo,
            descricao: t.descricao || '',
            concluida: t.concluida,
            prioridade: t.prioridade,
            categoria: t.categoria,
            dataAdicionada: t.data_adicionada,
            dataEntrega: t.data_entrega,
            totalWorkedSeconds: t.total_worked_seconds || 0,
            subtarefas: (t.subtarefas || []).map(s => ({
              id: s.id,
              texto: s.texto,
              concluida: s.concluida
            }))
          })

          // Helper to map API project to app project
          const mapProject = (p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            status: p.status,
            color: p.color,
            stages: (p.stages || []).map(s => ({
              id: s.id,
              title: s.title,
              status: s.status
            }))
          })

          switch (eventType) {
            case 'task:created':
              setTarefas(prev => {
                if (prev.find(t => t.id === data.id)) return prev
                return [...prev, mapTask(data)]
              })
              break

            case 'task:updated':
              setTarefas(prev => prev.map(t =>
                t.id === data.id ? { ...t, ...mapTask({ ...data, subtarefas: t.subtarefas }) } : t
              ))
              break

            case 'task:deleted':
              setTarefas(prev => prev.filter(t => t.id !== data.id))
              break

            case 'tasks:reordered':
              setTarefas(prev => {
                const ordered = []
                for (const id of data.orderedIds) {
                  const task = prev.find(t => t.id === id)
                  if (task) ordered.push(task)
                }
                return ordered
              })
              break

            case 'subtask:created':
              setTarefas(prev => prev.map(t => {
                if (t.id !== data.taskId) return t
                if (t.subtarefas.find(s => s.id === data.subtask.id)) return t
                return {
                  ...t,
                  subtarefas: [...t.subtarefas, {
                    id: data.subtask.id,
                    texto: data.subtask.texto,
                    concluida: data.subtask.concluida
                  }]
                }
              }))
              break

            case 'subtask:updated':
              setTarefas(prev => prev.map(t => ({
                ...t,
                subtarefas: t.subtarefas.map(s =>
                  s.id === data.id ? { ...s, concluida: data.concluida } : s
                )
              })))
              break

            case 'subtask:deleted':
              setTarefas(prev => prev.map(t => ({
                ...t,
                subtarefas: t.subtarefas.filter(s => s.id !== data.id)
              })))
              break

            case 'project:created':
              setProjects(prev => {
                if (prev.find(p => p.id === data.id)) return prev
                return [...prev, mapProject(data)]
              })
              break

            case 'project:updated':
              setProjects(prev => prev.map(p =>
                p.id === data.id ? { ...p, ...mapProject({ ...data, stages: p.stages }) } : p
              ))
              break

            case 'project:deleted':
              setProjects(prev => prev.filter(p => p.id !== data.id))
              break

            case 'stage:created':
              setProjects(prev => prev.map(p => {
                if (p.id !== data.projectId) return p
                if (p.stages.find(s => s.id === data.stage.id)) return p
                return {
                  ...p,
                  stages: [...p.stages, {
                    id: data.stage.id,
                    title: data.stage.title,
                    status: data.stage.status
                  }]
                }
              }))
              break

            case 'stage:updated':
              setProjects(prev => prev.map(p => ({
                ...p,
                stages: p.stages.map(s =>
                  s.id === data.id ? { ...s, status: data.status } : s
                )
              })))
              break

            case 'stage:deleted':
              setProjects(prev => prev.map(p => ({
                ...p,
                stages: p.stages.filter(s => s.id !== data.id)
              })))
              break

            default:
              console.log('[WS] Unknown event:', eventType)
          }
        } catch (err) {
          console.error('[WS] Parse error:', err)
        }
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected')
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++
            console.log(`[WS] Reconnecting (attempt ${reconnectAttempts})...`)
            connect()
          }, delay)
        }
      }

      ws.onerror = (err) => {
        console.error('[WS] Error:', err)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) ws.close()
    }
  }, [])

  // ── Backup to localStorage ──
  useEffect(() => {
    if (tarefas.length > 0) {
      localStorage.setItem('roadmap-tarefas-v5', JSON.stringify(tarefas))
    }
    setUltimoSalvo(new Date())
  }, [tarefas])

  useEffect(() => {
    localStorage.setItem('road-app-mode', appMode)
  }, [appMode])

  // ── Monitor fetch (quando abre a sheet) ──
  const fetchMonitorData = useCallback(async (retryCount = 0) => {
    setMonitorLoading(true)
    if (retryCount === 0) setMonitorError(null)
    try {
      const res = await fetch('https://monitor.centralraposa.com/usage', {
        signal: AbortSignal.timeout(15000) // 15s timeout
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) {
        // Se for erro de token, tentar novamente depois de um delay
        if (json.error.includes('Token') && retryCount < 2) {
          setTimeout(() => fetchMonitorData(retryCount + 1), 2000)
          return
        }
        throw new Error(json.error === 'Token refresh failed' ? 'Sessão expirada no monitor. Tente novamente.' : json.error)
      }
      setMonitorData(json.data)
      setMonitorError(null)
    } catch (err) {
      // Retry automático em caso de erro de rede (máx 2 tentativas)
      if (retryCount < 2 && (err.name === 'TypeError' || err.name === 'AbortError')) {
        setTimeout(() => fetchMonitorData(retryCount + 1), 2000)
        return
      }
      setMonitorError(err.message === 'Failed to fetch' ? 'Não foi possível conectar ao monitor' : err.message)
    } finally {
      setMonitorLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'monitor') {
      fetchMonitorData()
    }
  }, [activeTab, fetchMonitorData])

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('road-projects-v1', JSON.stringify(projects))
    }
  }, [projects])

  // ── Notification permission ──
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Mobile keyboard detection ──
  useEffect(() => {
    if (typeof visualViewport === 'undefined') return

    const handleResize = () => {
      const keyboardVisible = visualViewport.height < window.innerHeight * 0.75
      document.body.classList.toggle('keyboard-visible', keyboardVisible)
    }

    visualViewport.addEventListener('resize', handleResize)
    return () => visualViewport.removeEventListener('resize', handleResize)
  }, [])


  // ── Confetti (canvas-confetti with custom theme colors) ──
  const criarConfetti = useCallback(() => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#FF6A00', '#FF8C33', '#FFAA00', '#FF4500', '#FFD700']
    }

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  // ── Stable callbacks (don't break React.memo) ──
  const toggleTarefa = useCallback(async (id) => {
    const tarefa = tarefas.find(t => t.id === id)
    if (!tarefa) return
    const newConcluida = !tarefa.concluida
    // Optimistic update
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: newConcluida } : t))
    if (newConcluida) criarConfetti()
    // Sync with API
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: newConcluida })
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [tarefas, criarConfetti])

  const removerTarefa = useCallback(async (id) => {
    setTarefas(prev => prev.filter(t => t.id !== id))
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
    } catch (err) { console.error('Sync error:', err) }
  }, [])

  const atualizarDescricao = useCallback(async (id, novaDesc) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, descricao: novaDesc } : t))
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: novaDesc })
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [])

  const addSubtarefa = useCallback(async (taskId, texto) => {
    if (!texto.trim()) return
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      })
      if (!res.ok) throw new Error()
      const newSub = await res.json()
      // Adicionar com ID real da API (WebSocket pode não estar conectado)
      setTarefas(prev => prev.map(t => {
        if (t.id !== taskId) return t
        // Evitar duplicata se WS já adicionou
        if (t.subtarefas?.find(s => s.id === newSub.id)) return t
        return { ...t, subtarefas: [...(t.subtarefas || []), { id: newSub.id, texto: newSub.texto, concluida: false }] }
      }))
    } catch (err) {
      // Fallback local (só quando API falha)
      setTarefas(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtarefas: [...(t.subtarefas || []), { id: Date.now(), texto, concluida: false }] }
          : t
      ))
    }
  }, [])

  const toggleSubtarefa = useCallback(async (taskId, subId) => {
    const tarefa = tarefas.find(t => t.id === taskId)
    const sub = tarefa?.subtarefas?.find(s => s.id === subId)
    if (!sub) return
    const newConcluida = !sub.concluida
    // Optimistic update
    setTarefas(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtarefas: t.subtarefas.map(s => s.id === subId ? { ...s, concluida: newConcluida } : s) }
        : t
    ))
    try {
      await fetch(`${API_URL}/subtasks/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: newConcluida })
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [tarefas])

  const removeSubtarefa = useCallback(async (taskId, subId) => {
    setTarefas(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtarefas: t.subtarefas.filter(s => s.id !== subId) }
        : t
    ))
    try {
      await fetch(`${API_URL}/subtasks/${subId}`, { method: 'DELETE' })
    } catch (err) { console.error('Sync error:', err) }
  }, [])

  const expandTarefa = useCallback((id) => {
    setTarefaExpandida(prev => prev === id ? null : id)
  }, [])

  const addWorkedTime = useCallback(async (taskId, seconds) => {
    const tarefa = tarefas.find(t => t.id === taskId)
    const newTotal = (tarefa?.totalWorkedSeconds || 0) + seconds
    setTarefas(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, totalWorkedSeconds: newTotal }
        : t
    ))
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalWorkedSeconds: newTotal })
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [tarefas])

  // ── Edit Task Actions ──
  const openEditSheet = useCallback((tarefa) => {
    setEditingTask(tarefa)
    setEditTitulo(tarefa.titulo)
    setEditDescricao(tarefa.descricao || '')
    setEditPrioridade(tarefa.prioridade)
    setEditCategoria(tarefa.categoria || 'geral')
    setEditDataEntrega(tarefa.dataEntrega ? tarefa.dataEntrega.split('T')[0] : '')
  }, [])

  const closeEditSheet = useCallback(() => {
    setEditingTask(null)
    setEditTitulo('')
    setEditDescricao('')
    setEditPrioridade('media')
    setEditCategoria('geral')
    setEditDataEntrega('')
  }, [])

  const salvarEdicao = useCallback(async () => {
    if (!editingTask || !editTitulo.trim()) return
    const updates = {
      titulo: editTitulo.trim(),
      descricao: editDescricao,
      prioridade: editPrioridade,
      categoria: editCategoria,
      dataEntrega: editDataEntrega || null
    }
    setTarefas(prev => prev.map(t =>
      t.id === editingTask.id ? { ...t, ...updates } : t
    ))
    closeEditSheet()
    try {
      await fetch(`${API_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [editingTask, editTitulo, editDescricao, editPrioridade, editCategoria, editDataEntrega, closeEditSheet])

  // ── Hold to switch mode ──
  const handlePlusHoldStart = useCallback(() => {
    setIsHolding(true)
    holdTimerRef.current = setTimeout(() => {
      // Trocar modo
      setAppMode(prev => prev === 'checklist' ? 'roadmap' : 'checklist')
      setIsHolding(false)
      // Vibrar se disponível
      if (navigator.vibrate) navigator.vibrate(50)
    }, 600) // 600ms de hold
  }, [])

  const handlePlusHoldEnd = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (isHolding) {
      setIsHolding(false)
    }
  }, [isHolding])

  const handlePlusClick = useCallback(() => {
    // Se não estava segurando, abre o sheet de adicionar
    if (!isHolding) {
      if (appMode === 'roadmap') {
        setShowAddProjectSheet(true)
      } else {
        setShowAddSheet(true)
      }
    }
  }, [isHolding, appMode])

  // ── Project Actions ──
  const addProject = useCallback(async () => {
    if (!newProjectName.trim()) return
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim(),
          color: newProjectColor
        })
      })
      if (!res.ok) throw new Error()
      const newProject = await res.json()
      setProjects(prev => [...prev, {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '',
        status: newProject.status,
        color: newProject.color,
        stages: []
      }])
    } catch (err) {
      // Fallback local
      setProjects(prev => [...prev, {
        id: Date.now(),
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        color: newProjectColor,
        status: 'planning',
        stages: []
      }])
    }
    setNewProjectName('')
    setNewProjectClient('')
    setNewProjectDescription('')
    setNewProjectColor('blue')
    setNewProjectStartDate('')
    setNewProjectDueDate('')
    setShowAddProjectSheet(false)
  }, [newProjectName, newProjectClient, newProjectDescription, newProjectColor, newProjectStartDate, newProjectDueDate])

  const addPhaseToProject = useCallback(async (projectId, phaseTitle) => {
    if (!phaseTitle.trim()) return
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: phaseTitle.trim() })
      })
      if (!res.ok) throw new Error()
      const newStage = await res.json()
      const updateFn = (project) => project.id === projectId
        ? { ...project, stages: [...(project.stages || []), { id: newStage.id, title: newStage.title, status: 'pending' }] }
        : project
      setProjects(prev => prev.map(updateFn))
      setSelectedProject(prev => prev ? updateFn(prev) : prev)
    } catch (err) {
      // Fallback local
      const newStage = { id: Date.now(), title: phaseTitle.trim(), status: 'pending' }
      const updateFn = (project) => project.id === projectId
        ? { ...project, stages: [...(project.stages || []), newStage] }
        : project
      setProjects(prev => prev.map(updateFn))
      setSelectedProject(prev => prev ? updateFn(prev) : prev)
    }
  }, [])

  const toggleProjectPhase = useCallback(async (projectId, stageId) => {
    const project = projects.find(p => p.id === projectId)
    const stage = project?.stages?.find(s => s.id === stageId)
    if (!stage) return
    // Toggle: pending -> current -> completed -> pending
    const statusOrder = ['pending', 'current', 'completed']
    const nextIdx = (statusOrder.indexOf(stage.status) + 1) % 3
    const newStatus = statusOrder[nextIdx]
    const updateFn = (proj) => {
      if (proj.id !== projectId) return proj
      return { ...proj, stages: proj.stages.map(s => s.id === stageId ? { ...s, status: newStatus } : s) }
    }
    setProjects(prev => prev.map(updateFn))
    setSelectedProject(prev => prev ? updateFn(prev) : prev)
    try {
      await fetch(`${API_URL}/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [projects])

  const removeProjectPhase = useCallback(async (projectId, stageId) => {
    const updateFn = (project) => {
      if (project.id !== projectId) return project
      return { ...project, stages: project.stages.filter(s => s.id !== stageId) }
    }
    setProjects(prev => prev.map(updateFn))
    setSelectedProject(prev => prev ? updateFn(prev) : prev)
    try {
      await fetch(`${API_URL}/stages/${stageId}`, { method: 'DELETE' })
    } catch (err) { console.error('Sync error:', err) }
  }, [])

  const addProjectUpdate = useCallback((projectId, text) => {
    if (!text.trim()) return
    const update = {
      id: Date.now(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }
    const updateProject = (project) => {
      if (project.id !== projectId) return project
      return {
        ...project,
        updates: [...(project.updates || []), update],
        lastUpdate: new Date().toISOString(),
      }
    }
    setProjects(prev => prev.map(updateProject))
    setSelectedProject(prev => prev ? updateProject(prev) : prev)
  }, [])

  const deleteProject = useCallback(async (projectId) => {
    if (window.confirm('Excluir este projeto e todas as suas fases?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setSelectedProject(null)
      try {
        await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' })
      } catch (err) { console.error('Sync error:', err) }
    }
  }, [])

  const openEditProject = useCallback((project) => {
    setEditingProject(project)
    setEditProjectName(project.name)
    setEditProjectClient(project.client || '')
    setEditProjectDescription(project.description || '')
    setEditProjectColor(project.color || 'blue')
    setEditProjectStatus(project.status || 'planning')
    setEditProjectStartDate(project.startDate || '')
    setEditProjectDueDate(project.dueDate || '')
  }, [])

  const closeEditProject = useCallback(() => {
    setEditingProject(null)
    setEditProjectName('')
    setEditProjectClient('')
    setEditProjectDescription('')
    setEditProjectColor('blue')
    setEditProjectStatus('planning')
    setEditProjectStartDate('')
    setEditProjectDueDate('')
  }, [])

  const saveEditProject = useCallback(async () => {
    if (!editingProject || !editProjectName.trim()) return
    const updates = {
      name: editProjectName.trim(),
      description: editProjectDescription.trim(),
      color: editProjectColor,
      status: editProjectStatus
    }
    const updateFn = (project) => {
      if (project.id !== editingProject.id) return project
      return { ...project, ...updates }
    }
    setProjects(prev => prev.map(updateFn))
    setSelectedProject(prev => prev ? updateFn(prev) : prev)
    closeEditProject()
    try {
      await fetch(`${API_URL}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) { console.error('Sync error:', err) }
  }, [editingProject, editProjectName, editProjectClient, editProjectDescription, editProjectColor, editProjectStatus, editProjectStartDate, editProjectDueDate, closeEditProject])

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        if (appMode === 'roadmap') {
          setShowAddProjectSheet(true)
        } else {
          setShowAddSheet(true)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setShowSearch(prev => !prev); setTimeout(() => searchRef.current?.focus(), 100) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowNotesSheet(prev => !prev) }
      if (e.key === 'Escape') {
        setShowAddSheet(false)
        setShowMoreSheet(false)
        setShowNotesSheet(false)
        setShowShortcuts(false)
        setShowSearch(false)
        setSearchQuery('')
        setShowAddProjectSheet(false)
        setSelectedProject(null)
        closeEditSheet()
        closeEditProject()
      }
      if (e.key === '?') { setShowShortcuts(prev => !prev) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeEditSheet, closeEditProject, appMode])

  // ── More Actions ──
  const adicionarTarefa = async () => {
    if (!novaTarefa.trim()) return
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: novaTarefa,
          descricao: novaDescricao,
          prioridade: novaPrioridade,
          categoria: novaCategoria,
          dataEntrega: novaDataEntrega || null
        })
      })
      if (!res.ok) throw new Error('Erro ao criar tarefa')
      const newTask = await res.json()
      setTarefas(prev => [...prev, {
        id: newTask.id,
        titulo: newTask.titulo,
        descricao: newTask.descricao || '',
        concluida: false,
        prioridade: newTask.prioridade,
        categoria: newTask.categoria,
        dataAdicionada: newTask.data_adicionada,
        dataEntrega: newTask.data_entrega,
        subtarefas: [],
        totalWorkedSeconds: 0,
      }])
    } catch (err) {
      // Fallback local
      setTarefas(prev => [...prev, {
        id: Date.now(), titulo: novaTarefa, descricao: novaDescricao,
        concluida: false, prioridade: novaPrioridade, categoria: novaCategoria,
        dataAdicionada: new Date().toISOString(), dataEntrega: novaDataEntrega || null,
        subtarefas: [], totalWorkedSeconds: 0,
      }])
    }
    setNovaTarefa(''); setNovaDescricao(''); setNovaPrioridade('media'); setNovaCategoria('geral'); setNovaDataEntrega(''); setShowAddSheet(false)
  }

  const resetarTarefas = () => {
    if (window.confirm('Deseja resetar todas as tarefas?')) { setTarefas(tarefasIniciais); setShowMoreSheet(false) }
  }

  const exportarDados = () => {
    const data = { tarefas, notes, version: APP_VERSION, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `roadmap-backup-${format(new Date(), 'yyyy-MM-dd')}.json`; link.click()
    URL.revokeObjectURL(url); setShowMoreSheet(false)
  }

  const importarDados = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result)
        const dados = raw.tarefas || raw
        setTarefas(dados.map(t => ({ subtarefas: [], categoria: 'geral', dataEntrega: null, ...t })))
        if (raw.notes) setNotes(raw.notes)
        setShowMoreSheet(false)
      } catch { alert('Erro ao importar. JSON inválido.') }
    }
    reader.readAsText(file)
  }

  // ── Computed (memoized!) ──
  const tarefasAtivas = useMemo(() => tarefas.filter(t => !t.concluida), [tarefas])
  const tarefasConcluidas = useMemo(() => tarefas.filter(t => t.concluida), [tarefas])
  const progresso = tarefas.length ? Math.round((tarefasConcluidas.length / tarefas.length) * 100) : 0

  const tarefasFiltradas = useMemo(() => {
    const lista = activeTab === 'tarefas' ? tarefasAtivas : tarefasConcluidas
    return lista
      .filter(t => {
        if (filtro === 'alta') return t.prioridade === 'alta'
        if (filtro === 'media') return t.prioridade === 'media'
        if (filtro === 'baixa') return t.prioridade === 'baixa'
        if (CATEGORIAS.find(c => c.key === filtro)) return t.categoria === filtro
        return true
      })
      .filter(t => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return t.titulo.toLowerCase().includes(q) || t.descricao?.toLowerCase().includes(q)
      })
  }, [tarefasAtivas, tarefasConcluidas, activeTab, filtro, searchQuery])

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div style={{ height: '100vh', width: '100vw', background: 'hsl(0,0%,6%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Ambient BG (pure CSS — zero JS) ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      {/* ── Scroll Area ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: 'linear-gradient(to bottom, hsl(0,0%,6%), transparent)', zIndex: 10, pointerEvents: 'none', opacity: scrollState.top ? 0 : 1, transition: 'opacity 0.3s' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, hsl(0,0%,6%), transparent)', zIndex: 10, pointerEvents: 'none', opacity: scrollState.bottom ? 0 : 1, transition: 'opacity 0.3s' }} />

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'clamp(16px,4vw,32px) clamp(12px,3vw,24px)', paddingBottom: 'clamp(110px,16vh,160px)', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>

            {/* ══════════ HEADER ══════════ */}
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'clamp(20px,4vw,32px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,16px)', marginBottom: 'clamp(16px,3vw,24px)' }}>
                <div style={{ flexShrink: 0 }}>
                  <img src="/app-icon.png" alt="Roadmap" style={{ width: 'clamp(40px,6vw,52px)', height: 'clamp(40px,6vw,52px)', borderRadius: 'clamp(12px,2vw,16px)', boxShadow: '0 4px 20px hsla(24,100%,50%,0.3)' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h1 style={{ fontSize: 'clamp(22px,4.5vw,32px)', fontWeight: 800, color: 'hsl(0,0%,95%)', lineHeight: 1.15, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {appMode === 'roadmap' ? 'Roadmap' : APP_NAME}
                    <motion.span
                      key={appMode}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      style={{ fontSize: '14px', fontWeight: 500, color: appMode === 'roadmap' ? 'hsl(200,80%,55%)' : 'hsl(24,100%,50%)' }}
                    >
                      {appMode === 'roadmap' ? '🗺️' : '✅'}
                    </motion.span>
                  </h1>
                  <p style={{ fontSize: 'clamp(12px,1.8vw,14px)', color: 'hsl(0,0%,50%)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <button onClick={() => { setShowSearch(p => !p); setTimeout(() => searchRef.current?.focus(), 100) }}
                  style={{ background: showSearch ? 'hsla(24,100%,50%,0.12)' : 'hsla(0,0%,100%,0.06)', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', color: showSearch ? 'hsl(24,100%,50%)' : 'hsl(0,0%,50%)', transition: 'all 0.2s' }}>
                  <Search size={16} />
                </button>
              </div>

              {/* Search bar */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 'clamp(12px,2vw,16px)' }}>
                    <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar tarefas..." className="input-glass"
                      style={{ fontSize: 'clamp(14px,1.8vw,15px)' }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Card */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-medium"
                style={{ borderRadius: 'clamp(16px,3vw,24px)', padding: 'clamp(16px,3vw,24px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(10px,2vw,14px)' }}>
                  <span style={{ fontSize: 'clamp(12px,1.6vw,14px)', color: 'hsl(0,0%,50%)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <TrendingUp size={14} /> Progresso do Dia
                  </span>
                  <motion.span key={progresso} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                    style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: progresso === 100 ? 'hsl(140,60%,55%)' : 'hsl(24,100%,50%)' }}>
                    {progresso}%
                  </motion.span>
                </div>
                <div style={{ width: '100%', height: 'clamp(6px,1vw,10px)', borderRadius: '999px', background: 'hsla(0,0%,100%,0.06)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="shimmer-effect"
                    style={{ height: '100%', borderRadius: '999px', background: progresso === 100 ? 'linear-gradient(90deg, hsl(140,60%,45%), hsl(140,60%,55%))' : 'linear-gradient(90deg, hsl(24,100%,45%), hsl(24,100%,55%))' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(8px,1.5vw,12px)', marginTop: 'clamp(14px,2.5vw,20px)' }}>
                  {[
                    { n: tarefas.length, label: 'Total', icon: <Clipboard size={13} />, color: 'hsl(0,0%,72%)' },
                    { n: tarefasAtivas.length, label: 'Ativas', icon: <Flame size={13} />, color: 'hsl(24,100%,55%)' },
                    { n: tarefasConcluidas.length, label: 'Feitas', icon: <Award size={13} />, color: 'hsl(140,60%,55%)' },
                  ].map((s) => (
                    <div key={s.label} className="glass-light" style={{ borderRadius: 'clamp(10px,2vw,14px)', padding: 'clamp(10px,2vw,14px)', textAlign: 'center' }}>
                      <div style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
                      <div style={{ fontSize: 'clamp(10px,1.3vw,12px)', color: 'hsl(0,0%,45%)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 600 }}>{s.icon} {s.label}</div>
                    </div>
                  ))}
                </div>
                {ultimoSalvo && (
                  <div style={{ marginTop: 'clamp(10px,2vw,14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'hsl(140,50%,50%)', fontWeight: 600 }}>
                    <Save size={11} /> Auto-salvo
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* ══════════ FILTERS (só no modo checklist) ══════════ */}
            {appMode === 'checklist' && (
              <div className="scroll-hidden" style={{ display: 'flex', gap: 'clamp(6px,1.2vw,8px)', marginBottom: 'clamp(16px,3vw,24px)', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'nowrap' }}>
                {[
                  { key: 'todas', label: 'Todas' },
                  { key: 'alta', label: 'Alta' },
                  { key: 'media', label: 'Média' },
                  { key: 'baixa', label: 'Baixa' },
                  ...CATEGORIAS.filter(c => c.key !== 'geral').map(c => ({ key: c.key, label: c.label })),
                ].map((f) => (
                  <button key={f.key} onClick={() => setFiltro(f.key)}
                    style={{
                      padding: 'clamp(6px,1.2vw,8px) clamp(12px,2vw,16px)', borderRadius: '999px', border: 'none',
                      fontSize: 'clamp(11px,1.4vw,12px)', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      background: filtro === f.key ? 'hsl(24,100%,50%)' : 'hsla(0,0%,100%,0.06)',
                      color: filtro === f.key ? 'white' : 'hsl(0,0%,50%)',
                      boxShadow: filtro === f.key ? '0 2px 12px hsla(24,100%,50%,0.3)' : 'none',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* ══════════ CONTENT (CHECKLIST, ROADMAP ou MONITOR) ══════════ */}
            {activeTab === 'monitor' ? (
              /* ══════════ MONITOR PAGE ══════════ */
              <motion.div
                key="monitor-page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,24px)' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, color: 'hsl(0,0%,95%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={24} style={{ color: 'hsl(200,80%,55%)' }} /> Monitor de Tokens
                  </h2>
                  <button
                    onClick={fetchMonitorData}
                    disabled={monitorLoading}
                    style={{
                      background: 'hsla(0,0%,100%,0.06)',
                      border: '1px solid hsla(0,0%,100%,0.1)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      color: 'hsl(200,80%,55%)',
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    <RefreshCw size={14} className={monitorLoading ? 'spin' : ''} />
                    Atualizar
                  </button>
                </div>

                {/* Loading */}
                {monitorLoading && !monitorData && (
                  <div className="card-surface" style={{ borderRadius: '20px', padding: '60px 24px', textAlign: 'center' }}>
                    <RefreshCw size={32} className="spin" style={{ color: 'hsl(200,80%,55%)', marginBottom: '16px' }} />
                    <p style={{ color: 'hsl(0,0%,50%)', fontSize: '14px' }}>Carregando dados...</p>
                  </div>
                )}

                {/* Error */}
                {monitorError && (
                  <div className="card-surface" style={{ borderRadius: '20px', padding: '40px 24px', textAlign: 'center', borderColor: 'hsla(0,60%,50%,0.2)' }}>
                    <AlertTriangle size={32} style={{ color: 'hsl(0,60%,55%)', marginBottom: '16px' }} />
                    <p style={{ color: 'hsl(0,60%,55%)', fontSize: '14px', fontWeight: 600 }}>Erro ao carregar</p>
                    <p style={{ color: 'hsl(0,0%,45%)', fontSize: '12px', marginTop: '8px' }}>{monitorError}</p>
                  </div>
                )}

                {/* Data */}
                {monitorData && (
                  <>
                    {/* Uso 5 horas - Card Grande */}
                    <div className="card-surface" style={{ borderRadius: '20px', padding: 'clamp(20px,4vw,28px)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(0,0%,50%)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Uso 5 Horas
                          </span>
                          <div style={{ fontSize: 'clamp(36px,8vw,48px)', fontWeight: 900, color: monitorData.five_hour?.utilization >= 80 ? 'hsl(0,70%,55%)' : monitorData.five_hour?.utilization >= 50 ? 'hsl(45,100%,50%)' : 'hsl(140,60%,50%)', lineHeight: 1 }}>
                            {monitorData.five_hour?.utilization || 0}%
                          </div>
                        </div>
                        <Clock size={28} style={{ color: 'hsl(24,100%,55%)', opacity: 0.5 }} />
                      </div>
                      <div style={{ width: '100%', height: '12px', borderRadius: '999px', background: 'hsla(0,0%,100%,0.08)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${monitorData.five_hour?.utilization || 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: '999px',
                            background: monitorData.five_hour?.utilization >= 80
                              ? 'linear-gradient(90deg, hsl(0,70%,45%), hsl(0,70%,55%))'
                              : monitorData.five_hour?.utilization >= 50
                                ? 'linear-gradient(90deg, hsl(45,100%,45%), hsl(45,100%,55%))'
                                : 'linear-gradient(90deg, hsl(24,100%,45%), hsl(24,100%,55%))'
                          }}
                        />
                      </div>
                      {monitorData.five_hour?.resets_at && (
                        <p style={{ fontSize: '12px', color: 'hsl(0,0%,45%)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Timer size={12} /> Reseta às {new Date(monitorData.five_hour.resets_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    {/* Uso 7 dias - Card Grande */}
                    <div className="card-surface" style={{ borderRadius: '20px', padding: 'clamp(20px,4vw,28px)', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(0,0%,50%)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Uso 7 Dias
                          </span>
                          <div style={{ fontSize: 'clamp(36px,8vw,48px)', fontWeight: 900, color: monitorData.seven_day?.utilization >= 80 ? 'hsl(0,70%,55%)' : monitorData.seven_day?.utilization >= 50 ? 'hsl(45,100%,50%)' : 'hsl(140,60%,50%)', lineHeight: 1 }}>
                            {monitorData.seven_day?.utilization || 0}%
                          </div>
                        </div>
                        <Calendar size={28} style={{ color: 'hsl(200,80%,55%)', opacity: 0.5 }} />
                      </div>
                      <div style={{ width: '100%', height: '12px', borderRadius: '999px', background: 'hsla(0,0%,100%,0.08)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${monitorData.seven_day?.utilization || 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: '999px',
                            background: monitorData.seven_day?.utilization >= 80
                              ? 'linear-gradient(90deg, hsl(0,70%,45%), hsl(0,70%,55%))'
                              : monitorData.seven_day?.utilization >= 50
                                ? 'linear-gradient(90deg, hsl(45,100%,45%), hsl(45,100%,55%))'
                                : 'linear-gradient(90deg, hsl(200,80%,45%), hsl(200,80%,55%))'
                          }}
                        />
                      </div>
                      {monitorData.seven_day?.resets_at && (
                        <p style={{ fontSize: '12px', color: 'hsl(0,0%,45%)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Timer size={12} /> Reseta {new Date(monitorData.seven_day.resets_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} às {new Date(monitorData.seven_day.resets_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    {/* Extra usage */}
                    {monitorData.extra_usage?.is_enabled && (
                      <div className="card-surface" style={{ borderRadius: '20px', padding: '20px', background: 'hsla(140,60%,50%,0.05)', borderColor: 'hsla(140,60%,50%,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(140,60%,50%)' }} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(140,60%,55%)' }}>
                              Uso Extra Ativo
                            </span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(0,0%,60%)' }}>
                            {monitorData.extra_usage.currency} {monitorData.extra_usage.used_credits?.toFixed(2) || '0.00'} / {monitorData.extra_usage.monthly_limit}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Info card */}
                    <div style={{ padding: '16px', background: 'hsla(0,0%,100%,0.02)', borderRadius: '12px', border: '1px solid hsla(0,0%,100%,0.05)' }}>
                      <p style={{ fontSize: '11px', color: 'hsl(0,0%,40%)', textAlign: 'center' }}>
                        Dados atualizados a cada 5 minutos via monitor.centralraposa.com
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            ) : appMode === 'checklist' ? (
              /* ══════════ TASK LIST ══════════ */
              <Reorder.Group
                axis="y"
                values={tarefasFiltradas}
                onReorder={(newOrder) => {
                  const reorderedIds = new Set(newOrder.map(t => t.id))
                  const result = []
                  let orderIdx = 0
                  for (const t of tarefas) {
                    if (reorderedIds.has(t.id)) { result.push(newOrder[orderIdx++]) }
                    else { result.push(t) }
                  }
                  setTarefas(result)
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2.5vw,16px)', listStyle: 'none', padding: 0, margin: 0 }}
              >
                <AnimatePresence mode="popLayout">
                  {tarefasFiltradas.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-surface"
                      style={{ borderRadius: 'clamp(16px,3vw,24px)', padding: 'clamp(32px,6vw,64px) clamp(16px,3vw,24px)', textAlign: 'center' }}>
                      <ListTodo size={40} style={{ color: 'hsl(0,0%,25%)', margin: '0 auto 12px' }} />
                      <p style={{ color: 'hsl(0,0%,40%)', fontSize: 'clamp(14px,2vw,16px)' }}>
                        {searchQuery ? 'Nenhum resultado' : activeTab === 'concluidas' ? 'Nenhuma concluída' : 'Nenhuma tarefa'}
                      </p>
                    </motion.div>
                  ) : (
                    tarefasFiltradas.map((tarefa) => (
                      <TaskCard
                        key={tarefa.id}
                        tarefa={tarefa}
                        isExpanded={tarefaExpandida === tarefa.id}
                        onToggle={toggleTarefa}
                        onRemove={removerTarefa}
                        onExpand={expandTarefa}
                        onDescricao={atualizarDescricao}
                        onAddSub={addSubtarefa}
                        onToggleSub={toggleSubtarefa}
                        onRemoveSub={removeSubtarefa}
                        onEdit={openEditSheet}
                        onAddWorkedTime={addWorkedTime}
                      />
                    ))
                  )}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              /* ══════════ PROJECTS LIST ══════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2.5vw,16px)' }}>
                <AnimatePresence mode="popLayout">
                  {(() => {
                    // Filtrar projetos baseado na aba ativa
                    const filteredProjects = projects.filter(project => {
                      if (activeTab === 'concluidas') return project.status === 'completed'
                      return project.status !== 'completed'
                    })

                    if (filteredProjects.length === 0) {
                      return (
                        <motion.div key="empty-projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-surface"
                          style={{ borderRadius: 'clamp(16px,3vw,24px)', padding: 'clamp(32px,6vw,64px) clamp(16px,3vw,24px)', textAlign: 'center' }}>
                          <Map size={40} style={{ color: 'hsl(200,80%,35%)', margin: '0 auto 12px' }} />
                          <p style={{ color: 'hsl(0,0%,40%)', fontSize: 'clamp(14px,2vw,16px)' }}>
                            {activeTab === 'concluidas' ? 'Nenhum projeto concluído' : 'Nenhum projeto ainda'}
                          </p>
                          <p style={{ color: 'hsl(0,0%,30%)', fontSize: '12px', marginTop: '8px' }}>
                            {activeTab !== 'concluidas' && 'Toque no + para criar um projeto'}
                          </p>
                        </motion.div>
                      )
                    }

                    return filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => setSelectedProject(project)}
                      />
                    ))
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 'clamp(24px,4vw,40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'hsl(0,0%,25%)', fontWeight: 500 }}>v{APP_VERSION}</span>
              <span style={{ fontSize: '10px', color: 'hsl(0,0%,20%)' }}>?=atalhos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PILL NAV ══════════ */}
      <div className="pill-nav">
        <motion.div className="pill-nav-inner" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}>
          <button className={`pill-nav-btn ${activeTab === 'tarefas' ? 'active' : ''}`} onClick={() => { setActiveTab('tarefas'); setFiltro('todas') }}
            style={{ color: appMode === 'roadmap' && activeTab === 'tarefas' ? 'hsl(200,80%,55%)' : undefined }}>
            {appMode === 'roadmap' ? <Map size={20} /> : <ListTodo size={20} />}
            <span>{appMode === 'roadmap' ? 'Etapas' : 'Tarefas'}</span>
          </button>
          <button className={`pill-nav-btn ${activeTab === 'concluidas' ? 'active' : ''}`} onClick={() => { setActiveTab('concluidas'); setFiltro('todas') }}
            style={{ color: appMode === 'roadmap' && activeTab === 'concluidas' ? 'hsl(200,80%,55%)' : undefined }}>
            {appMode === 'roadmap' ? <Award size={20} /> : <CheckCircle size={20} />}
            <span>{appMode === 'roadmap' ? 'Completas' : 'Feitas'}</span>
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: isHolding ? 1.15 : 1,
              rotate: isHolding ? 45 : 0,
            }}
            transition={{ duration: 0.2 }}
            onMouseDown={handlePlusHoldStart}
            onMouseUp={handlePlusHoldEnd}
            onMouseLeave={handlePlusHoldEnd}
            onTouchStart={handlePlusHoldStart}
            onTouchEnd={handlePlusHoldEnd}
            onClick={handlePlusClick}
            style={{
              width: 'clamp(44px,7vw,54px)',
              height: 'clamp(44px,7vw,54px)',
              borderRadius: '50%',
              border: 'none',
              background: appMode === 'roadmap'
                ? 'linear-gradient(135deg, hsl(200,80%,50%), hsl(200,80%,40%))'
                : 'linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,42%))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: appMode === 'roadmap'
                ? '0 4px 20px hsla(200,80%,50%,0.4)'
                : '0 4px 20px hsla(24,100%,50%,0.4)',
              flexShrink: 0,
              transition: 'background 0.3s, box-shadow 0.3s',
            }}>
            {appMode === 'roadmap' ? <Route size={22} /> : <Plus size={22} />}
          </motion.button>
          <button className={`pill-nav-btn ${activeTab === 'monitor' ? 'active' : ''}`} onClick={() => setActiveTab('monitor')}>
            <Activity size={20} /><span>Monitor</span>
          </button>
          <button className="pill-nav-btn" onClick={() => setShowMoreSheet(true)}>
            <MoreHorizontal size={20} /><span>Mais</span>
          </button>
        </motion.div>
      </div>

      {/* ══════════ ADD TASK SHEET ══════════ */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSheet(false)} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="bottom-sheet-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(14px,2.5vw,20px)' }}>
                <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} style={{ color: 'hsl(24,100%,50%)' }} /> Nova Tarefa
                </h2>
                <button onClick={() => setShowAddSheet(false)} style={{ background: 'hsla(0,0%,100%,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(0,0%,50%)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,12px)' }}>
                <input type="text" value={novaTarefa} onChange={(e) => setNovaTarefa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && adicionarTarefa()}
                  placeholder="Nome da tarefa..." className="input-glass" autoFocus />
                <textarea value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Descrição (opcional)..."
                  className="input-glass" style={{ resize: 'none', minHeight: '70px' }} rows={2} />
                <input type="date" value={novaDataEntrega} onChange={(e) => setNovaDataEntrega(e.target.value)}
                  className="input-glass" style={{ colorScheme: 'dark' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[{ key: 'alta', label: 'Alta', icon: <Flame size={13} /> }, { key: 'media', label: 'Média', icon: <Zap size={13} /> }, { key: 'baixa', label: 'Baixa', icon: <Clipboard size={13} /> }].map((p) => (
                    <button key={p.key} onClick={() => setNovaPrioridade(p.key)}
                      style={{ flex: 1, padding: 'clamp(8px,1.5vw,12px)', borderRadius: 'clamp(10px,2vw,14px)',
                        border: novaPrioridade === p.key ? '2px solid hsl(24,100%,50%)' : '1px solid hsla(0,0%,100%,0.08)',
                        background: novaPrioridade === p.key ? 'hsla(24,100%,50%,0.1)' : 'hsla(0,0%,100%,0.03)',
                        color: novaPrioridade === p.key ? 'hsl(24,100%,55%)' : 'hsl(0,0%,50%)',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 'clamp(11px,1.4vw,12px)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CATEGORIAS.map((c) => (
                    <button key={c.key} onClick={() => setNovaCategoria(c.key)}
                      style={{
                        padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                        border: novaCategoria === c.key ? `2px solid ${c.color}` : '1px solid hsla(0,0%,100%,0.08)',
                        background: novaCategoria === c.key ? `${c.color}18` : 'hsla(0,0%,100%,0.03)',
                        color: novaCategoria === c.key ? c.color : 'hsl(0,0%,50%)', transition: 'all 0.15s',
                      }}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={adicionarTarefa}
                  style={{ width: '100%', padding: 'clamp(14px,2.5vw,18px)', borderRadius: 'clamp(12px,2vw,16px)', border: 'none', background: 'linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,42%))', color: 'white', fontSize: 'clamp(14px,2vw,16px)', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 20px hsla(24,100%,50%,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Plus size={18} /> Adicionar
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MORE SHEET ══════════ */}
      <AnimatePresence>
        {showMoreSheet && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMoreSheet(false)} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ maxHeight: '50vh' }}>
              <div className="bottom-sheet-handle" />
              <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', marginBottom: 'clamp(16px,3vw,20px)' }}>Mais Opções</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { icon: <Download size={18} />, label: 'Exportar Dados', sublabel: 'Backup completo (tarefas + notas)', action: exportarDados },
                  { icon: <Upload size={18} />, label: 'Importar Dados', sublabel: 'Restaurar de um backup', action: () => document.getElementById('import-file-input')?.click() },
                  { icon: <Keyboard size={18} />, label: 'Atalhos de Teclado', sublabel: 'Cmd+N, Cmd+F, Cmd+K...', action: () => { setShowMoreSheet(false); setShowShortcuts(true) } },
                  { icon: <RotateCcw size={18} />, label: 'Resetar Tarefas', sublabel: 'Voltar ao estado inicial', action: resetarTarefas, danger: true },
                ].map((item, i) => (
                  <button key={i} onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px,2.5vw,16px)', padding: 'clamp(12px,2.5vw,16px)', borderRadius: 'clamp(12px,2vw,16px)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s', width: '100%' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(0,0%,100%,0.04)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.danger ? 'hsla(0,70%,50%,0.12)' : 'hsla(0,0%,100%,0.06)', color: item.danger ? 'hsl(0,60%,60%)' : 'hsl(0,0%,72%)', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 'clamp(14px,2vw,15px)', fontWeight: 700, color: item.danger ? 'hsl(0,60%,60%)' : 'hsl(0,0%,88%)' }}>{item.label}</div>
                      <div style={{ fontSize: 'clamp(11px,1.4vw,12px)', color: 'hsl(0,0%,40%)', marginTop: '1px' }}>{item.sublabel}</div>
                    </div>
                  </button>
                ))}
              </div>
              <input id="import-file-input" type="file" accept=".json" onChange={importarDados} style={{ display: 'none' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ EDIT TASK SHEET ══════════ */}
      <AnimatePresence>
        {editingTask && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEditSheet} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="bottom-sheet-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(14px,2.5vw,20px)' }}>
                <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pencil size={20} style={{ color: 'hsl(24,100%,50%)' }} /> Editar Tarefa
                </h2>
                <button onClick={closeEditSheet} style={{ background: 'hsla(0,0%,100%,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(0,0%,50%)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,12px)' }}>
                <input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && salvarEdicao()}
                  placeholder="Nome da tarefa..." className="input-glass" autoFocus />
                <textarea value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} placeholder="Descrição (opcional)..."
                  className="input-glass" style={{ resize: 'none', minHeight: '70px' }} rows={2} />
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0,0%,45%)', marginBottom: '6px', display: 'block' }}>Data de Entrega</label>
                  <input type="date" value={editDataEntrega} onChange={(e) => setEditDataEntrega(e.target.value)}
                    className="input-glass" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0,0%,45%)', marginBottom: '6px', display: 'block' }}>Prioridade</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[{ key: 'alta', label: 'Alta', icon: <Flame size={13} /> }, { key: 'media', label: 'Média', icon: <Zap size={13} /> }, { key: 'baixa', label: 'Baixa', icon: <Clipboard size={13} /> }].map((p) => (
                      <button key={p.key} onClick={() => setEditPrioridade(p.key)}
                        style={{ flex: 1, padding: 'clamp(8px,1.5vw,12px)', borderRadius: 'clamp(10px,2vw,14px)',
                          border: editPrioridade === p.key ? '2px solid hsl(24,100%,50%)' : '1px solid hsla(0,0%,100%,0.08)',
                          background: editPrioridade === p.key ? 'hsla(24,100%,50%,0.1)' : 'hsla(0,0%,100%,0.03)',
                          color: editPrioridade === p.key ? 'hsl(24,100%,55%)' : 'hsl(0,0%,50%)',
                          cursor: 'pointer', fontFamily: 'inherit', fontSize: 'clamp(11px,1.4vw,12px)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0,0%,45%)', marginBottom: '6px', display: 'block' }}>Categoria</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CATEGORIAS.map((c) => (
                      <button key={c.key} onClick={() => setEditCategoria(c.key)}
                        style={{
                          padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                          border: editCategoria === c.key ? `2px solid ${c.color}` : '1px solid hsla(0,0%,100%,0.08)',
                          background: editCategoria === c.key ? `${c.color}18` : 'hsla(0,0%,100%,0.03)',
                          color: editCategoria === c.key ? c.color : 'hsl(0,0%,50%)', transition: 'all 0.15s',
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={salvarEdicao}
                  style={{ width: '100%', padding: 'clamp(14px,2.5vw,18px)', borderRadius: 'clamp(12px,2vw,16px)', border: 'none', background: 'linear-gradient(135deg, hsl(24,100%,50%), hsl(24,100%,42%))', color: 'white', fontSize: 'clamp(14px,2vw,16px)', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 20px hsla(24,100%,50%,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                  <Save size={18} /> Salvar Alterações
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ SHORTCUTS MODAL ══════════ */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcuts(false)} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ maxHeight: '60vh' }}>
              <div className="bottom-sheet-handle" />
              <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={20} style={{ color: 'hsl(24,100%,50%)' }} /> Atalhos
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { keys: 'Cmd + N', desc: 'Nova tarefa' },
                  { keys: 'Cmd + F', desc: 'Buscar' },
                  { keys: 'Cmd + K', desc: 'Monitor de tokens' },
                  { keys: '?', desc: 'Mostrar atalhos' },
                  { keys: 'Esc', desc: 'Fechar painel' },
                  { keys: 'Hold +', desc: 'Alternar modo' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '13px', color: 'hsl(0,0%,72%)' }}>{s.desc}</span>
                    <kbd style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0,0%,60%)', background: 'hsla(0,0%,100%,0.06)', padding: '4px 10px', borderRadius: '8px', border: '1px solid hsla(0,0%,100%,0.08)', fontFamily: 'inherit' }}>
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ PROJECT DETAIL VIEW ══════════ */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailView
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onTogglePhase={toggleProjectPhase}
            onAddPhase={addPhaseToProject}
            onRemovePhase={removeProjectPhase}
            onEditPhase={() => {}}
            onAddUpdate={addProjectUpdate}
            onEditProject={openEditProject}
            onDeleteProject={deleteProject}
          />
        )}
      </AnimatePresence>

      {/* ══════════ ADD PROJECT SHEET ══════════ */}
      <AnimatePresence>
        {showAddProjectSheet && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddProjectSheet(false)} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="bottom-sheet-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(14px,2.5vw,20px)' }}>
                <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={20} style={{ color: 'hsl(200,80%,55%)' }} /> Novo Projeto
                </h2>
                <button onClick={() => setShowAddProjectSheet(false)} style={{ background: 'hsla(0,0%,100%,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(0,0%,50%)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,14px)' }}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nome do projeto *"
                  className="input-glass"
                  autoFocus
                />
                <input
                  type="text"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  placeholder="Cliente (opcional)"
                  className="input-glass"
                />
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Descrição (opcional)..."
                  className="input-glass"
                  style={{ resize: 'none', minHeight: '60px' }}
                  rows={2}
                />

                {/* Cor do projeto */}
                <div>
                  <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Cor do Projeto</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setNewProjectColor(c.key)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: c.color,
                          border: newProjectColor === c.key ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: newProjectColor === c.key ? `0 0 12px ${c.color}60` : 'none',
                          transition: 'all 0.2s',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Datas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Data Início</label>
                    <input
                      type="date"
                      value={newProjectStartDate}
                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                      className="input-glass"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Prazo Final</label>
                    <input
                      type="date"
                      value={newProjectDueDate}
                      onChange={(e) => setNewProjectDueDate(e.target.value)}
                      className="input-glass"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addProject}
                  disabled={!newProjectName.trim()}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px,2.5vw,18px)',
                    borderRadius: 'clamp(12px,2vw,16px)',
                    border: 'none',
                    background: newProjectName.trim()
                      ? `linear-gradient(135deg, ${getProjectColor(newProjectColor)}, ${getProjectColor(newProjectColor)}cc)`
                      : 'hsla(0,0%,100%,0.1)',
                    color: newProjectName.trim() ? 'white' : 'hsl(0,0%,40%)',
                    fontSize: 'clamp(14px,2vw,16px)',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: newProjectName.trim() ? 'pointer' : 'default',
                    boxShadow: newProjectName.trim() ? `0 4px 20px ${getProjectColor(newProjectColor)}40` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px',
                  }}
                >
                  <Plus size={18} /> Criar Projeto
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ EDIT PROJECT SHEET ══════════ */}
      <AnimatePresence>
        {editingProject && (
          <>
            <motion.div className="bottom-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEditProject} style={{ zIndex: 2000 }} />
            <motion.div className="bottom-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ maxHeight: '85vh', overflowY: 'auto', zIndex: 2001 }}>
              <div className="bottom-sheet-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(14px,2.5vw,20px)' }}>
                <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: 'hsl(0,0%,95%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pencil size={20} style={{ color: 'hsl(200,80%,55%)' }} /> Editar Projeto
                </h2>
                <button onClick={closeEditProject} style={{ background: 'hsla(0,0%,100%,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(0,0%,50%)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,2vw,14px)' }}>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  placeholder="Nome do projeto *"
                  className="input-glass"
                  autoFocus
                />
                <input
                  type="text"
                  value={editProjectClient}
                  onChange={(e) => setEditProjectClient(e.target.value)}
                  placeholder="Cliente (opcional)"
                  className="input-glass"
                />
                <textarea
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                  placeholder="Descrição (opcional)..."
                  className="input-glass"
                  style={{ resize: 'none', minHeight: '60px' }}
                  rows={2}
                />

                {/* Status */}
                <div>
                  <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Status</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(PROJECT_STATUS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setEditProjectStatus(key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: editProjectStatus === key ? `2px solid ${val.color}` : '1px solid hsla(0,0%,100%,0.1)',
                          background: editProjectStatus === key ? val.bg : 'transparent',
                          color: editProjectStatus === key ? val.color : 'hsl(0,0%,50%)',
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cor do projeto */}
                <div>
                  <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Cor do Projeto</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setEditProjectColor(c.key)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: c.color,
                          border: editProjectColor === c.key ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: editProjectColor === c.key ? `0 0 12px ${c.color}60` : 'none',
                          transition: 'all 0.2s',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Datas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Data Início</label>
                    <input
                      type="date"
                      value={editProjectStartDate}
                      onChange={(e) => setEditProjectStartDate(e.target.value)}
                      className="input-glass"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'hsl(0,0%,50%)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Prazo Final</label>
                    <input
                      type="date"
                      value={editProjectDueDate}
                      onChange={(e) => setEditProjectDueDate(e.target.value)}
                      className="input-glass"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveEditProject}
                  disabled={!editProjectName.trim()}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px,2.5vw,18px)',
                    borderRadius: 'clamp(12px,2vw,16px)',
                    border: 'none',
                    background: editProjectName.trim()
                      ? `linear-gradient(135deg, ${getProjectColor(editProjectColor)}, ${getProjectColor(editProjectColor)}cc)`
                      : 'hsla(0,0%,100%,0.1)',
                    color: editProjectName.trim() ? 'white' : 'hsl(0,0%,40%)',
                    fontSize: 'clamp(14px,2vw,16px)',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: editProjectName.trim() ? 'pointer' : 'default',
                    boxShadow: editProjectName.trim() ? `0 4px 20px ${getProjectColor(editProjectColor)}40` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px',
                  }}
                >
                  <Save size={18} /> Salvar Alterações
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
