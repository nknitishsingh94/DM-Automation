import { useState, useEffect } from 'react';
import { Check, X, Crown, Sparkles, MessageCircle, Smartphone, ShieldCheck, Zap, CreditCard, QrCode, ChevronLeft, Lock, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';

export default function Subscription() {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('8795919866@ybl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const order = await response.json();

      if (!order.id) throw new Error("Could not create order");

      const options = {
        key: 'rzp_test_Sb7Jacv3IT4KbJ',
        amount: order.amount,
        currency: order.currency,
        name: "ZenXchat",
        description: "Professional AI Automation Pro Plan",
        image: "https://instant-logo.png",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
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
    <div style={{ padding: '0 40px 60px' }}>

      {/* Use Landing Page Style Pricing Section */}
      <section className="pricing-section" style={{ background: 'transparent', border: 'none', padding: '0' }}>
        <div className="pricing-container">
          <div className="pricing-heading" style={{ marginBottom: '60px' }}>
            <h2>Simple, transparent pricing</h2>
            <p>Choose the plan that's right for your business. No hidden fees.</p>
          </div>

          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Starter</h3>
                <div className="price"><span>$</span>0<span>/mo</span></div>
                <p>Perfect for trying out the platform.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> 100 Auto-Replies / month</li>
                  <li><Check size={18} className="check-icon" /> Basic Flow Builder</li>
                  <li><Check size={18} className="check-icon" /> Standard Support</li>
                </ul>
              </div>
              <button className="pricing-btn outline-btn">
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card pro-card">
              <div className="pro-badge">Most Popular</div>
              <div className="card-header">
                <h3>Pro</h3>
                <div className="price"><span>$</span>29<span>/mo</span></div>
                <p>For growing creators and businesses.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> Unlimited Auto-Replies</li>
                  <li><Check size={18} className="check-icon" /> Advanced AI AI-Agent</li>
                  <li><Check size={18} className="check-icon" /> Analytics Dashboard</li>
                  <li><Check size={18} className="check-icon" /> Priority Support</li>
                </ul>
              </div>
              <button className="pricing-btn solid-btn" onClick={() => handleSelectPlan('Pro')}>
                Upgrade to Pro
              </button>
            </div>

            {/* Agency Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Agency</h3>
                <div className="price"><span>$</span>50<span>/mo</span></div>
                <p>For agencies managing multi-accounts.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> Everything in Pro</li>
                  <li><Check size={18} className="check-icon" /> White-labeling Options</li>
                  <li><Check size={18} className="check-icon" /> Manage up to 10 Clients</li>
                  <li><Check size={18} className="check-icon" /> Dedicated Account Manager</li>
                </ul>
              </div>
              <button className="pricing-btn outline-btn" onClick={() => handleSelectPlan('Pro')}>
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal (same as before) */}
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
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Secure encrypted payments powered by ZenXchat</p>
                  </div>
                </div>
              )}

              {paymentStep === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: '16px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ width: '140px', height: '140px', background: 'white', border: '1px solid #ddd', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <Zap size={60} color="#a855f7" strokeWidth={1} style={{ opacity: 0.2 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#111', textTransform: 'uppercase', textAlign: 'center', padding: '10px' }}>
                        Scan QR to Pay ₹{inrPrice}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Works with any UPI App (GPay, PhonePe, etc.)</p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px', fontWeight: '600' }}>Quick Pay Apps (Mobile only)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <UpiAppButton title="Google Pay" color="#4285F4" href={upiLink('gpay')} />
                      <UpiAppButton title="PhonePe" color="#6739B7" href={upiLink('phonepe')} />
                      <UpiAppButton title="Paytm" color="#00BAF2" href={upiLink('paytm')} />
                      <UpiAppButton title="Any UPI" color="#111" href={upiLink('any')} />
                    </div>
                  </div>

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
      <div style={{ marginTop: '60px', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', opacity: 0.6 }}>
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
