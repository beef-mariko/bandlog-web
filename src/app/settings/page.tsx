'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

type Member = {
  id: string
  user_id: string
  role: string
  users: { name: string }
}

type Band = {
  id: string
  name: string
  invite_code: string
  invite_expires_at: string
}

export default function SettingsPage() {
  const [band, setBand] = useState<Band | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [myRole, setMyRole] = useState('')
  const [myUserId, setMyUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    setMyUserId(user.id)

    const { data: member } = await supabase
      .from('band_members').select('band_id, role').eq('user_id', user.id).single()
    if (!member) { window.location.href = '/band'; return }

    setMyRole(member.role)
    const [bandRes, membersRes] = await Promise.all([
      supabase.from('bands').select('*').eq('id', member.band_id).single(),
      supabase.from('band_members').select('id, user_id, role, users(name)').eq('band_id', member.band_id),
    ])
    setBand(bandRes.data)
    setMembers(membersRes.data ?? [])
    setLoading(false)
  }

  async function handleRemoveMember(memberId: string, name: string) {
    if (!confirm(`${name}をバンドから削除しますか？`)) return
    const supabase = createClient()
    await supabase.from('band_members').delete().eq('id', memberId)
    init()
  }

  async function handleSignOut() {
    if (!confirm('ログアウトしますか？')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(band?.invite_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: colors.primary }}>読み込み中...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, maxWidth: '480px', margin: '0 auto', padding: '48px 20px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => window.location.href = '/home'}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '14px', cursor: 'pointer', padding: 0 }}>
          ← ホーム
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: colors.primaryDark, margin: 0 }}>設定</h1>
      </div>

      {/* バンド情報 */}
      <div style={cardStyle}>
        <p style={labelStyle}>バンド</p>
        <p style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, margin: '0 0 4px' }}>{band?.name}</p>
        <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>メンバー {members.length}人</p>
      </div>

      {/* 招待コード（オーナーのみ） */}
      {myRole === 'owner' && (
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <p style={labelStyle}>招待コード</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: '600', color: colors.primary, letterSpacing: '3px', margin: '0 0 4px' }}>
                {band?.invite_code}
              </p>
              <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                有効期限：{formatDate(band?.invite_expires_at ?? '')}
              </p>
            </div>
            <button onClick={copyInviteCode}
              style={{ backgroundColor: copied ? colors.successLight : colors.primaryLight, border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', color: copied ? colors.success : colors.primary, cursor: 'pointer', fontWeight: '500' }}>
              {copied ? '✓ コピー済み' : 'コピー'}
            </button>
          </div>
        </div>
      )}

      {/* メンバー一覧 */}
      <div style={{ ...cardStyle, marginTop: '12px' }}>
        <p style={labelStyle}>メンバー</p>
        {members.map((member, i) => (
          <div key={member.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            paddingTop: i === 0 ? '0' : '10px',
            paddingBottom: i === members.length - 1 ? '0' : '10px',
            borderBottom: i === members.length - 1 ? 'none' : `0.5px solid ${colors.border}`,
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: colors.primary }}>
                {member.users?.name?.charAt(0) ?? '?'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary, margin: 0 }}>
                {member.users?.name}
                {member.user_id === myUserId && <span style={{ fontSize: '12px', color: colors.textSecondary }}> （あなた）</span>}
              </p>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '500', borderRadius: '999px', padding: '3px 10px',
              backgroundColor: member.role === 'owner' ? colors.primaryLight : colors.successLight,
              color: member.role === 'owner' ? colors.primary : colors.success,
            }}>
              {member.role === 'owner' ? 'オーナー' : 'メンバー'}
            </span>
            {myRole === 'owner' && member.role !== 'owner' && (
              <button onClick={() => handleRemoveMember(member.id, member.users?.name)}
                style={{ background: 'none', border: 'none', color: colors.danger, fontSize: '13px', cursor: 'pointer' }}>
                削除
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ログアウト */}
      <button onClick={handleSignOut}
        style={{ width: '100%', marginTop: '12px', backgroundColor: '#fff', border: `1px solid ${colors.dangerLight}`, borderRadius: '14px', padding: '16px', fontSize: '15px', color: colors.danger, fontWeight: '500', cursor: 'pointer' }}>
        ログアウト
      </button>
    </div>
  )
}

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '14px', padding: '16px', border: `1px solid ${colors.border}` }
const labelStyle: React.CSSProperties = { fontSize: '11px', color: colors.primary, fontWeight: '500', letterSpacing: '0.5px', margin: '0 0 8px', textTransform: 'uppercase' }