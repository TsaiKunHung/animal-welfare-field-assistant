import { useState } from 'react'
import { useApp } from '../store/AppState.jsx'
import { navigate } from '../router.jsx'
import { Button, Checkbox, Input } from '../components/ui.jsx'
import { Shield } from '../components/icons.jsx'

/*
  F0 外勤登入頁 — Figma page 10731:3097
  六個子畫面（F0-1 ~ F0-6）在同一個元件裡用 step 切換，與 Figma 的 frame 對應：
    login → forgot → sent → reset → resetDone → welcome
  版型數值來自 get_design_context(11048:4750)：card w440 / p40 / gap32 / r16 / shadow-lg
*/

const CARD = 'flex w-[440px] flex-col items-center gap-8 rounded-xl border border-hairline bg-white p-10 shadow-lg'

function Logo() {
  return (
    <div className="flex size-14 items-center justify-center rounded-[16.8px] bg-field-600">
      <Shield className="size-7 text-white" />
    </div>
  )
}

function Header({ title, sub, titleSize = 'text-[26px]' }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Logo />
      <p className={`${titleSize} text-center font-bold text-ink`}>{title}</p>
      {sub && (
        <p className="text-center text-[15px] whitespace-pre-line text-ink-sub">{sub}</p>
      )}
    </div>
  )
}

export default function F0Login() {
  const { state, dispatch } = useApp()
  const [step, setStep] = useState('login')
  const [remember, setRemember] = useState(false)

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-canvas">
      {step === 'login' && (
        <div className={CARD} data-figma="11048:4750">
          <Header title="外勤小助手" sub="歡迎回來，請登入您的帳號" />
          <div className="flex w-full flex-col items-center gap-5">
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-sm leading-5 font-medium text-neutral-700">帳號</span>
              <Input placeholder="請輸入帳號" defaultValue="chen.chienhung" />
            </label>
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-sm leading-5 font-medium text-neutral-700">密碼</span>
              <Input type="password" placeholder="請輸入密碼" defaultValue="demo1234" />
            </label>
            <div className="flex w-full items-center justify-between">
              <Checkbox checked={remember} onChange={setRemember} label="記住我" />
              <button
                className="text-sm leading-5 font-medium text-field-700"
                onClick={() => setStep('forgot')}
              >
                忘記密碼？
              </button>
            </div>
            <Button className="w-full" onClick={() => setStep('welcome')}>
              登入
            </Button>
          </div>
          <p className="w-full text-center text-sm text-ink-sub">尚未有帳號？請聯絡系統管理員</p>
        </div>
      )}

      {step === 'forgot' && (
        <div className={CARD} data-figma="11048:4765">
          <Header title="忘記密碼？" sub="輸入帳號，我們將寄送重設密碼連結給您" titleSize="text-[30px]" />
          <div className="flex w-full flex-col gap-5">
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-sm leading-5 font-medium text-neutral-700">帳號</span>
              <Input placeholder="請輸入帳號" />
            </label>
            <Button className="w-full" onClick={() => setStep('sent')}>
              寄送重設連結
            </Button>
            <button
              className="w-full text-center text-sm leading-5 font-medium text-field-700"
              onClick={() => setStep('login')}
            >
              ← 返回登入
            </button>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div className={CARD} data-figma="11048:4776">
          <Header
            title="請查看您的信箱"
            sub={'重設密碼連結已寄出，\n請至信箱點擊連結繼續'}
            titleSize="text-[30px]"
          />
          <div className="flex w-full flex-col gap-5">
            <Button className="w-full" onClick={() => setStep('reset')}>
              我已收到連結
            </Button>
            <button
              className="w-full text-center text-sm leading-5 font-medium text-field-700"
              onClick={() => setStep('sent')}
            >
              沒有收到信件？重新傳送
            </button>
          </div>
        </div>
      )}

      {step === 'reset' && (
        <div className={CARD} data-figma="11048:4786">
          <Header title="設定新密碼" sub="請設定新密碼，長度至少 8 碼" titleSize="text-[30px]" />
          <div className="flex w-full flex-col gap-5">
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-sm leading-5 font-medium text-neutral-700">新密碼</span>
              <Input type="password" placeholder="請輸入新密碼" />
            </label>
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-sm leading-5 font-medium text-neutral-700">確認新密碼</span>
              <Input type="password" placeholder="請再次輸入新密碼" />
            </label>
            <Button className="w-full" onClick={() => setStep('resetDone')}>
              確認重設
            </Button>
            <button
              className="w-full text-center text-sm leading-5 font-medium text-field-700"
              onClick={() => setStep('login')}
            >
              ← 返回登入
            </button>
          </div>
        </div>
      )}

      {step === 'resetDone' && (
        <div className={CARD} data-figma="11048:4798">
          <Header title="密碼已重設" sub="您的密碼已成功更新，請使用新密碼登入" titleSize="text-[30px]" />
          <Button className="w-full" onClick={() => setStep('login')}>
            返回登入
          </Button>
        </div>
      )}

      {step === 'welcome' && (
        <div className="flex w-[440px] flex-col items-center rounded-xl border border-hairline bg-white p-10 shadow-lg" data-figma="11048:4807">
          <div className="mt-2 flex size-26 items-center justify-center rounded-full bg-field-100 text-[48px] leading-none font-bold text-field-700">
            {state.user.name[0]}
          </div>
          <div className="mt-[52px] flex w-full flex-col items-center gap-1.5">
            <p className="text-[15px] text-ink-sub">歡迎回來</p>
            <p className="text-[30px] font-bold text-ink">
              {state.user.name} {state.user.title}
            </p>
            <p className="text-[15px] text-ink-sub">{state.user.org}</p>
          </div>
          <Button
            className="mt-7 w-full"
            onClick={() => {
              dispatch({ type: 'SIGN_IN' })
              navigate('f1')
            }}
          >
            開始今日行程
          </Button>
        </div>
      )}
    </div>
  )
}
