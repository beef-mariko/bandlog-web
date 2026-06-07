'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

type Song = {
  id: string
  title: string
  artist: string
  band_key: string
  original_key: string
  tempo: number
  chord_progression: string
  note: string
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filtered, setFiltered] = useState<Song[]>([])
  const [bandId, setBandId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('')
  const [bandKey, setBandKey] = useState('')
  const [tempo, setTempo] = useState('')
  const [chord, setChord] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    const { data: member } = await supabase
      .from('band_members').select('band_id').eq('user_id', user.id).single()
    if (!member) { window.location.href = '/band'; return }
    setBandId(member.band_id)
    fetchSongs(member.band_id)
  }

  async function fetchSongs(bid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('songs').select('*').eq('band_id', bid).order('title')
    setSongs(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
  }

  function handleSearch(q: string) {
    setQuery(q)
    setFiltered(songs.filter(s =>
      s.title?.toLowerCase().includes(q.toLowerCase()) ||
      s.artist?.toLowerCase().includes(q.toLowerCase())
    ))
  }

  async function handleAddSong() {
    if (!title.trim()) { alert('曲名を入力してください'); return }
    const supabase = createClient()
    const { error } = await supabase.from('songs').insert({
      band_id: bandId, title: title.trim(), artist: artist.trim(),
      original_key: originalKey.trim(), band_key: bandKey.trim(),
      tempo: tempo ? parseInt(tempo) : null,
      chord_progression: chord.trim(), note: note.trim(),
    })
    if (error) { alert(error.message); return }
    setTitle(''); setArtist(''); setOriginalKey('')
    setBandKey(''); setTempo(''); setChord(''); setNote('')
    setShowAdd(false)
    fetchSongs(bandId!)
  }

  async function handleDeleteSong(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return
    const supabase = createClient()
    await supabase.from('songs').delete().eq('id', id)
    fetchSongs(bandId!)
  }

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: colors.primary,
    fontSize: '14px', cursor: 'pointer', padding: '0',
  }

  if (showAdd) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', padding: '48px 20px 40px' }}>
        <button onClick={() => setShowAdd(false)} style={navBtn}>← 戻る</button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: '8px 0 20px' }}>曲を追加</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: '曲名 *', value: title, setter: setTitle, placeholder: '例：Lemon', type: 'text' },
            { label: 'アーティスト', value: artist, setter: setArtist, placeholder: '例：米津玄師', type: 'text' },
            { label: 'テンポ（BPM）', value: tempo, setter: setTempo, placeholder: '例：79', type: 'number' },
          ].map(({ label, value, setter, placeholder, type }) => (
            <div key={label}>
              <p style={labelStyle}>{label}</p>
              <input type={type} placeholder={placeholder} value={value}
                onChange={e => setter(e.target.value)} style={inputStyle} />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={labelStyle}>原曲キー</p>
              <input type="text" placeholder="例：Am" value={originalKey}
                onChange={e => setOriginalKey(e.target.value)}
                style={{ ...inputStyle, IMEMode: 'disabled' } as React.CSSProperties}
                lang="en" autoComplete="off" />
            </div>
            <div>
              <p style={labelStyle}>バンドキー</p>
              <input type="text" placeholder="例：G" value={bandKey}
                onChange={e => setBandKey(e.target.value)}
                style={inputStyle} lang="en" autoComplete="off" />
            </div>
          </div>

          <div>
            <p style={labelStyle}>コード進行</p>
            <input type="text" placeholder="例：Am-F-C-G" value={chord}
              onChange={e => setChord(e.target.value)}
              style={inputStyle} lang="en" autoComplete="off" />
          </div>

          <div>
            <p style={labelStyle}>備考・メモ</p>
            <textarea placeholder="いつ取り入れた曲か、練習ポイントなど" value={note}
              onChange={e => setNote(e.target.value)}
              style={{ ...inputStyle, height: '100px', resize: 'none' }} />
          </div>

          <button onClick={handleAddSong} style={primaryBtn}>追加する</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ padding: '48px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => window.location.href = '/home'} style={navBtn}>← ホーム</button>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: 0 }}>曲一覧</h1>
        </div>
        <button onClick={() => setShowAdd(true)} style={addBtn}>＋ 追加</button>
      </div>

      <div style={{ padding: '0 20px 12px' }}>
        <input type="text" placeholder="曲名・アーティストで検索"
          value={query} onChange={e => handleSearch(e.target.value)}
          style={{ ...inputStyle, borderRadius: '999px' }} />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.primary, padding: '40px' }}>読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px' }}>
          {query ? '見つかりませんでした' : '曲がまだ登録されていません'}
        </p>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(song => (
            <div key={song.id} style={{ backgroundColor: colors.card, borderRadius: '12px', padding: '14px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '500', color: colors.textPrimary, margin: '0 0 2px' }}>{song.title}</p>
                <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>{song.artist}</p>
                {song.note && <p style={{ fontSize: '12px', color: colors.textTertiary, margin: '4px 0 0' }}>{song.note}</p>}
              </div>
              <div style={{ backgroundColor: colors.primaryLight, borderRadius: '999px', padding: '4px 10px', fontSize: '13px', fontWeight: '500', color: colors.primary }}>
                {song.band_key || '-'}
              </div>
              <button onClick={() => handleDeleteSong(song.id, song.title)}
                style={{ background: 'none', border: 'none', color: colors.danger, fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '13px', color: colors.textSecondary, fontWeight: '500', margin: '0 0 6px' }
const inputStyle: React.CSSProperties = { backgroundColor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '14px', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }
const primaryBtn: React.CSSProperties = { backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '999px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '8px' }
const addBtn: React.CSSProperties = { backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '999px', padding: '7px 14px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }