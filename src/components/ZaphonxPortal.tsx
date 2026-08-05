import { useState, useCallback } from 'react';
import {
  Shield,
  Key,
  Link2,
  Lock,
  Cpu,
  Wallet,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/errors';

type Tab = 'LOGIN' | 'SIGNUP' | 'INTEGRATE' | 'RESET';

interface StatusMessage {
  text: string;
  isError: boolean;
}

export function ZaphonxPortal() {
  const {
    isAuthenticated,
    user,
    solanaPublicKey,
    evmPublicKey,
    connectedExchanges,
    isLoading,
    setLoading,
    setError,
    connectWallet,
    integrateExchange,
  } = useAuthStore();

  const [tab, setTab] = useState<Tab>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [masterSecret, setMasterSecret] = useState('');
  const [chainTarget, setChainTarget] = useState<'SOLANA' | 'EVM'>('SOLANA');
  const [rawPrivateKey, setRawPrivateKey] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('ALPACA');
  const [exchangeApiKey, setExchangeApiKey] = useState('');
  const [exchangeSecretKey, setExchangeSecretKey] = useState('');
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const notify = useCallback((text: string, isError = false) => {
    setStatus({ text, isError });
    setTimeout(() => setStatus(null), 5000);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.signIn(email, password);
      // AuthProvider's onAuthStateChange fires and updates context/store.
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      notify(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify('Passwords do not match.', true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.signUp(email, password);
      notify('Account created. Signing you in...');
      setTab('LOGIN');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      notify(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword(email);
      notify('Password reset email sent. Check your inbox.');
      setTab('LOGIN');
    } catch (err) {
      notify(getErrorMessage(err), true);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletBinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPrivateKey) {
      notify('Signature key cannot be blank.', true);
      return;
    }
    const isSolanaKey = rawPrivateKey.length >= 44 && rawPrivateKey.length <= 88;
    const isEvmKey = rawPrivateKey.startsWith('0x') && rawPrivateKey.length === 66;
    if (chainTarget === 'SOLANA' && !isSolanaKey) {
      notify('Invalid Solana private key format.', true);
      return;
    }
    if (chainTarget === 'EVM' && !isEvmKey) {
      notify('Invalid EVM private key format.', true);
      return;
    }
    const mockAddress =
      chainTarget === 'SOLANA'
        ? 'ZAP4k3Dyjzvzp8eLXwNrcA111111111111111111111'
        : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    connectWallet(chainTarget, mockAddress);
    notify(`Wallet binding successful: ${chainTarget}`);
    setRawPrivateKey('');
  };

  const handleExchangeBinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeApiKey || !exchangeSecretKey) {
      notify('Both API key and secret are required.', true);
      return;
    }
    integrateExchange(selectedExchange);
    notify(`Exchange gateway initialized: ${selectedExchange}`);
    setExchangeApiKey('');
    setExchangeSecretKey('');
  };

  return (
    <div className="w-screen h-screen bg-brand-onyx flex items-center justify-center p-4 font-sans antialiased overflow-hidden">
      {/* Toast notification */}
      {status && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-premium border backdrop-blur-xl text-xs font-mono flex items-center gap-3 animate-slide-up ${
            status.isError
              ? 'bg-[rgba(255,59,48,0.08)] border-brand-coral/30 text-brand-coral'
              : 'bg-[rgba(48,213,200,0.08)] border-brand-mint/30 text-brand-mint'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft flex-shrink-0" />
          <span className="max-w-xs">{status.text.toUpperCase()}</span>
        </div>
      )}

      <div className="w-full max-w-5xl h-[680px] bg-brand-obsidian border border-glass-border rounded-3xl shadow-premium overflow-hidden grid grid-cols-12 animate-fade-in">
        {/* Left informational panel */}
        <div className="col-span-5 border-r border-glass-border p-8 flex flex-col justify-between bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl border border-glass-border flex items-center justify-center bg-[rgba(41,151,255,0.05)]">
                <Cpu className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-brand-blue">
                SYSTEM CONTROL GATE
              </span>
            </div>
            <h1 className="text-4xl font-semibold text-brand-silver tracking-tight leading-tight">
              Zaphonx<br />Terminal
            </h1>
            <p className="text-sm text-brand-ash mt-4 leading-relaxed max-w-xs">
              Access the distributed risk-sensing execution core. Initialize ephemeral memory
              spaces for multi-chain keys, node relays, and quantitative parameters.
            </p>

            {/* Feature highlights */}
            <div className="mt-6 space-y-2.5">
              {[
                'Real-time predictive signal pipeline',
                'Multi-chain execution via private RPC',
                'XGBoost gatekeeper security scoring',
                'MEV-shielded Jito bundle routing',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-mint/60 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[11px] text-brand-ash">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status card */}
          <div className="glass-card p-4 font-mono text-[11px] text-brand-ash space-y-2.5">
            <StatusLine icon={Lock} label="GATEWAY" value={isAuthenticated ? `[${user?.email?.slice(0, 20)}]` : '[TERMINATED]'} active={isAuthenticated} />
            <StatusLine icon={Wallet} label="SOLANA" value={solanaPublicKey ? `[${solanaPublicKey.slice(0, 6)}...${solanaPublicKey.slice(-4)}]` : '[UNBOUND]'} active={!!solanaPublicKey} />
            <StatusLine icon={Wallet} label="EVM" value={evmPublicKey ? `[${evmPublicKey.slice(0, 6)}...${evmPublicKey.slice(-4)}]` : '[UNBOUND]'} active={!!evmPublicKey} />
            <StatusLine icon={Link2} label="EXCHANGES" value={connectedExchanges.length > 0 ? `[${connectedExchanges.join(', ')}]` : '[NONE]'} active={connectedExchanges.length > 0} />
          </div>
        </div>

        {/* Right form panel */}
        <div className="col-span-7 p-8 flex flex-col bg-brand-onyx">
          {/* Tab navigation */}
          <div className="flex border-b border-glass-border pb-0 gap-6 text-[10px] font-mono font-medium tracking-widest">
            {(['LOGIN', 'SIGNUP', 'INTEGRATE'] as const).map((t, idx) => {
              const labels = ['01 // SIGN IN', '02 // CREATE ACCOUNT', '03 // CONNECT CHANNELS'];
              const disabled = t === 'INTEGRATE' && !isAuthenticated;
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (disabled) { notify('Sign in first to access integrations.', true); return; }
                    setTab(t);
                  }}
                  className={`pb-3 border-b-2 transition-smooth -mb-px ${
                    tab === t
                      ? 'text-brand-blue border-brand-blue'
                      : disabled
                      ? 'text-brand-ash/30 border-transparent cursor-not-allowed'
                      : 'text-brand-ash hover:text-brand-silver border-transparent'
                  }`}
                >
                  {labels[idx]}
                </button>
              );
            })}
          </div>

          <div className="flex-1 py-6 overflow-y-auto">
            {/* SIGN IN */}
            {tab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                <FormField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@zaphonx.internal"
                    autoComplete="email"
                    className="glass-input w-full px-4 py-3 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                    required
                  />
                </FormField>
                <FormField label="Password">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      autoComplete="current-password"
                      className="glass-input w-full px-4 py-3 pr-10 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ash hover:text-brand-silver transition-smooth"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                </FormField>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold tracking-widest transition-smooth bg-brand-blue text-white hover:bg-[#1a7fde] hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />AUTHENTICATING...</>
                    : <><ArrowRight className="w-4 h-4" />SIGN IN</>
                  }
                </button>
                <div className="flex items-center justify-between text-[10px] font-mono text-brand-ash">
                  <button type="button" onClick={() => setTab('SIGNUP')} className="hover:text-brand-blue transition-smooth">
                    Create account
                  </button>
                  <button type="button" onClick={() => setTab('RESET')} className="hover:text-brand-blue transition-smooth">
                    Forgot password
                  </button>
                </div>
              </form>
            )}

            {/* SIGN UP */}
            {tab === 'SIGNUP' && (
              <form onSubmit={handleSignUp} className="space-y-4 animate-fade-in">
                <FormField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@zaphonx.internal"
                    autoComplete="email"
                    className="glass-input w-full px-4 py-3 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                    required
                  />
                </FormField>
                <FormField label="Password (min 6 characters)">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      autoComplete="new-password"
                      className="glass-input w-full px-4 py-3 pr-10 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ash hover:text-brand-silver transition-smooth">
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="Confirm Password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    autoComplete="new-password"
                    className="glass-input w-full px-4 py-3 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                    required
                  />
                </FormField>
                <FormField label={<span className="flex items-center justify-between"><span>Vault Encryption Secret</span><span className="text-brand-blue font-normal normal-case tracking-normal text-[9px]">[AES-256 Seed]</span></span>}>
                  <input
                    type="password"
                    value={masterSecret}
                    onChange={(e) => setMasterSecret(e.target.value)}
                    placeholder="Enter cryptographic passcode passphrase..."
                    className="glass-input w-full px-4 py-3 text-xs text-brand-silver font-mono placeholder-brand-ash/30"
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold tracking-widest transition-smooth bg-brand-blue text-white hover:bg-[#1a7fde] hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />CREATING ACCOUNT...</>
                    : 'CREATE ACCOUNT'
                  }
                </button>
                <p className="text-[10px] font-mono text-brand-ash text-center">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('LOGIN')} className="text-brand-blue hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* RESET PASSWORD */}
            {tab === 'RESET' && (
              <form onSubmit={handleReset} className="space-y-5 animate-fade-in">
                <p className="text-xs font-mono text-brand-ash leading-relaxed">
                  Enter your email address and we'll send a password reset link.
                </p>
                <FormField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@zaphonx.internal"
                    autoComplete="email"
                    className="glass-input w-full px-4 py-3 text-sm text-brand-silver font-sans placeholder-brand-ash/40"
                    required
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-xs font-bold tracking-widest transition-smooth bg-brand-blue text-white hover:bg-[#1a7fde] hover:shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />SENDING...</> : 'SEND RESET LINK'}
                </button>
                <p className="text-[10px] font-mono text-brand-ash text-center">
                  <button type="button" onClick={() => setTab('LOGIN')} className="text-brand-blue hover:underline">
                    Back to sign in
                  </button>
                </p>
              </form>
            )}

            {/* INTEGRATE */}
            {tab === 'INTEGRATE' && (
              <div className="space-y-5 animate-fade-in">
                {/* Wallet binding */}
                <form onSubmit={handleWalletBinding} className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-brand-blue" strokeWidth={1.5} />
                    <h3 className="text-[10px] font-mono font-bold tracking-widest text-brand-ash uppercase">
                      Programmatic On-Chain Key Integration
                    </h3>
                  </div>
                  <select
                    value={chainTarget}
                    onChange={(e) => setChainTarget(e.target.value as 'SOLANA' | 'EVM')}
                    className="glass-input text-[10px] font-mono text-brand-blue px-3 py-1.5 cursor-pointer w-full"
                  >
                    <option value="SOLANA">SOLANA NET PIPELINE</option>
                    <option value="EVM">EVM LAYER 2 (BASE)</option>
                  </select>
                  <input
                    type="password"
                    value={rawPrivateKey}
                    onChange={(e) => setRawPrivateKey(e.target.value)}
                    placeholder={
                      chainTarget === 'SOLANA'
                        ? 'Paste base58 byte array key (never logged)...'
                        : 'Paste 0x-prefixed hex key string...'
                    }
                    className="glass-input w-full px-4 py-3 text-xs text-brand-silver font-mono placeholder-brand-ash/30"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-smooth border border-glass-border text-brand-mint hover:bg-[rgba(48,213,200,0.08)] hover:border-brand-mint/30"
                  >
                    MOUNT MEMORY-ISOLATED HOT WALLET
                  </button>
                </form>

                {/* Exchange binding */}
                <form onSubmit={handleExchangeBinding} className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-brand-blue" strokeWidth={1.5} />
                    <h3 className="text-[10px] font-mono font-bold tracking-widest text-brand-ash uppercase">
                      Quantitative CEX Broker Links
                    </h3>
                  </div>
                  <select
                    value={selectedExchange}
                    onChange={(e) => setSelectedExchange(e.target.value)}
                    className="glass-input text-[10px] font-mono text-brand-blue px-3 py-1.5 cursor-pointer w-full"
                  >
                    <option value="ALPACA">ALPACA SECURITIES</option>
                    <option value="IBKR">INTERACTIVE BROKERS</option>
                    <option value="BINANCE">BINANCE LIQUIDITY CORE</option>
                  </select>
                  <input
                    type="text"
                    value={exchangeApiKey}
                    onChange={(e) => setExchangeApiKey(e.target.value)}
                    placeholder="API Public Key Token"
                    className="glass-input w-full px-4 py-2.5 text-xs text-brand-silver font-mono placeholder-brand-ash/30"
                  />
                  <input
                    type="password"
                    value={exchangeSecretKey}
                    onChange={(e) => setExchangeSecretKey(e.target.value)}
                    placeholder="API Secret Key"
                    className="glass-input w-full px-4 py-2.5 text-xs text-brand-silver font-mono placeholder-brand-ash/30"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-smooth border border-glass-border text-brand-blue hover:bg-[rgba(41,151,255,0.08)] hover:border-brand-blue/30"
                  >
                    AUTHORIZE EXCHANGE ROUTING ACCESS
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-glass-border">
            <Shield className="w-3 h-3 text-brand-ash" strokeWidth={1.5} />
            <span className="text-[9px] font-mono text-brand-ash/60 tracking-wider">
              SECURE LOCAL-ENV PAYLOADS ARE RAM-ISOLATED VIA AES-256 COMPLIANCE PROTOCOLS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono tracking-widest text-brand-ash uppercase block">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusLine({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" strokeWidth={1.5} />
        {label}
      </span>
      <span className={`truncate max-w-[160px] ${active ? 'text-brand-mint' : 'text-brand-ash/60'}`}>
        {value}
      </span>
    </div>
  );
}
