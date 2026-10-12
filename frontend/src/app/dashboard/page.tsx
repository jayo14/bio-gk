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
      // Refresh dashboard metrics
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
      <main className="min-h-screen px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7c351c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-[#777067]">Loading creator workspace…</p>
      </main>
    );
  }

  const creator = dashboardData?.creator;
  const metrics = dashboardData?.metrics;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 max-w-5xl mx-auto">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between border-b border-[#e6dfd5] pb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl font-black tracking-tight">
            gate<span className="text-[#7c351c]">.</span>
          </Link>
          <span className="hidden sm:inline-block text-xs uppercase tracking-widest font-extrabold text-[#7c351c] bg-[#f8f5ef] px-2.5 py-1 rounded-full border border-[#e6dfd5]">
            Creator Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {creator?.username && (
            <Link
              href={`/${creator.username}`}
              target="_blank"
              className="text-xs font-bold bg-white border border-[#d8cec1] px-3.5 py-2 rounded-full hover:bg-[#f3eee6] transition inline-flex items-center gap-1"
            >
              View page <span aria-hidden="true">↗</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            type="button"
            className="text-xs font-bold text-[#777067] hover:text-[#201c18] border border-transparent hover:border-[#d8cec1] px-3.5 py-2 rounded-full transition"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Hero Welcome & Link Sharing */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#e6dfd5] rounded-3xl p-6 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {creator?.display_name || currentUser?.display_name || 'Creator'}.
          </h1>
          <p className="text-xs text-[#777067] mt-1">
            Your public bio link: <strong className="text-[#201c18]">/{creator?.username}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyProfileLink}
            type="button"
            className="py-2.5 px-4 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer"
          >
            {copied ? 'Link Copied ✓' : 'Copy Bio Link ↗'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#e6dfd5]">
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
                ? 'bg-[#201c18] text-white'
                : 'text-[#777067] hover:text-[#201c18] hover:bg-white'
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
            <div className="p-4 sm:p-5 bg-[#fff8eb] border border-[#f3dfbd] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#96631b] uppercase tracking-wider">Payout setup required</p>
                <p className="text-sm font-semibold text-[#201c18] mt-0.5">
                  Connect your Nigerian bank account to start receiving Paystack transfers.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('payouts')}
                type="button"
                className="py-2 px-4 bg-[#96631b] text-white text-xs font-bold rounded-full hover:bg-[#7a5015] transition self-start sm:self-auto cursor-pointer"
              >
                Connect bank ↗
              </button>
            </div>
          )}

          {/* Revenue & Interaction Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777067]">Total Earned</p>
              <p className="text-2xl font-black mt-2 text-[#201c18]">
                ₦{((metrics?.verified_earnings_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#777067] mt-1">Gross verified payments</p>
            </div>

            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777067]">Net Payout</p>
              <p className="text-2xl font-black mt-2 text-[#285c2b]">
                ₦{((metrics?.net_earnings_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#777067] mt-1">Creator allocation (90%)</p>
            </div>

            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777067]">Platform Fee</p>
              <p className="text-2xl font-black mt-2 text-[#7c351c]">
                ₦{((metrics?.platform_fees_kobo || 0) / 100).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#777067] mt-1">Transparent 10% fee</p>
            </div>

            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777067]">Interactions</p>
              <p className="text-2xl font-black mt-2 text-[#201c18]">
                {metrics?.total_interactions_count || 0}
              </p>
              <p className="text-[10px] text-[#777067] mt-1">
                {metrics?.unread_messages_count || 0} unread message{metrics?.unread_messages_count === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e6dfd5] rounded-3xl p-6">
              <h3 className="font-black text-lg">Inbox Highlights</h3>
              <p className="text-xs text-[#777067] mt-1">
                You have {metrics?.unread_messages_count || 0} unread message{metrics?.unread_messages_count === 1 ? '' : 's'}.
              </p>
              <button
                onClick={() => setActiveTab('inbox')}
                type="button"
                className="mt-4 inline-block py-2.5 px-5 bg-[#201c18] text-white text-xs font-bold rounded-full hover:bg-black transition cursor-pointer"
              >
                Go to Inbox ↗
              </button>
            </div>

            <div className="bg-[#f3eee6] border border-[#e6dfd5] rounded-3xl p-6">
              <h3 className="font-black text-lg">Payout Status</h3>
              <p className="text-xs text-[#777067] mt-1">
                {creator?.subaccount_status === 'active'
                  ? `Active on Paystack: ${creator.bank_name} (••••${creator.account_number_last4})`
                  : 'Payout account not connected yet.'}
              </p>
              <button
                onClick={() => setActiveTab('payouts')}
                type="button"
                className="mt-4 inline-block py-2.5 px-5 border border-[#d8cec1] bg-white text-xs font-bold rounded-full hover:bg-[#faf7f2] transition cursor-pointer"
              >
                Manage Bank Details ↗
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: INBOX */}
      {activeTab === 'inbox' && (
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Creator Inbox</h2>
              <p className="text-xs text-[#777067]">Verified messages and tips from your supporters.</p>
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-[#f3eee6] p-1 rounded-xl text-xs font-bold">
              {(['all', 'unread', 'read'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setInboxFilter(filter)}
                  type="button"
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    inboxFilter === filter ? 'bg-white text-[#201c18] shadow-xs' : 'text-[#777067]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {inboxLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-[#777067]">Loading inbox messages…</div>
          ) : inboxItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#e6dfd5] rounded-3xl p-6">
              <p className="text-sm font-bold text-[#201c18]">No messages found</p>
              <p className="text-xs text-[#777067] mt-1">
                When visitors send priority messages or tips on your bio link, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 transition ${
                    item.payment_status === 'verified'
                      ? 'border-[#7c351c] shadow-xs'
                      : 'border-[#e6dfd5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.interaction_type === 'priority_dm'
                              ? 'bg-[#7c351c] text-white'
                              : 'bg-[#285c2b] text-white'
                          }`}
                        >
                          {item.interaction_type === 'priority_dm' ? 'Priority DM' : 'Tip'}
                        </span>
                        <h4 className="text-sm font-bold text-[#201c18]">{item.sender_name}</h4>
                        {item.payment_status === 'verified' && (
                          <span className="text-[10px] bg-[#fff0ed] text-[#9a2c1b] px-2 py-0.5 rounded-full font-bold">
                            New / Unread
                          </span>
                        )}
                      </div>
                      {item.sender_contact && (
                        <p className="text-[11px] text-[#777067] mt-0.5">Contact: {item.sender_contact}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-[#7c351c]">
                        ₦{(item.amount_kobo / 100).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#777067] mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {item.message_body && (
                    <div className="mt-3.5 p-3.5 bg-[#f8f5ef] border border-[#e6dfd5] rounded-xl text-xs leading-relaxed text-[#201c18] break-words">
                      {item.message_body}
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-between border-t border-[#f3eee6] pt-3 text-[11px]">
                    <span className="text-[#777067]">
                      {item.is_public_on_wall ? 'Supporter opted in to Odogwu Wall' : 'Private support'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.payment_status === 'verified' && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          type="button"
                          className="font-bold text-[#7c351c] hover:underline cursor-pointer"
                        >
                          Mark as read ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PROFILE & PRICING */}
      {activeTab === 'profile' && (
        <section className="mt-6 bg-white border border-[#e6dfd5] rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-black">Profile & Pricing Settings</h2>
          <p className="text-xs text-[#777067] mt-1">Configure what visitors see when they open your bio link.</p>

          {profileMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                profileMsg.type === 'success'
                  ? 'bg-[#edf7ed] border border-[#cce6cd] text-[#285c2b]'
                  : 'bg-[#fff0ed] border border-[#f3c7bd] text-[#9a2c1b]'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">Display Name</label>
              <input
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#201c18]">Bio Description</label>
                <span className="text-[11px] text-[#777067]">{bioText.length}/300</span>
              </div>
              <textarea
                rows={3}
                maxLength={300}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell your supporters about yourself and what you create…"
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c] resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">Avatar Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              />
              <span className="text-[11px] text-[#777067] mt-1 block">Optional: Leave empty to display initials monogram.</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#f3eee6]">
              <div>
                <label className="block text-xs font-bold text-[#201c18] mb-1">
                  Priority Message Rate (₦)
                </label>
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="100"
                  value={minFeeNaira}
                  onChange={(e) => setMinFeeNaira(Number(e.target.value))}
                  className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                />
                <span className="text-[11px] text-[#777067] mt-1 block">Minimum rate to send you a priority message.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#201c18] mb-1">
                  Tip Preset Buttons (₦, comma-separated)
                </label>
                <input
                  type="text"
                  value={tipPresetsNaira}
                  onChange={(e) => setTipPresetsNaira(e.target.value)}
                  placeholder="2000, 5000, 10000"
                  className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                />
                <span className="text-[11px] text-[#777067] mt-1 block">Presets shown to visitors for fast tips.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f3eee6] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicWallEnabled}
                  onChange={(e) => setPublicWallEnabled(e.target.checked)}
                  className="rounded text-[#7c351c] focus:ring-[#7c351c]"
                />
                <span className="text-xs font-bold text-[#201c18]">Enable Public Odogwu Supporter Wall</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-[#201c18] mb-1">Default Leaderboard Period</label>
                <select
                  value={leaderboardPeriod}
                  onChange={(e) => setLeaderboardPeriod(e.target.value as 'weekly' | 'monthly' | 'all_time')}
                  className="w-full sm:w-60 text-xs p-2.5 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="all_time">All-Time</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f3eee6] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7c351c]">Notification Preferences</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-[#7c351c] focus:ring-[#7c351c]"
                />
                <span className="text-xs text-[#201c18]">Send email notifications for new paid interactions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded text-[#7c351c] focus:ring-[#7c351c]"
                />
                <span className="text-xs text-[#201c18]">Send WhatsApp notifications (Cloud API)</span>
              </label>

              {notifyWhatsapp && (
                <div>
                  <label className="block text-xs font-bold text-[#201c18] mb-1">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +2348012345678"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-4 py-3 px-6 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer disabled:opacity-50"
            >
              {profileSaving ? 'Saving Changes…' : 'Save Profile Changes ↗'}
            </button>
          </form>
        </section>
      )}

      {/* TAB 4: BANK PAYOUTS */}
      {activeTab === 'payouts' && (
        <section className="mt-6 bg-white border border-[#e6dfd5] rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Bank Payout Settings</h2>
              <p className="text-xs text-[#777067] mt-1">
                Link your Nigerian bank account through Paystack Subaccounts to receive automatic splits.
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                creator?.subaccount_status === 'active'
                  ? 'bg-[#edf7ed] text-[#285c2b] border border-[#cce6cd]'
                  : 'bg-[#fff0ed] text-[#9a2c1b] border border-[#f3c7bd]'
              }`}
            >
              {creator?.subaccount_status === 'active' ? 'Active' : 'Unconnected'}
            </span>
          </div>

          {creator?.subaccount_status === 'active' && (
            <div className="mt-5 p-4 bg-[#f8f5ef] border border-[#e6dfd5] rounded-2xl">
              <p className="text-xs font-bold text-[#777067] uppercase tracking-wider">Connected Bank Account</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#201c18]">{creator.account_name}</p>
                  <p className="text-xs text-[#777067] mt-0.5">
                    {creator.bank_name} · Account ending in ••••{creator.account_number_last4}
                  </p>
                </div>
                <span className="text-xs text-[#285c2b] font-bold">Verified ✓</span>
              </div>
            </div>
          )}

          {bankMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                bankMsg.type === 'success'
                  ? 'bg-[#edf7ed] border border-[#cce6cd] text-[#285c2b]'
                  : 'bg-[#fff0ed] border border-[#f3c7bd] text-[#9a2c1b]'
              }`}
            >
              {bankMsg.text}
            </div>
          )}

          <form onSubmit={handleConnectBank} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">Select Nigerian Bank</label>
              <select
                required
                value={selectedBankCode}
                onChange={(e) => {
                  setSelectedBankCode(e.target.value);
                  setResolvedAccountName('');
                }}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              >
                <option value="">-- Choose a Bank --</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">10-Digit NUBAN Account Number</label>
              <div className="flex gap-2">
                <input
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
                  className="flex-1 text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                />
                <button
                  type="button"
                  onClick={handleResolveAccount}
                  disabled={resolvingBank || accountNumber.length !== 10 || !selectedBankCode}
                  className="px-4 py-2.5 bg-white border border-[#d8cec1] text-xs font-bold rounded-xl hover:bg-[#f3eee6] transition disabled:opacity-50 cursor-pointer"
                >
                  {resolvingBank ? 'Verifying…' : 'Verify Name'}
                </button>
              </div>
            </div>

            {resolvedAccountName && (
              <div className="p-3 bg-[#edf7ed] border border-[#cce6cd] text-[#285c2b] text-xs rounded-xl font-bold">
                Account Holder: {resolvedAccountName}
              </div>
            )}

            <button
              type="submit"
              disabled={connectingBank || !selectedBankCode || accountNumber.length !== 10}
              className="py-3 px-6 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer disabled:opacity-50"
            >
              {connectingBank ? 'Connecting with Paystack…' : 'Save & Connect Subaccount ↗'}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-[#e6dfd5] text-xs text-[#777067] leading-relaxed">
            <p>
              💡 <strong>How Paystack Subaccounts work:</strong> When a supporter pays you, Paystack automatically splits 90% of the payment directly into your bank subaccount and 10% platform fee to Bio Gatekeeper. Settlements are governed by standard Paystack terms.
            </p>
          </div>
        </section>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <section className="mt-6 bg-white border border-[#e6dfd5] rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-black">Security & Password</h2>
          <p className="text-xs text-[#777067] mt-1">Change your password and manage account security.</p>

          {passwordMsg && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.type === 'success'
                  ? 'bg-[#edf7ed] border border-[#cce6cd] text-[#285c2b]'
                  : 'bg-[#fff0ed] border border-[#f3c7bd] text-[#9a2c1b]'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-6 max-w-md space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              />
              <span className="text-[11px] text-[#777067] mt-1 block">Must be at least 8 characters.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#201c18] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="py-3 px-6 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer disabled:opacity-50"
            >
              {passwordSaving ? 'Updating Password…' : 'Update Password ↗'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
