'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AuthUser,
  CreatorDashboardData,
  InteractionItem,
  BankItem,
  apiRequest,
  logout,
  getCreatorDashboard,
  getBanksList,
  resolveBankAccount,
  connectBankAccount,
  updateCreatorProfile,
  getInboxInteractions,
  markInteractionRead,
  changePassword,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Tab = 'overview' | 'inbox' | 'profile' | 'payouts' | 'security';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [dashboardData, setDashboardData] = useState<CreatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  // Inbox State
  const [inboxItems, setInboxItems] = useState<InteractionItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [bioText, setBioText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [minFeeNaira, setMinFeeNaira] = useState(2500);
  const [tipPresetsNaira, setTipPresetsNaira] = useState('2000, 5000, 10000');
  const [publicWallEnabled, setPublicWallEnabled] = useState(true);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bank Onboarding State
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [resolvingBank, setResolvingBank] = useState(false);
  const [connectingBank, setConnectingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize Session & Dashboard
  useEffect(() => {
    let active = true;

    apiRequest<{ user: AuthUser }>('/auth/me/')
      .then((res) => {
        if (!active) return;
        setCurrentUser(res.user);
        return getCreatorDashboard();
      })
      .then((data) => {
        if (!active || !data) return;
        setDashboardData(data);
        populateProfileForm(data.creator);
      })
      .catch(() => {
        if (active) router.replace('/login');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  // Load Banks List
  useEffect(() => {
    getBanksList()
      .then((res) => setBanks(res.banks || []))
      .catch(() => {});
  }, []);

  // Load Inbox when tab is 'inbox' or filter changes
  useEffect(() => {
    if (activeTab !== 'inbox') return;
    setInboxLoading(true);
    getInboxInteractions({ status: inboxFilter === 'all' ? undefined : inboxFilter })
      .then((res) => setInboxItems(res.results || []))
      .catch(() => setInboxItems([]))
      .finally(() => setInboxLoading(false));
  }, [activeTab, inboxFilter]);

  function populateProfileForm(creator: CreatorDashboardData['creator']) {
    setDisplayName(creator.display_name || '');
    setBioText(creator.bio_text || '');
    setAvatarUrl(creator.avatar_url || '');
    setMinFeeNaira(Math.round(creator.min_message_fee_kobo / 100));
    setTipPresetsNaira(
      creator.tip_presets_kobo && creator.tip_presets_kobo.length > 0
        ? creator.tip_presets_kobo.map((k) => Math.round(k / 100)).join(', ')
        : '2000, 5000, 10000'
    );
    setPublicWallEnabled(creator.public_supporter_wall_enabled);
    setLeaderboardPeriod(creator.leaderboard_period || 'weekly');
    setNotifyEmail(creator.notify_email);
    setNotifyWhatsapp(creator.notify_whatsapp);
    setWhatsappPhone(creator.whatsapp_phone_number || '');
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function handleCopyProfileLink() {
    if (!dashboardData?.creator?.username) return;
    const url = `${window.location.origin}/${dashboardData.creator.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Handle Bank Account Resolution
  async function handleResolveAccount() {
    setBankMsg(null);
    if (!selectedBankCode || accountNumber.length !== 10) {
      setBankMsg({ text: 'Please select a bank and enter a valid 10-digit account number.', type: 'error' });
      return;
    }
    setResolvingBank(true);
    try {
      const res = await resolveBankAccount(accountNumber, selectedBankCode);
      setResolvedAccountName(res.account_name);
      setBankMsg({ text: `Verified Account Name: ${res.account_name}`, type: 'success' });
    } catch (err) {
      setResolvedAccountName('');
      setBankMsg({ text: err instanceof Error ? err.message : 'Could not resolve account.', type: 'error' });
    } finally {
      setResolvingBank(false);
    }
  }

  // Handle Bank Subaccount Connection
  async function handleConnectBank(e: React.FormEvent) {
    e.preventDefault();
    setBankMsg(null);
    const bankObj = banks.find((b) => b.code === selectedBankCode);
    const bankName = bankObj ? bankObj.name : selectedBankCode;

    setConnectingBank(true);
    try {
      await connectBankAccount({
        bank_code: selectedBankCode,
        bank_name: bankName,
        account_number: accountNumber,
      });
      setBankMsg({ text: 'Paystack subaccount successfully linked! Payouts are now active.', type: 'success' });
      const updated = await getCreatorDashboard();
      setDashboardData(updated);
    } catch (err) {
      setBankMsg({ text: err instanceof Error ? err.message : 'Failed to connect bank account.', type: 'error' });
    } finally {
      setConnectingBank(false);
    }
  }

  // Handle Profile Update
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    try {
      const parsedPresets = tipPresetsNaira
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n >= 100)
        .map((n) => Math.round(n * 100));

      const payload = {
        display_name: displayName.trim(),
        bio_text: bioText.trim(),
        avatar_url: avatarUrl.trim(),
        min_message_fee_kobo: Math.round(minFeeNaira * 100),
        tip_presets_kobo: parsedPresets.length > 0 ? parsedPresets : [200000, 500000, 1000000],
        public_supporter_wall_enabled: publicWallEnabled,
        leaderboard_period: leaderboardPeriod,
        notify_email: notifyEmail,
        notify_whatsapp: notifyWhatsapp,
        whatsapp_phone_number: whatsappPhone.trim(),
      };

      await updateCreatorProfile(payload);
      setProfileMsg({ text: 'Profile preferences updated successfully!', type: 'success' });
      const updated = await getCreatorDashboard();
      setDashboardData(updated);
    } catch (err) {
      setProfileMsg({ text: err instanceof Error ? err.message : 'Could not update profile.', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  }

  // Handle Mark Interaction Read
  async function handleMarkRead(id: string) {
    try {
      await markInteractionRead(id);
      setInboxItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, payment_status: 'read' } : item))
      );
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          metrics: {
            ...dashboardData.metrics,
            unread_messages_count: Math.max(0, dashboardData.metrics.unread_messages_count - 1),
          },
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark read');
    }
  }

  // Handle Password Change
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ text: 'Password successfully changed!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: err instanceof Error ? err.message : 'Could not change password.', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-16 flex flex-col items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-secondary-text">Loading creator workspace…</p>
      </main>
    );
  }

  const creator = dashboardData?.creator;
  const metrics = dashboardData?.metrics;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 max-w-5xl mx-auto bg-background">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-black tracking-tight text-dark">
            gate<span className="text-primary">.</span>
          </Link>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Creator Workspace
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          {creator?.username && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${creator.username}`} target="_blank">
                View page <span aria-hidden="true" className="text-primary">↗</span>
              </Link>
            </Button>
          )}
          <Button onClick={handleLogout} variant="ghost" size="sm">
            Log out
          </Button>
        </div>
      </nav>

      {/* Hero Welcome & Link Sharing */}
      <Card className="mt-6 sm:mt-8 p-6 border-border bg-surface shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-dark">
              Welcome, {creator?.display_name || currentUser?.display_name || 'Creator'}.
            </h1>
            <p className="text-xs text-secondary-text mt-1">
              Your public bio link: <strong className="text-dark">gate.ng/{creator?.username}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyProfileLink} size="sm">
              {copied ? 'Link Copied ✓' : 'Copy Bio Link ↗'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {(
          [
            { id: 'overview', label: 'Overview' },
            {
              id: 'inbox',
              label: `Inbox${metrics?.unread_messages_count ? ` (${metrics.unread_messages_count})` : ''}`,
            },
            { id: 'profile', label: 'Profile & Pricing' },
            {
              id: 'payouts',
              label: `Bank Payouts ${creator?.subaccount_status === 'active' ? '✓' : '⚠️'}`,
            },
            { id: 'security', label: 'Security' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            type="button"
            className={`py-2 px-4 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-dark text-white'
                : 'text-secondary-text hover:text-dark hover:bg-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="mt-6 space-y-6">
          {/* Subaccount Action Banner if not connected */}
          {creator?.subaccount_status !== 'active' && (
            <div className="p-4 sm:p-5 bg-background border border-primary/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-wider">Payout setup required</p>
                <p className="text-sm font-semibold text-dark mt-0.5">
                  Connect your Nigerian bank account to start receiving Paystack transfers.
                </p>
              </div>
              <Button onClick={() => setActiveTab('payouts')} size="sm">
                Connect bank ↗
              </Button>
            </div>
          )}

          {/* Revenue & Interaction Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 border-border bg-surface">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Total Earned</p>
              <p className="text-2xl font-black mt-2 text-dark">
                ₦{((metrics?.verified_earnings_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-secondary-text mt-1">Gross verified payments</p>
            </Card>

            <Card className="p-5 border-border bg-surface">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Net Payout</p>
              <p className="text-2xl font-black mt-2 text-success">
                ₦{((metrics?.net_earnings_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-secondary-text mt-1">Creator allocation (90%)</p>
            </Card>

            <Card className="p-5 border-border bg-surface">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Platform Fee</p>
              <p className="text-2xl font-black mt-2 text-primary">
                ₦{((metrics?.platform_fees_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-secondary-text mt-1">Transparent 10% fee</p>
            </Card>

            <Card className="p-5 border-border bg-surface">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">Interactions</p>
              <p className="text-2xl font-black mt-2 text-dark">
                {metrics?.total_interactions_count || 0}
              </p>
              <p className="text-[10px] text-secondary-text mt-1">
                {metrics?.unread_messages_count || 0} unread message{metrics?.unread_messages_count === 1 ? '' : 's'}
              </p>
            </Card>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-6 border-border bg-surface">
              <h3 className="font-black text-lg text-dark">Inbox Highlights</h3>
              <p className="text-xs text-secondary-text mt-1">
                You have {metrics?.unread_messages_count || 0} unread message{metrics?.unread_messages_count === 1 ? '' : 's'}.
              </p>
              <Button onClick={() => setActiveTab('inbox')} variant="outline" size="sm" className="mt-4">
                Go to Inbox ↗
              </Button>
            </Card>

            <Card className="p-6 border-border bg-surface">
              <h3 className="font-black text-lg text-dark">Payout Status</h3>
              <p className="text-xs text-secondary-text mt-1">
                {creator?.subaccount_status === 'active'
                  ? `Active on Paystack: ${creator.bank_name} (••••${creator.account_number_last4})`
                  : 'Payout account not connected yet.'}
              </p>
              <Button onClick={() => setActiveTab('payouts')} variant="outline" size="sm" className="mt-4">
                Manage Bank Details ↗
              </Button>
            </Card>
          </div>
        </section>
      )}

      {/* TAB 2: INBOX */}
      {activeTab === 'inbox' && (
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-dark">Creator Inbox</h2>
              <p className="text-xs text-secondary-text">Verified messages and tips from your supporters.</p>
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs font-bold">
              {(['all', 'unread', 'read'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setInboxFilter(filter)}
                  type="button"
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    inboxFilter === filter ? 'bg-background text-dark shadow-xs' : 'text-secondary-text'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {inboxLoading ? (
            <div className="py-12 text-center text-xs font-bold text-secondary-text">Loading inbox messages…</div>
          ) : inboxItems.length === 0 ? (
            <Card className="text-center py-16 p-6 border-border bg-surface">
              <p className="text-sm font-bold text-dark">No messages found</p>
              <p className="text-xs text-secondary-text mt-1">
                When visitors send priority messages or tips on your bio link, they will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <Card
                  key={item.id}
                  className={`p-5 border transition bg-surface ${
                    item.payment_status === 'verified'
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={item.interaction_type === 'priority_dm' ? 'default' : 'success'}
                          className="text-[10px]"
                        >
                          {item.interaction_type === 'priority_dm' ? 'Priority DM' : 'Tip'}
                        </Badge>
                        <h4 className="text-sm font-bold text-dark">{item.sender_name}</h4>
                        {item.payment_status === 'verified' && (
                          <Badge variant="error" className="text-[10px]">
                            New / Unread
                          </Badge>
                        )}
                      </div>
                      {item.sender_contact && (
                        <p className="text-[11px] text-secondary-text mt-0.5">Contact: {item.sender_contact}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-primary">
                        ₦{(item.amount_kobo / 100).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-secondary-text mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {item.message_body && (
                    <div className="mt-3.5 p-3.5 bg-background border border-border rounded-xl text-xs leading-relaxed text-dark break-words">
                      {item.message_body}
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-3 text-[11px]">
                    <span className="text-secondary-text">
                      {item.is_public_on_wall ? 'Supporter opted in to Odogwu Wall' : 'Private support'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.payment_status === 'verified' && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          type="button"
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          Mark as read ✓
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PROFILE & PRICING */}
      {activeTab === 'profile' && (
        <Card className="mt-6 p-6 sm:p-8 border-border bg-surface">
          <h2 className="text-xl font-black text-dark">Profile & Pricing Settings</h2>
          <p className="text-xs text-secondary-text mt-1">Configure what visitors see when they open your bio link.</p>

          {profileMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                profileMsg.type === 'success'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="bio_text">Bio Description</Label>
                <span className="text-[10px] text-secondary-text">{bioText.length}/300</span>
              </div>
              <Textarea
                id="bio_text"
                rows={3}
                maxLength={300}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell your supporters about yourself…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatar_url">Avatar Image URL</Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <span className="text-[10px] text-secondary-text block">Optional: Leave empty to display initials monogram.</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <Label htmlFor="min_fee">Priority Message Rate (₦)</Label>
                <Input
                  id="min_fee"
                  type="number"
                  min="500"
                  max="100000"
                  step="100"
                  value={minFeeNaira}
                  onChange={(e) => setMinFeeNaira(Number(e.target.value))}
                />
                <span className="text-[10px] text-secondary-text block">Minimum rate to send you a priority message.</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="presets">Tip Preset Buttons (₦, comma-separated)</Label>
                <Input
                  id="presets"
                  type="text"
                  value={tipPresetsNaira}
                  onChange={(e) => setTipPresetsNaira(e.target.value)}
                  placeholder="2000, 5000, 10000"
                />
                <span className="text-[10px] text-secondary-text block">Presets shown to visitors for fast tips.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publicWallEnabled}
                  onChange={(e) => setPublicWallEnabled(e.target.checked)}
                  className="rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs font-bold text-dark">Enable Public Odogwu Supporter Wall</span>
              </label>

              <div className="space-y-1.5">
                <Label htmlFor="lb_period">Default Leaderboard Period</Label>
                <select
                  id="lb_period"
                  value={leaderboardPeriod}
                  onChange={(e) => setLeaderboardPeriod(e.target.value as 'weekly' | 'monthly' | 'all_time')}
                  className="w-full sm:w-60 text-xs h-10 px-3 border border-border rounded-xl bg-surface text-dark focus:outline-none focus:border-primary"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="all_time">All-Time</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary">Notification Preferences</h4>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs text-dark">Send email notifications for new paid interactions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs text-dark">Send WhatsApp notifications (Cloud API)</span>
              </label>

              {notifyWhatsapp && (
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp_phone">WhatsApp Phone Number</Label>
                  <Input
                    id="whatsapp_phone"
                    type="text"
                    placeholder="e.g. +2348012345678"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={profileSaving} className="mt-4">
              {profileSaving ? 'Saving Changes…' : 'Save Profile Changes ↗'}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 4: BANK PAYOUTS */}
      {activeTab === 'payouts' && (
        <Card className="mt-6 p-6 sm:p-8 border-border bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-dark">Bank Payout Settings</h2>
              <p className="text-xs text-secondary-text mt-1">
                Link your Nigerian bank account through Paystack Subaccounts to receive automatic splits.
              </p>
            </div>
            <Badge variant={creator?.subaccount_status === 'active' ? 'success' : 'error'}>
              {creator?.subaccount_status === 'active' ? 'Active' : 'Unconnected'}
            </Badge>
          </div>

          {creator?.subaccount_status === 'active' && (
            <div className="mt-5 p-4 bg-background border border-border rounded-2xl">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Connected Bank Account</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-dark">{creator.account_name}</p>
                  <p className="text-xs text-secondary-text mt-0.5">
                    {creator.bank_name} · Account ending in ••••{creator.account_number_last4}
                  </p>
                </div>
                <Badge variant="success">Verified ✓</Badge>
              </div>
            </div>
          )}

          {bankMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                bankMsg.type === 'success'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
              }`}
            >
              {bankMsg.text}
            </div>
          )}

          <form onSubmit={handleConnectBank} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_select">Select Nigerian Bank</Label>
              <select
                id="bank_select"
                required
                value={selectedBankCode}
                onChange={(e) => {
                  setSelectedBankCode(e.target.value);
                  setResolvedAccountName('');
                }}
                className="w-full text-sm h-11 px-4 border border-border rounded-xl bg-surface text-dark focus:outline-none focus:border-primary"
              >
                <option value="">-- Choose a Bank --</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account_num">10-Digit NUBAN Account Number</Label>
              <div className="flex gap-2">
                <Input
                  id="account_num"
                  type="text"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                    setResolvedAccountName('');
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResolveAccount}
                  disabled={resolvingBank || accountNumber.length !== 10 || !selectedBankCode}
                >
                  {resolvingBank ? 'Verifying…' : 'Verify Name'}
                </Button>
              </div>
            </div>

            {resolvedAccountName && (
              <div className="p-3 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-bold">
                Account Holder: {resolvedAccountName}
              </div>
            )}

            <Button
              type="submit"
              disabled={connectingBank || !selectedBankCode || accountNumber.length !== 10}
            >
              {connectingBank ? 'Connecting with Paystack…' : 'Save & Connect Subaccount ↗'}
            </Button>
          </form>

          <div className="mt-8 pt-5 border-t border-border text-xs text-secondary-text leading-relaxed">
            <p>
              💡 <strong>How Paystack Subaccounts work:</strong> When a supporter pays you, Paystack automatically splits 90% of the payment directly into your bank subaccount and 10% platform fee to Bio Gatekeeper. Settlements are governed by standard Paystack terms.
            </p>
          </div>
        </Card>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <Card className="mt-6 p-6 sm:p-8 border-border bg-surface">
          <h2 className="text-xl font-black text-dark">Security & Password</h2>
          <p className="text-xs text-secondary-text mt-1">Change your password and manage account security.</p>

          {passwordMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.type === 'success'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-6 max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="curr_pass">Current Password</Label>
              <Input
                id="curr_pass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new_pass">New Password (at least 8 characters)</Label>
              <Input
                id="new_pass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_pass">Confirm New Password</Label>
              <Input
                id="confirm_pass"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Updating Password…' : 'Update Password ↗'}
            </Button>
          </form>
        </Card>
      )}
    </main>
  );
}
