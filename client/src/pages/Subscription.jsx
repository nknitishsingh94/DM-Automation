import { useState, useEffect } from 'react';
import { Check, X, Crown, Sparkles, MessageCircle, Smartphone, ShieldCheck, Zap, CreditCard, QrCode, ChevronLeft, Lock, Copy, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

export default function Subscription() {
  const { user, syncPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pricing, setPricing] = useState({ pro_price: 29, enterprise_price: 99 });
  const [myTransactions, setMyTransactions] = useState([]);

  // Manual payment state
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    fetchPricing();
    fetchUserTransactions();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pricing`);
      const data = await res.json();
      if (data.pro_price) {
        setPricing({ pro_price: Number(data.pro_price), enterprise_price: Number(data.enterprise_price) || 99 });
      } else if (data.pro && data.pro.price) {
        setPricing({ pro_price: Number(data.pro.price), enterprise_price: Number(data.enterprise?.price) || 99 });
      }
    } catch (e) {
      console.error("Pricing load error:", e);
    }
  };

  const fetchUserTransactions = async () => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/my-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyTransactions(data || []);
      }
    } catch (e) {
      console.error("Transactions load error:", e);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('8795919866@ybl');
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPlan = (planName) => {
    setSelectedPlan(planName);
    setShowPayment(true);
    setPaymentStep('select');
  };

  // Pricing calculations
  const usdPrice = selectedPlan === 'Pro' ? pricing.pro_price : pricing.enterprise_price;
  const inrPrice = usdPrice * 80; // Standard USD to INR rate (~80 INR)

  const handlePayment = async () => {
    setLoading(true);
    const token = localStorage.getItem('insta_agent_token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ plan: selectedPlan, amountInr: inrPrice })
      });

      const order = await response.json();

      if (!response.ok || order.error || !order.id) {
        toast.error(order.error || "Online gateway unavailable. Switched to Manual UPI.");
        setPaymentStep('upi');
        setLoading(false);
        return;
      }

      const options = {
        key: order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TgJd8IFigFTKFa',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: "smart100X",
        description: `${selectedPlan} AI Automation Plan`,
        order_id: order.id,
        handler: async function (res) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                ...res,
                plan: selectedPlan,
                amount: inrPrice
              })
            });
            const result = await verifyRes.json();
            if (result.success) {
              await syncPlan();
              toast.success(result.message || `Payment Successful! ${selectedPlan} plan activated.`);
              setShowPayment(false);
              fetchUserTransactions();
            } else {
              toast.error(result.message || "Verification failed. Signature mismatch.");
            }
          } catch (e) {
            toast.error("Verification server error. Please inform founder.");
          }
        },
        modal: {
          ondismiss: function () {
            toast("Payment cancelled by user", { icon: 'ℹ️' });
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
        },
        theme: {
          color: "#a855f7",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        toast.error(response.error.description || "Payment failed. Please try again or use UPI.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Unable to start Razorpay. Please use Manual UPI / QR.");
      setPaymentStep('upi');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      toast.error("Please enter your UTR / Transaction Reference ID");
      return;
    }
    setSubmittingManual(true);
    const token = localStorage.getItem('insta_agent_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/submit-manual-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amountInr: inrPrice,
          amountUsd: usdPrice,
          paymentMethod: paymentStep === 'qr' ? 'qr' : paymentStep === 'card' ? 'card' : 'upi',
          utr: utr.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Payment proof submitted! Verification in progress.");
        setUtr('');
        setNotes('');
        setShowPayment(false);
        fetchUserTransactions();
      } else {
        toast.error(data.error || "Failed to submit payment proof.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to server.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const getWhatsappMessage = (method) => {
    return encodeURIComponent(`Hello Founder! I have paid $${usdPrice} (₹${inrPrice}) for the ${selectedPlan} Plan via ${method}. My account username is: ${user?.username}. ${utr ? `Transaction UTR: ${utr}.` : ''} Please activate my plan.`);
  };

  const rawUpiUrl = `upi://pay?pa=8795919866@ybl&pn=smart100X&am=${inrPrice}&cu=INR&tn=${selectedPlan}Plan_${user?.username || 'User'}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(rawUpiUrl)}`;

  const currentPlan = (user?.plan || 'free').toLowerCase();

  return (
    <div style={{ padding: '0 40px 60px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Active Plan Status Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1))',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '20px',
        padding: '24px 32px',
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#a855f7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Subscription</span>
              <span style={{
                background: currentPlan === 'enterprise' ? '#8b5cf6' : currentPlan === 'pro' ? '#10b981' : 'var(--border-subtle)',
                color: currentPlan === 'free' ? 'var(--text-main)' : 'white',
                padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase'
              }}>
                {currentPlan} ACTIVE
              </span>
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {currentPlan === 'enterprise' ? 'Enterprise Plan (All Unlimited Features Enabled)' :
               currentPlan === 'pro' ? 'Pro Plan (Unlimited Automations & AI Agent Active)' :
               'Free Starter Plan (Upgrade to unlock unlimited AI automations)'}
            </h3>
          </div>
        </div>

        {currentPlan === 'free' && (
          <button 
            onClick={() => handleSelectPlan('Pro')}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px',
              fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            <Sparkles size={18} /> Upgrade Now
          </button>
        )}
      </div>

      {/* Pricing Cards */}
      <section className="pricing-section" style={{ background: 'transparent', border: 'none', padding: '0' }}>
        <div className="pricing-container">
          <div className="pricing-heading" style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>Transparent, High-Value Pricing</h2>
            <p style={{ color: 'var(--text-muted)' }}>Choose the plan that powers your Instagram & multi-channel automation.</p>
          </div>

          <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', maxWidth: '850px', margin: '0 auto', gap: '24px', alignItems: 'stretch' }}>

            {/* Pro Plan */}
            <div className="pricing-card pro-card" style={{
              background: 'var(--bg-card)', border: currentPlan === 'pro' ? '2px solid #10b981' : '2px solid #a855f7',
              borderRadius: '24px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div style={{ position: 'absolute', top: '-14px', right: '24px', background: '#a855f7', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                MOST POPULAR
              </div>
              <div>
                <div className="card-header">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Pro Plan</h3>
                  <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '12px 0' }}>
                    <span>$</span>{pricing.pro_price}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', fontWeight: '500' }}>approx ₹{pricing.pro_price * 80} INR</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>For growing creators, influencers & businesses.</p>
                </div>

                <div className="card-features" style={{ margin: '24px 0' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#10b981" /> Unlimited Auto-Replies & DMs</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#10b981" /> Advanced AI Studio & Bot Agents</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#10b981" /> Multi-Platform (IG, WA, YouTube)</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#10b981" /> Analytics & Broadcast Campaigns</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#10b981" /> Priority Founder Support</li>
                  </ul>
                </div>
              </div>

              <button 
                className="pricing-btn solid-btn" 
                onClick={() => handleSelectPlan('Pro')}
                disabled={currentPlan === 'pro'}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px',
                  background: currentPlan === 'pro' ? '#10b981' : '#a855f7',
                  color: 'white', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: currentPlan === 'pro' ? 'default' : 'pointer'
                }}
              >
                {currentPlan === 'pro' ? 'Current Plan Active' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="pricing-card enterprise-card" style={{
              background: 'var(--bg-card)', border: currentPlan === 'enterprise' ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
              borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div className="card-header">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Enterprise</h3>
                  <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '12px 0' }}>
                    <span>$</span>{pricing.enterprise_price}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', fontWeight: '500' }}>approx ₹{pricing.enterprise_price * 80} INR</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>For agencies, high-volume brands & teams.</p>
                </div>

                <div className="card-features" style={{ margin: '24px 0' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#a855f7" /> Everything in Pro Plan</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#a855f7" /> Custom API & White-Labeling</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#a855f7" /> Manage Unlimited Workspaces</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}><Check size={18} color="#a855f7" /> Dedicated Account Manager</li>
                  </ul>
                </div>
              </div>

              <button 
                className="pricing-btn outline-btn" 
                onClick={() => handleSelectPlan('Enterprise')}
                disabled={currentPlan === 'enterprise'}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px',
                  background: currentPlan === 'enterprise' ? '#8b5cf6' : 'transparent',
                  color: currentPlan === 'enterprise' ? 'white' : 'var(--text-main)',
                  border: currentPlan === 'enterprise' ? 'none' : '1px solid var(--border)',
                  fontWeight: '700', fontSize: '1rem', cursor: currentPlan === 'enterprise' ? 'default' : 'pointer'
                }}
              >
                {currentPlan === 'enterprise' ? 'Current Plan Active' : 'Get Enterprise'}
              </button>
            </div> 

          </div>
        </div>
      </section>

      {/* User Transactions Table */}
      {myTransactions.length > 0 && (
        <div style={{ marginTop: '50px', background: 'var(--bg-card)', borderRadius: '24px', padding: '28px', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>My Payment Transactions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Plan</th>
                  <th style={{ padding: '12px' }}>Amount</th>
                  <th style={{ padding: '12px' }}>Method / UTR</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myTransactions.map(tx => (
                  <tr key={tx._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>{tx.plan}</td>
                    <td style={{ padding: '12px', fontWeight: '700' }}>₹{tx.amount} (${tx.amountUsd || Math.round(tx.amount / 80)})</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.paymentMethod.toUpperCase()} {tx.utr ? `(Ref: ${tx.utr})` : ''}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: tx.status === 'completed' ? '#dcfce7' : tx.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: tx.status === 'completed' ? '#166534' : tx.status === 'pending' ? '#92400e' : '#991b1b',
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase'
                      }}>
                        {tx.status === 'completed' ? <CheckCircle2 size={12} /> : tx.status === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '520px', 
            maxHeight: '90vh',
            position: 'relative', 
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(0,0,0,0.1)',
            WebkitOverflowScrolling: 'touch'
          }}>
            <button 
              onClick={() => setShowPayment(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}>
              <X size={20} />
            </button>

            {paymentStep !== 'select' && (
              <button 
                onClick={() => setPaymentStep('select')}
                style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}>
                <ChevronLeft size={20} />
              </button>
            )}

            <div style={{ padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '54px', height: '54px', background: '#f3f0ff', color: '#a855f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Crown size={30} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Upgrade to {selectedPlan} Plan
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                  Total Payable: <strong style={{ color: 'var(--primary)' }}>${usdPrice} (₹{inrPrice})</strong>
                </p>
              </div>

              {paymentStep === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <PaymentMethodButton 
                    icon={<Lock color="#a855f7" />} 
                    title="Online Payment / Cards / UPI (Razorpay)" 
                    description="Instant automatic activation via Razorpay"
                    onClick={handlePayment} 
                    highlighted
                  />
                  <PaymentMethodButton 
                    icon={<Smartphone color="#a855f7" />} 
                    title="Manual UPI Payment & App" 
                    description="Pay via Google Pay, PhonePe, Paytm, UPI ID"
                    onClick={() => setPaymentStep('upi')} 
                  />
                  <PaymentMethodButton 
                    icon={<QrCode color="#a855f7" />} 
                    title="Scan UPI QR Code" 
                    description="Scan direct QR code from any banking app"
                    onClick={() => setPaymentStep('qr')} 
                  />
                  <PaymentMethodButton 
                    icon={<CreditCard color="#a855f7" />} 
                    title="Direct Card Payment" 
                    description="Enter card details for processing"
                    onClick={() => setPaymentStep('card')} 
                  />
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>100% Secure Encrypted Payment System</p>
                  </div>
                </div>
              )}

              {/* UPI & QR Step */}
              {(paymentStep === 'upi' || paymentStep === 'qr') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Official Scannable Razorpay & UPI QR Code */}
                  <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '16px', textAlign: 'center' }}>
                    <div style={{
                      maxWidth: '280px', margin: '0 auto 12px', borderRadius: '16px', overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', background: 'white'
                    }}>
                      <img 
                        src="/payment-qr.jpg" 
                        alt="Official Payment QR Code" 
                        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'contain' }} 
                      />
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', margin: '8px 0 2px' }}>
                      Scan & Pay ₹{inrPrice} (${usdPrice})
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM, Cred & Banking Apps)</p>
                  </div>

                  {/* Copyable UPI ID */}
                  <div style={{ background: 'var(--sidebar-bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Official UPI ID</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px' }}>8795919866@ybl</span>
                    </div>
                    <button 
                      onClick={handleCopyUPI}
                      style={{ background: copied ? '#10b981' : '#a855f7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy UPI'}
                    </button>
                  </div>

                  {/* Submit UTR / Reference ID Form */}
                  <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                        Enter Transaction Reference / UTR Number *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 329182749102 or Ref No."
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <input 
                        type="text"
                        placeholder="Optional note (e.g. Paid via GPay)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={submittingManual}
                      style={{
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                        fontWeight: '700', fontSize: '0.95rem', cursor: submittingManual ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {submittingManual ? 'Submitting...' : 'Submit Payment for Verification'}
                    </button>
                  </form>

                  {/* Direct WhatsApp link */}
                  <a href={`https://api.whatsapp.com/send?phone=918795919866&text=${getWhatsappMessage('UPI/QR')}`} target="_blank" rel="noopener noreferrer" style={whatsappButtonStyle}>
                    <MessageCircle size={18} /> Inform Founder on WhatsApp
                  </a>

                </div>
              )}

              {/* Card Step */}
              {paymentStep === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    For seamless & PCI-compliant card payments, click below to process via Razorpay Gateway.
                  </div>
                  <button onClick={handlePayment} disabled={loading} style={{ 
                    background: 'var(--primary)', width: '100%',
                    color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '1rem'
                  }}>
                    {loading ? 'Initializing Secure Payment...' : `Proceed to Pay $${usdPrice} (₹${inrPrice})`}
                  </button>
                  <a href={`https://api.whatsapp.com/send?phone=918795919866&text=${getWhatsappMessage('Card')}`} target="_blank" rel="noopener noreferrer" style={{...whatsappButtonStyle, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)'}}>
                    <MessageCircle size={18} /> Pay via WhatsApp / Founder Support
                  </a>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <Lock size={12} /> SSL 256-Bit Encrypted Secure Connection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div style={{ marginTop: '60px', display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', opacity: 0.7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
          <ShieldCheck size={18} color="#10b981" /> 100% Money Back Security
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
          <Zap size={18} color="#a855f7" /> Instant Feature Activation
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
          <Smartphone size={18} color="#6366f1" /> 24/7 Founder Support
        </div>
      </div>

    </div>
  );
}

function PaymentMethodButton({ icon, title, description, onClick, highlighted }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', 
        border: highlighted ? '2px solid #a855f7' : '1px solid var(--border-subtle)', 
        background: highlighted ? 'rgba(168, 85, 247, 0.05)' : 'var(--bg-card)', 
        cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
        boxShadow: highlighted ? '0 10px 20px rgba(168, 85, 247, 0.1)' : 'none'
      }}
      className="payment-method-hover"
    >
      <div style={{ width: '42px', height: '42px', background: highlighted ? '#a855f7' : 'var(--sidebar-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: highlighted ? 'white' : 'inherit', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: highlighted ? '#a855f7' : 'var(--text-main)' }}>{title}</div>
        {description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>}
      </div>
    </button>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
};

const whatsappButtonStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)'
};
