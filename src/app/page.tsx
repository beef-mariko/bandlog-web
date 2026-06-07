'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { colors } from '@/lib/theme'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAuth() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('メールアドレスまたはパスワードが違います')
      else window.location.href = '/home'
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        await supabase.from('users').insert({ id: data.user.id, name })
        window.location.href = '/band'
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: colors.background,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎸</div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: colors.primary, margin: 0 }}>BandLog</h1>
          <p style={{ color: colors.textSecondary, marginTop: '4px' }}>
            {isLogin ? 'ログイン' : 'アカウント登録'}
          </p>
        </div>

        {!isLogin && (
          <input
            type="text"
            placeholder="表示名"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="パスワード（8文字以上）"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: colors.danger, fontSize: '14px', margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            backgroundColor: colors.primary, color: '#fff',
            border: 'none', borderRadius: '999px',
            padding: '14px', fontSize: '16px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
        </button>

        <button
          onClick={() => { setIsLogin(!isLogin); setError('') }}
          style={{
            background: 'none', border: 'none',
            color: colors.primary, fontSize: '14px',
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          {isLogin ? 'アカウントをお持ちでない方はこちら' : 'ログインはこちら'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#fff', border: `1px solid #E0DEFF`,
  borderRadius: '12px', padding: '14px',
  fontSize: '15px', outline: 'none', width: '100%',
  boxSizing: 'border-box',
}