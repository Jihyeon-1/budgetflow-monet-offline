import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  Check,
  Copy,
  Database,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  firebaseConfig,
  logOut,
  signInAsGuest,
  signInWithGoogle,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSuccessNotice: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccessNotice,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setDomainError(null);
    setGeneralError(null);
    try {
      const user = await signInWithGoogle();
      onSuccessNotice(`Google 계정(${user.email || '연동됨'})으로 Firestore DB 자동 연동 완료!`);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setDomainError(currentHostname);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // User closed popup; do not show scary error
      } else {
        setGeneralError(err?.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoadingGuest(true);
    setGeneralError(null);
    try {
      const user = await signInAsGuest();
      onSuccessNotice(
        `게스트(익명) 계정으로 Firestore DB 실시간 자동 연동이 활성화되었습니다.`
      );
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setGeneralError(
          'Firebase 프로젝트에서 익명(Anonymous) 인증이 활성화되어 있지 않습니다. 로컬 브라우저 저장소 모드로 안전하게 사용하실 수 있습니다.'
        );
      } else {
        setGeneralError(err?.message || '게스트 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      onSuccessNotice('로그아웃되었습니다. 로컬 저장소 모드로 전환됩니다.');
      onClose();
    } catch (err: any) {
      setGeneralError(err?.message || '로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
              <Database className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Firestore DB 연동 & 계정 관리
              </h2>
              <p className="text-xs text-slate-500">
                클라우드 실시간 동기화 및 로컬 데이터 영구 보존
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-4">
          {currentUser ? (
            /* Logged In State */
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
                    </span>
                    <span className="text-xs font-bold text-teal-900">
                      실시간 클라우드 DB 연동 활성
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 rounded-md bg-teal-100/80 px-2 py-0.5">
                    {currentUser.isAnonymous ? '익명 게스트 계정' : 'Google 계정'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.email || '게스트 사용자'}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 truncate">
                      UID: {currentUser.uid}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-teal-800 leading-relaxed">
                  거래 내역, 통장 잔액, 예산 및 투자 자산이 Firebase Firestore에 실시간으로 안전하게 자동 동기화되고 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>계정 로그아웃 (로컬 저장소 모드로 전환)</span>
              </button>
            </div>
          ) : (
            /* Logged Out / Connect State */
            <div className="space-y-4">
              {/* Unauthorized Domain Guide (Only shown if Google Login hits auth/unauthorized-domain) */}
              {domainError && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="font-bold text-amber-900">
                        Firebase 인증 도메인 승인 안내 (auth/unauthorized-domain)
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        현재 프리뷰/개발 도메인이 Firebase Authentication의 <strong>‘승인된 도메인(Authorized Domains)’</strong>에 아직 등록되어 있지 않아 Google 팝업 로그인이 차단되었습니다.
                      </p>

                      {/* Domain copy box */}
                      <div className="rounded-lg border border-amber-200 bg-white/90 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Globe className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                            <span className="font-mono text-[11px] text-slate-800 font-semibold truncate select-all">
                              {currentHostname}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyDomain}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-700" />
                                <span>복사됨!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>도메인 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="text-[11px] text-amber-900/90 space-y-1">
                        <p className="font-semibold text-amber-950">
                          Google 계정으로 연동하려면:
                        </p>
                        <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                          <li>
                            <a
                              href={firebaseSettingsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-teal-800 hover:underline"
                            >
                              <span>Firebase 콘솔 인증 설정 열기</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                          <li>
                            <strong>‘승인된 도메인’</strong> 섹션에 위 도메인을 추가
                          </li>
                          <li>추가 후 아래 <strong>‘Google 로그인 재시도’</strong>를 클릭하세요.</li>
                        </ol>
                      </div>

                      <div className="pt-1 border-t border-amber-200/80">
                        <p className="text-[11px] font-bold text-amber-900">
                          도메인 추가 없이 즉시 DB를 연동하고 싶다면?
                        </p>
                        <button
                          type="button"
                          onClick={handleGuestSignIn}
                          disabled={loadingGuest}
                          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-all shadow-xs"
                        >
                          {loadingGuest ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          )}
                          <span>게스트(익명) 계정으로 지금 즉시 DB 연동하기</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General error message */}
              {generalError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="flex-1">{generalError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loadingGoogle}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-xs"
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {domainError ? 'Google 로그인 다시 시도' : 'Google 계정으로 DB 자동 연동'}
                  </span>
                </button>

                {/* Instant Guest Mode */}
                {!domainError && (
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={loadingGuest}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors"
                  >
                    {loadingGuest ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                    )}
                    <span>게스트(익명) 계정으로 바로 연동</span>
                  </button>
                )}
              </div>

              {/* Local Storage Notice */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>로그인하지 않아도 안전합니다</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Firebase 로그인 없이도 등록하신 모든 수입·지출 내역, 통장, 카테고리, 예산, 투자 자산은 브라우저 <strong>로컬 저장소(LocalStorage)</strong>에 즉시 자동 영구 보존됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
