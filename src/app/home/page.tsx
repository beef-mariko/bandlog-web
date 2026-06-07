'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

type Band = { id: string; name: string; invite_code: string }

export default function HomePage() {
  const [band, setBand] = useState<Band | null>(null)
  const [songCount, setSongCount] = useState(0)
  const [liveCount, setLiveCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'home' | 'songs' | 'lives' | 'settings'>('home')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }

    const { data: member } = await supabase
      .from('band_members').select('band_id').eq('user_id', user.id).single()
    if (!member) { window.location.href = '/band'; return }

    const bandId = member.band_id
    const [bandRes, songRes, liveRes, memberRes] = await Promise.all([
      supabase.from('bands').select('*').eq('id', bandId).single(),
      supabase.from('songs').select('id', { count: 'exact' }).eq('band_id', bandId),
      supabase.from('lives').select('id', { count: 'exact' }).eq('band_id', bandId),
      supabase.from('band_members').select('id', { count: 'exact' }).eq('band_id', bandId),
    ])
    setBand(bandRes.data)
    setSongCount(songRes.count ?? 0)
    setLiveCount(liveRes.count ?? 0)
    setMemberCount(memberRes.count ?? 0)
    setLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: colors.primary }}>読み込み中...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', position: 'relative', paddingBottom: '80px' }}>
      {/* ヘッダー */}
      <div style={{ padding: '48px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: colors.primaryMid, margin: 0 }}>🎸 BandLog</p>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: '2px 0 0' }}>{band?.name}</h1>
        </div>
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: colors.danger, fontSize: '13px', cursor: 'pointer' }}>
          ログアウト
        </button>
      </div>

      {/* 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '0 20px 16px' }}>
        {[
          { num: songCount, label: '登録曲数' },
          { num: liveCount, label: 'ライブ回数' },
          { num: memberCount, label: 'メンバー' },
        ].map(({ num, label }) => (
          <div key={label} style={{ backgroundColor: colors.card, borderRadius: '12px', padding: '14px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '26px', fontWeight: '600', color: colors.primary }}>{num}</div>
            <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* メニュー */}
      <div style={{ margin: '0 20px', backgroundColor: colors.card, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        {[
          { icon: '🎵', label: '曲一覧', tab: 'songs' },
          { icon: '📅', label: 'ライブ履歴', tab: 'lives' },
          { icon: '⚙️', label: '設定', tab: 'settings' },
        ].map(({ icon, label, tab }) => (
          <button key={tab} onClick={() => window.location.href = `/${tab}`}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px', background: 'none', border: 'none', borderBottom: `0.5px solid ${colors.border}`, cursor: 'pointer', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span style={{ flex: 1, fontSize: '15px', color: colors.textPrimary, textAlign: 'left' }}>{label}</span>
            <span style={{ color: colors.textSecondary, fontSize: '18px' }}>›</span>
          </button>
        ))}
      </div>

      {/* 招待コード（小さめ） */}
      <div style={{ margin: '16px 20px 0', backgroundColor: colors.card, borderRadius: '14px', border: `1px solid ${colors.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '11px', color: colors.textSecondary, margin: '0 0 2px' }}>招待コード</p>
          <p style={{ fontSize: '16px', fontWeight: '500', color: colors.primary, letterSpacing: '2px', margin: 0 }}>{band?.invite_code}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(band?.invite_code ?? ''); alert('コピーしました！') }}
          style={{ backgroundColor: colors.primaryLight, border: 'none', borderRadius: '999px', padding: '6px 14px', fontSize: '13px', color: colors.primary, cursor: 'pointer' }}>
          コピー
        </button>
      </div>
    </div>
  )
}