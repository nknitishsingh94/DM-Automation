import { useState, useEffect } from 'react';
import { Check, X, Crown, Sparkles, MessageCircle, Smartphone, ShieldCheck, Zap, CreditCard, QrCode, ChevronLeft, Lock, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Subscription() {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'upi', 'card', 'qr'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('8795919866@ybl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);

  const handleSelectPlan = (plan) => {
    if (plan === 'Pro') {
      setShowPayment(true);
      setPaymentStep('select');
    }
  };

  const usdPrice = 19;
  const inrPrice = 1599;

  const handlePayment = async () => {
    setLoading(true);
    const token = localStorage.getItem('insta_agent_token');
    
    try {
      // 1. Create order on server
      const response = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const order = await response.json();

      if (!order.id) throw new Error("Could not create order");

      // 2. Options for Razorpay
      const options = {
        key: 'rzp_test_Sb7Jacv3IT4KbJ', // Updated with your real Key ID
        amount: order.amount,
        currency: order.currency,
        name: "DM Automate",
        description: "Professional AI Automation Pro Plan",
        image: "https://instant-logo.png", // Icon
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify payment on server
          const verifyRes = await fetch('http://localhost:5000/api/payment/verify-payment', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(response)
          });
          const result = await verifyRes.json();
          if (result.success) {
            alert("Payment Successful! Your Pro plan is now active.");
            window.location.reload();
          } else {
            alert("Verification failed. Please contact the founder.");
          }
        },
        prefill: {
          name: user?.username,
          email: user?.email,
        },
        theme: {
          color: "#a855f7",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Unable to initialize Razorpay. Please use manual UPI/QR.");
    } finally {
      setLoading(false);
    }
  };

  const getWhatsappMessage = (method) => {
    return encodeURIComponent(`Hello Founder! I have paid ${usdPrice}$ (approx ₹${inrPrice}) for the Pro Plan via ${method}. My account username is: ${user?.username}. Please activate it.`);
  };

  const upiLink = (app) => `upi://pay?pa=8795919866@ybl&pn=DMAutomate&am=${inrPrice}&cu=INR&tn=ProUpgrade_${user?.username}`;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
          Upgrade to <span style={{ background: 'linear-gradient(135deg, #a855f7, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro Mastery</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Choose the best plan to automate your social media interactions and multiply your business results.
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* Free Plan */}
        <div className="table-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Starter Free</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Perfect for individual sellers</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>$0</span>
            <span style={{ color: 'var(--text-muted)' }}>/ month</span>
          </div>
          <button style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '12px', 
            border: '2px solid var(--border-subtle)', 
            background: 'transparent', 
            color: 'var(--text-main)',
            fontWeight: '600',
             cursor: 'not-allowed',
            opacity: 0.7
          }}>
            Your Current Plan
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FeatureItem text="Instagram integration only" />
            <FeatureItem text="100 AI Auto-Replies /mo" />
            <FeatureItem text="Basic Keyword Triggers" />
            <FeatureItem text="Standard Dashboard" />
            <FeatureItem text="Community Support" isX />
          </div>
        </div>

        {/* Pro Plan */}
        <div className="table-card" style={{ 
          padding: '40px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '30px', 
          position: 'relative', 
          border: '2px solid #a855f7',
          boxShadow: '0 20px 40px rgba(168, 85, 247, 0.15)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'linear-gradient(135deg, #a855f7, #d946ef)', color: 'white', padding: '6px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} /> BEST VALUE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a855f7' }}>Mastery Pro</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>For growing SaaS & Agencies</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>$19</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/ month</span>
            <span style={{ color: '#a855f7', fontSize: '0.9rem', fontWeight: '600' }}>(≈ ₹1,600)</span>
          </div>
          <button 
            onClick={() => handleSelectPlan('Pro')}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #a855f7, #d946ef)', 
              color: 'white',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(168, 85, 247, 0.3)',
              transition: 'all 0.3s'
            }} className="upgrade-btn-hover">
            Upgrade to Pro Mastery
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FeatureItem text="Multi-Platform (IG, FB, WhatsApp)" highlighted />
            <FeatureItem text="Unlimited AI Auto-Replies" highlighted />
            <FeatureItem text="Advanced Flow Builder" highlighted />
            <FeatureItem text="Full Analytics Dashboard" highlighted />
            <FeatureItem text="24/7 Priority Support" highlighted />
          </div>
        </div>

      </div>

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
            background: 'white', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '90vh',
            position: 'relative', 
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(0,0,0,0.1)',
            WebkitOverflowScrolling: 'touch'
          }}>
            <button 
              onClick={() => setShowPayment(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#666', zIndex: 10 }}>
              <X size={20} />
            </button>

            {paymentStep !== 'select' && (
              <button 
                onClick={() => setPaymentStep('select')}
                style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.05)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#666', zIndex: 10 }}>
                <ChevronLeft size={20} />
              </button>
            )}

            <div style={{ padding: '30px' }}>
              {/* Common Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '50px', height: '50px', background: '#f3f0ff', color: '#a855f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Crown size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1a1a1a' }}>
                  {paymentStep === 'select' ? 'Choose Payment Method' : 
                   paymentStep === 'upi' ? 'Pay via UPI' : 
                   paymentStep === 'card' ? 'Debit / Credit Card' : 'Scan QR Code'}
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Total Amount: <strong>${usdPrice} (₹{inrPrice})</strong></p>
              </div>

              {/* Step: Select Method */}
              {paymentStep === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <PaymentMethodButton 
                    icon={<Lock color="#a855f7" />} 
                    title="Pay with All Apps (Razorpay)" 
                    onClick={handlePayment} 
                    highlighted
                  />
                  <PaymentMethodButton 
                    icon={<Smartphone color="#a855f7" />} 
                    title="Manual UPI Apps" 
                    onClick={() => setPaymentStep('upi')} 
                  />
                  <PaymentMethodButton 
                    icon={<CreditCard color="#a855f7" />} 
                    title="Debit / Credit Card" 
                    onClick={() => setPaymentStep('card')} 
                  />
                  <PaymentMethodButton 
                    icon={<QrCode color="#a855f7" />} 
                    title="Scan QR Code" 
                    onClick={() => setPaymentStep('qr')} 
                  />
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Secure encrypted payments powered by DM Automate</p>
                  </div>
                </div>
              )}

              {/* Step: UPI & QR Combined */}
              {paymentStep === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* QR Code Section */}
                  <div style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ width: '140px', height: '140px', background: 'white', border: '1px solid #ddd', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Zap size={60} color="#a855f7" strokeWidth={1} style={{ opacity: 0.2 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#111', textTransform: 'uppercase', textAlign: 'center', padding: '10px' }}>
                        Scan QR to Pay ₹{inrPrice}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Works with any UPI App (GPay, PhonePe, etc.)</p>
                  </div>

                  {/* App Buttons Section */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px', fontWeight: '600' }}>Quick Pay Apps (Mobile only)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <UpiAppButton title="Google Pay" color="#4285F4" href={upiLink('gpay')} />
                      <UpiAppButton title="PhonePe" color="#6739B7" href={upiLink('phonepe')} />
                      <UpiAppButton title="Paytm" color="#00BAF2" href={upiLink('paytm')} />
                      <UpiAppButton title="Any UPI" color="#111" href={upiLink('any')} />
                    </div>
                  </div>

                  {/* Manual Copy Section */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px', textAlign: 'center' }}>Or Copy UPI ID manually</p>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' 
                    }}>
                      <span style={{ fontWeight: '700', color: '#1a1a1a', letterSpacing: '0.5px' }}>8795919866@ybl</span>
                      <button 
                        onClick={handleCopyUPI}
                        style={{ background: copied ? '#10b981' : '#a855f7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <a href={`https://api.whatsapp.com/send?phone=918795919866&text=${getWhatsappMessage('UPI/QR')}`} target="_blank" rel="noopener noreferrer" style={whatsappButtonStyle}>
                    <MessageCircle size={18} /> I have Paid (Inform Founder)
                  </a>
                </div>
              )}

              {/* Step: Card */}
              {paymentStep === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input style={inputStyle} placeholder="Card Number" />
                    <div style={{ position: 'absolute', right: '12px', top: '12px', display: 'flex', gap: '4px' }}>
                      <div style={{ width: '30px', height: '18px', background: '#eee', borderRadius: '3px' }}></div>
                      <div style={{ width: '30px', height: '18px', background: '#ddd', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input style={inputStyle} placeholder="Expiry (MM/YY)" />
                    <input style={inputStyle} placeholder="CVV" type="password" />
                  </div>
                  <input style={inputStyle} placeholder="Card Holder Name" />
                  <button style={{ 
                    background: 'linear-gradient(135deg, #a855f7, #d946ef)', 
                    color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' 
                  }}>
                    Pay Now ($19)
                  </button>
                  <a href={`https://api.whatsapp.com/send?phone=918795919866&text=${getWhatsappMessage('Card')}`} target="_blank" rel="noopener noreferrer" style={{...whatsappButtonStyle, background: '#f3f4f6', color: '#111'}}>
                    <MessageCircle size={18} /> Inform via WhatsApp
                  </a>
                </div>
              )}

              {/* Step: QR Code (Removed separate step as it's now integrated) */}
              {paymentStep === 'qr' && (
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
                      <div style={{ width: '160px', height: '160px', background: 'white', border: '1px solid #ddd', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Zap size={80} color="#a855f7" strokeWidth={1} style={{ opacity: 0.3 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: '#111', textTransform: 'uppercase', textAlign: 'center', padding: '15px' }}>
                          Scan QR to Pay ₹{inrPrice}
                        </div>
                      </div>
                    </div>
                    <a href={`https://api.whatsapp.com/send?phone=918795919866&text=${getWhatsappMessage('QR Scan')}`} target="_blank" rel="noopener noreferrer" style={whatsappButtonStyle}>
                      <MessageCircle size={18} /> I have Scanned & Paid
                    </a>
                 </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#888', fontSize: '0.75rem' }}>
                <Lock size={12} /> SSL Secure Connection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div style={{ marginTop: '80px', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '500' }}>
          <ShieldCheck size={20} /> Secure Manual Activation
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '500' }}>
          <Zap size={20} /> Instant Founder Support
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '500' }}>
          <Smartphone size={20} /> Multi-Channel Support
        </div>
      </div>

    </div>
  );
}

function FeatureItem({ text, highlighted, isX }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
      <div style={{ 
        width: '20px', 
        height: '20px', 
        borderRadius: '50%', 
        background: isX ? 'rgba(239, 68, 68, 0.1)' : (highlighted ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isX ? '#ef4444' : (highlighted ? '#a855f7' : '#10b981')
      }}>
        {isX ? <X size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
      </div>
      <span style={{ color: isX ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: highlighted ? '600' : '400' }}>{text}</span>
    </div>
  );
}

// Helper Components for Payment Modal
function PaymentMethodButton({ icon, title, onClick, highlighted }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '14px', 
        border: highlighted ? '2px solid #a855f7' : '1px solid #eee', 
        background: highlighted ? 'rgba(168, 85, 247, 0.05)' : 'white', 
        cursor: 'pointer', transition: 'all 0.2s', width: '100%',
        boxShadow: highlighted ? '0 10px 20px rgba(168, 85, 247, 0.1)' : 'none'
      }}
      className="payment-method-hover"
    >
      <div style={{ width: '40px', height: '40px', background: highlighted ? '#a855f7' : '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: highlighted ? 'white' : 'inherit' }}>
        {icon}
      </div>
      <span style={{ fontWeight: '700', color: highlighted ? '#a855f7' : '#1a1a1a' }}>{title}</span>
    </button>
  );
}

function UpiAppButton({ title, color, href }) {
  return (
    <a 
      href={href}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', 
        borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', transition: 'all 0.2s',
        textDecoration: 'none'
      }}
    >
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
        {title.charAt(0)}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#444' }}>{title}</span>
    </a>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none'
};

const whatsappButtonStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)'
};
