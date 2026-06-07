'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

type Live = {
  id: string
  live_date: string
  venue: string
  event_name: string
  memo: string
}

type Member = {
  user_id: string
  users: any
}

export default function LivesPage() {
  const [lives, setLives] = useState<Live[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [bandId, setBandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [eventName, setEventName] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [guestName, setGuestName] = useState('')
  const [guests, setGuests] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    const { data: member } = await supabase
      .from('band_members').select('band_id').eq('user_id', user.id).single()
    if (!member) { window.location.href = '/band'; return }
    setBandId(member.band_id)
    const { data: membersData } = await supabase
      .from('band_members').select('user_id, users(name)').eq('band_id', member.band_id)
    setMembers(membersData ?? [])
    setSelectedMembers(membersData?.map((m: Member) => m.user_id) ?? [])
    fetchLives(member.band_id)
  }

  async function fetchLives(bid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('lives').select('*').eq('band_id', bid)
      .order('live_date', { ascending: false })
    setLives(data ?? [])
    setLoading(false)
  }

  function toggleMember(userId: string) {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  function addGuest() {
    if (!guestName.trim()) return
    setGuests(prev => [...prev, guestName.trim()])
    setGuestName('')
  }

  async function handleAddLive() {
    if (!date || !venue.trim()) { alert('日付と会場名を入力してください'); return }
    if (submitting) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('lives').insert({
      band_id: bandId, live_date: date,
      venue: venue.trim(), event_name: eventName.trim(), memo: memo.trim(),
    })
    if (error) { alert(error.message); setSubmitting(false); return }
    setDate(''); setVenue(''); setEventName(''); setMemo('')
    setGuests([]); setShowAdd(false); setSubmitting(false)
    fetchLives(bandId!)
  }

  async function handleDeleteLive(id: string, venue: string) {
    if (!confirm(`「${venue}」のライブを削除しますか？`)) return
    const supabase = createClient()
    await supabase.from('lives').delete().eq('id', id)
    fetchLives(bandId!)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  // 年ごとにグループ化
  function groupByYear(lives: Live[]) {
    const groups: { [year: string]: Live[] } = {}
    lives.forEach(live => {
      const year = new Date(live.live_date).getFullYear().toString()
      if (!groups[year]) groups[year] = []
      groups[year].push(live)
    })
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a))
  }

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: colors.primary,
    fontSize: '14px', cursor: 'pointer', padding: '0',
  }

  if (showAdd) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', padding: '48px 20px 40px' }}>
        <button onClick={() => setShowAdd(false)} style={navBtn}>← 戻る</button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: '8px 0 20px' }}>ライブを追加</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={labelStyle}>日付 *</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'light' }} />
          </div>
          <div>
            <p style={labelStyle}>会場名 *</p>
            <input type="text" placeholder="例：下北沢 SHELTER" value={venue}
              onChange={e => setVenue(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <p style={labelStyle}>イベント名（任意）</p>
            <input type="text" placeholder="例：春のワンマンライブ" value={eventName}
              onChange={e => setEventName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <p style={labelStyle}>参加メンバー</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {members.map(member => {
                const selected = selectedMembers.includes(member.user_id)
                return (
                  <button key={member.user_id} onClick={() => toggleMember(member.user_id)}
                    style={{
                      padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', fontSize: '14px',
                      border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                      backgroundColor: selected ? colors.primaryLight : '#fff',
                      color: selected ? colors.primary : colors.textSecondary,
                      fontWeight: selected ? '500' : '400',
                    }}>
                    {selected ? '✓ ' : ''}{member.users?.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p style={labelStyle}>ゲスト（任意）</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="ゲスト名" value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGuest()}
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addGuest} style={{ ...addBtnStyle, whiteSpace: 'nowrap' }}>追加</button>
            </div>
            {guests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {guests.map(g => (
                  <span key={g} style={{ backgroundColor: colors.dangerLight, borderRadius: '999px', padding: '6px 12px', fontSize: '13px', color: colors.danger, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {g}
                    <button onClick={() => setGuests(prev => prev.filter(x => x !== g))}
                      style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p style={labelStyle}>メモ（任意）</p>
            <textarea placeholder="メモを入力" value={memo} onChange={e => setMemo(e.target.value)}
              style={{ ...inputStyle, height: '100px', resize: 'none' }} />
          </div>

          <button onClick={handleAddLive} disabled={submitting}
            style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? '追加中...' : '追加する'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ padding: '48px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => window.location.href = '/home'} style={navBtn}>← ホーム</button>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: 0 }}>ライブ履歴</h1>
        </div>
        <button onClick={() => setShowAdd(true)} style={addBtnStyle}>＋ 追加</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.primary, padding: '40px' }}>読み込み中...</p>
      ) : lives.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px' }}>ライブがまだ登録されていません</p>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupByYear(lives).map(([year, yearLives]) => (
            <div key={year}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: colors.primaryMid, margin: '0 0 10px', letterSpacing: '0.5px' }}>
                {year}年 · {yearLives.length}件
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {yearLives.map(live => (
                  <div key={live.id} style={{ backgroundColor: colors.card, borderRadius: '12px', padding: '14px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: colors.primaryLight, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: colors.primaryMid, fontWeight: '500' }}>
                        {new Date(live.live_date).getMonth() + 1}月
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: '600', color: colors.primary, lineHeight: 1.2 }}>
                        {new Date(live.live_date).getDate()}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      {live.event_name && <p style={{ fontSize: '12px', color: colors.primary, fontWeight: '500', margin: '0 0 2px' }}>{live.event_name}</p>}
                      <p style={{ fontSize: '15px', fontWeight: '500', color: colors.textPrimary, margin: 0 }}>{live.venue}</p>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '2px 0 0' }}>{formatDate(live.live_date)}</p>
                    </div>
                    <button onClick={() => handleDeleteLive(live.id, live.venue)}
                      style={{ background: 'none', border: 'none', color: colors.danger, fontSize: '18px', cursor: 'pointer', padding: '4px' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
const addBtnStyle: React.CSSProperties = { backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '999px', padding: '7px 14px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }