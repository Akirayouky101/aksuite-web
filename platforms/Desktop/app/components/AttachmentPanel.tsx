'use client'

import { Download, FileUp, Paperclip, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Attachment = { id: string; storage_path: string; file_name: string; content_type: string | null; size_bytes: number }

export default function AttachmentPanel({ entityType, entityId }: { entityType: 'note' | 'client' | 'call' | 'payment'; entityId: string }) {
  const [items, setItems] = useState<Attachment[]>([]); const [uploading, setUploading] = useState(false)
  const load = async () => { const { data } = await supabase.from('item_attachments').select('*').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false }); setItems(data || []) }
  useEffect(() => { void load() }, [entityType, entityId])
  const upload = async (file: File) => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; setUploading(true); try { const path = `${user.id}/${entityType}/${entityId}/${crypto.randomUUID()}-${file.name}`; const { error } = await supabase.storage.from('attachments').upload(path, file); if (error) throw error; const { error: metadataError } = await supabase.from('item_attachments').insert({ user_id: user.id, entity_type: entityType, entity_id: entityId, storage_path: path, file_name: file.name, content_type: file.type || null, size_bytes: file.size }); if (metadataError) throw metadataError; await load() } finally { setUploading(false) } }
  const download = async (item: Attachment) => { const { data } = await supabase.storage.from('attachments').createSignedUrl(item.storage_path, 60); if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener') }
  const remove = async (item: Attachment) => { await supabase.storage.from('attachments').remove([item.storage_path]); await supabase.from('item_attachments').delete().eq('id', item.id); await load() }
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400"><Paperclip className="h-3.5 w-3.5" />Allegati</span><label className="cursor-pointer rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><FileUp className="h-4 w-4" /><input type="file" className="hidden" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = '' }} /></label></div>{items.map(item => <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"><Paperclip className="h-4 w-4 text-slate-400" /><span className="min-w-0 flex-1 truncate">{item.file_name}</span><button type="button" onClick={() => void download(item)} title="Apri"><Download className="h-4 w-4" /></button><button type="button" onClick={() => void remove(item)} title="Elimina" className="text-rose-500"><Trash2 className="h-4 w-4" /></button></div>)}{!items.length && <p className="text-xs text-slate-400">Nessun allegato.</p>}</div>
}