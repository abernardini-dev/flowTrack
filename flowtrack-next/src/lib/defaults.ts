import type { Category, Bank, Rule } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Alimentari & Spesa', color: '#f59e0b', icon: '🛒' },
  { name: 'Intrattenimento', color: '#8b5cf6', icon: '🎬' },
  { name: 'Abbonamenti', color: '#f97316', icon: '📋' },
  { name: 'Shopping & Casa', color: '#ec4899', icon: '🛍️' },
  { name: 'Trasporti & Auto', color: '#3b82f6', icon: '🚗' },
  { name: 'Viaggi', color: '#14b8a6', icon: '✈️' },
  { name: 'Stipendio & Entrate', color: '#10b981', icon: '💰' },
  { name: 'Altro', color: '#94a3b8', icon: '📦' },
]

export const DEFAULT_BANKS: Bank[] = [
  {
    id: 'intesa', name: 'Intesa Sanpaolo', label: 'ISP', color: '#10b981', icon: 'intesa.svg',
    csvConfig: { dateCol: 'data', amountType: 'dare-avere', dareCol: 'dare', avereCol: 'avere', descTemplate: '{descrizione}' },
  },
  {
    id: 'revolut', name: 'Revolut', label: 'REV', color: '#0ea5e9', icon: 'revolut.svg',
    csvConfig: { dateCol: 'started date', amountType: 'single', amountCol: 'amount', descTemplate: '{description}', useFee: true },
  },
  {
    id: 'paypal', name: 'PayPal', label: 'PYP', color: '#6366f1', icon: 'paypal.svg',
    csvConfig: { dateCol: 'data', amountType: 'single', amountCol: 'lordo', dateFormat: 'paypal', descTemplate: '{nome} - {descrizione} ({messaggio})' },
  },
  { id: 'contanti', name: 'Contanti', label: 'CON', color: '#f59e0b', icon: 'dollar.svg' },
]

export const CATEGORY_RULES: Rule[] = [
  { category: 'Alimentari & Spesa', keywords: ['esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'md', 'eurospin', 'supermercato', 'alimentari', 'pam', 'd&g', 'sigma', 'cra', 'tigre'] },
  { category: 'Intrattenimento', keywords: ['spotify', 'netflix', 'prime video', 'disney', 'dazn', 'cinema', 'now tv', 'sky', 'apple music', 'youtube premium'] },
  { category: 'Abbonamenti', keywords: ['abbonamento', 'canone', 'palestra', 'vodafone', 'tim', 'wind', 'iliad', 'google one', 'icloud', 'dropbox', 'adobe', 'midjourney', 'chatgpt'] },
  { category: 'Shopping & Casa', keywords: ['amazon', 'zara', 'h&m', 'ikea', 'ebay', 'leroy merlin', 'mediaworld', 'unieuro', 'decathlon', 'zalando', 'shein'] },
  { category: 'Trasporti & Auto', keywords: ['eni', 'shell', 'q8', 'telepass', 'trenitalia', 'uber', 'atm', 'tper', 'flixbus', 'mooney', 'autostrada'] },
  { category: 'Viaggi', keywords: ['hotel', 'booking', 'airbnb', 'volo', 'ryanair', 'expedia', 'viaggio', 'vacanza', 'hostel', 'b&b', 'ibis', 'traghetto', 'nave'] },
  { category: 'Stipendio & Entrate', keywords: ['stipendio', 'bonifico a vostro favore', 'bonifico ricevuto', 'emolumenti', 'riversamento', 'ricarica', 'accredito', 'rimessa'] },
]

export const ICON_OPTIONS = [
  '🛒', '🎬', '📋', '🛍️', '🚗', '✈️', '💰', '📦', '🏠', '⚡', '💡', '📱', '💻', '🎮', '🏋️',
  '👕', '🐱', '🍕', '☕', '🎓', '🏥', '🎵', '📺', '🔧', '🌿', '🎁', '💊', '📚', '🏢', '🖥️',
  '🍎', '🥦', '🥩', '🧀', '🍞', '🥛', '🧃', '🍷', '🍺', '🍝', '🥗', '🍰', '🍩', '🍪', '🧁',
  '🚌', '🚇', '🚲', '🏍️', '🚢', '🚁', '🛵', '🚃', '🅿️', '⛽', '🔋', '🛞', '🗺️',
  '🏥', '💉', '🩺', '🦷', '👁️', '🧠', '💪', '🦴', '🧬', '💊', '🩸',
  '🎮', '🕹️', '🎯', '🎲', '♟️', '🎨', '🎭', '🎪', '🎤', '🎧', '🎸', '🥁', '🎹', '🎺',
  '🏀', '⚽', '⚾', '🎾', '🏐', '🏈', '🎱', '🥊', '🤸', '🏆', '🥇', '🎽', '🏄', '🎿',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐵', '🐔', '🦄', '🐴',
  '🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🌴', '🍁', '🌾', '☀️', '🌙', '⭐', '🌈', '☁️',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💝', '💖', '💫', '✨', '🔥', '💎',
  '📱', '💻', '⌚', '📷', '🎥', '📸', '🖨️', '💾', '💿', '📡', '🔊', '🎙️', '📞', '📟',
  '🏠', '🏡', '🏢', '🏭', '🏗️', '🏖️', '⛺', '🏕️', '🏰', '🗼', '🌆', '🌃', '🎡', '🎠',
  '🚀', '🛸', '🌍', '🌕', '🔭', '🧪', '⚗️', '🔬', '🔮', '🧿', '🎭', '🪄', '🗿', '🛡️',
  '✉️', '📩', '📦', '📎', '📌', '✂️', '🗝️', '🔑', '🔒', '🔓', '🖊️', '📝', '📁', '🗂️',
  '🍼', '🚼', '🧸', '🎈', '🎉', '🎊', '🎀', '🎄', '🎃', '🎅', '🤶', '🦌', '🧊', '🔥',
]
