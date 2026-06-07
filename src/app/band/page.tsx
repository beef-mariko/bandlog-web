'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

export default function BandPage() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [bandName, setBandName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/'
      else setUserId(data.user.id)
    })
  }, [])

  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'BAND-'
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  async function handleCreateBand() {
    if (!bandName.trim()) { setError('バンド名を入力してください'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const code = generateInviteCode()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: band, error: bandError } = await supabase
      .from('bands')
      .insert({ name: bandName.trim(), invite_code: code, invite_expires_at: expires })
      .select().single()

    if (bandError) { setError(bandError.message); setLoading(false); return }

    await supabase.from('band_members').insert({ band_id: band.id, user_id: userId, role: 'owner' })
    window.location.href = '/home'
  }

  async function handleJoinBand() {
    if (!inviteCode.trim()) { setError('招待コードを入力してください'); return }
    setLoading(true); setError('')
    const supabase = createClient()

    const { data: band, error: bandError } = await supabase
      .from('bands').select()
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .gt('invite_expires_at', new Date().toISOString())
      .single()

    if (bandError || !band) { setError('招待コードが正しくないか期限切れです'); setLoading(false); return }

    const { error: memberError } = await supabase
      .from('band_members').insert({ band_id: band.id, user_id: userId, role: 'member' })

    if (memberError) { setError('すでに参加済みか、エラーが発生しました'); setLoading(false); return }
    window.location.href = '/home'
  }

  if (mode === 'select') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primary, textAlign: 'center', marginBottom: '8px' }}>
            🎸 バンドを選択
          </h1>
          <p style={{ color: colors.textSecondary, textAlign: 'center', fontSize: '14px', marginBottom: '24px' }}>
            新しいバンドを作成するか、既存のバンドに参加してください
          </p>
          <button onClick={() => setMode('create')} style={choiceBtn('#EEEDFE', colors.primary)}>
            <span style={{ fontSize: '24px' }}>➕</span>
            <div>
              <div style={{ fontWeight: '500', fontSize: '15px' }}>バンドを新規作成</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>オーナーとして新しいバンドを作る</div>
            </div>
          </button>
          <button onClick={() => setMode('join')} style={choiceBtn('#FAECE7', colors.danger)}>
            <span style={{ fontSize: '24px' }}>🚪</span>
            <div>
              <div style={{ fontWeight: '500', fontSize: '15px' }}>招待コードで参加</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>メンバーから受け取ったコードで参加</div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button onClick={() => { setMode('select'); setError('') }} style={backBtn}>← 戻る</button>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: colors.primaryDark, marginBottom: '20px' }}>
          {mode === 'create' ? 'バンドを新規作成' : '招待コードで参加'}
        </h1>

        {mode === 'create' ? (
          <input
            type="text" placeholder="バンド名（例：THE NOVEMBERS）"
            value={bandName} onChange={e => setBandName(e.target.value)}
            style={inputStyle}
          />
        ) : (
          <input
            type="text" placeholder="例：BAND-X4K2"
            value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
            maxLength={9}
            style={{ ...inputStyle, fontSize: '20px', textAlign: 'center', letterSpacing: '3px' }}
          />
        )}

        {error && <p style={{ color: colors.danger, fontSize: '14px', margin: '8px 0' }}>{error}</p>}

        <button
          onClick={mode === 'create' ? handleCreateBand : handleJoinBand}
          disabled={loading}
          style={primaryBtn}
        >
          {loading ? '処理中...' : mode === 'create' ? 'バンドを作成する' : '参加する'}
        </button>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: '#f0ede8',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
}
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '400px',
  display: 'flex', flexDirection: 'column', gap: '12px',
}
const inputStyle: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid #E0DEFF',
  borderRadius: '12px', padding: '14px', fontSize: '15px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}
const primaryBtn: React.CSSProperties = {
  backgroundColor: '#534AB7', color: '#fff', border: 'none',
  borderRadius: '999px', padding: '14px', fontSize: '16px',
  fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '8px',
}
const backBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#534AB7',
  fontSize: '14px', cursor: 'pointer', padding: '0', textAlign: 'left',
  marginBottom: '8px',
}
function choiceBtn(bg: string, borderColor: string): React.CSSProperties {
  return {
    backgroundColor: '#fff', border: `1.5px solid ${bg}`,
    borderRadius: '14px', padding: '18px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '14px',
    textAlign: 'left', width: '100%',
  }
}