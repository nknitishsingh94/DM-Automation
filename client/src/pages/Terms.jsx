import React, { useState } from 'react';
import { Scale, ArrowLeft, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { id: 1, title: 'Our Services', content: `smart10X provides a platform that enables businesses and individuals to create automated chat flows deployable across a wide range of messaging services, social media, and other third-party platforms including Instagram, Facebook, and WhatsApp.\n\nIf you purchase or use our Services, you're doing so through smart10X, and such purchase and use is subject to this Agreement.` },
  { id: 2, title: 'Account, Password, Security, and Phone Use', content: `You must register with smart10X and create an account ("Account") to use the Services. You agree to provide true, accurate, current and complete information during registration. You are the sole authorized user of your Account and are solely responsible for maintaining the confidentiality of your login credentials.\n\nBy providing your phone number and email address, you affirmatively consent to smart10X's use of your phone number for calls and recurring texts and your email address to perform and improve upon the Services. Standard message and data charges from your wireless carrier may apply.` },
  { id: 3, title: 'Agencies and Business Owners', content: `A "Business Owner" is any individual or entity that uses smart10X's Services to market, support, develop, or otherwise commercialize their business. An "Agency" is any service provider retained or hired by a Business Owner to create and/or manage a smart10X account on the Business Owner's behalf.\n\nIf you are an Agency, you agree to correctly identify the Business Owner as an administrator on the Account. The Business Owner shall be the sole and exclusive account representative of any Account created on its behalf by an Agency.` },
  { id: 4, title: 'User Generated Content', content: `"User Generated Content" is any content, information, and materials that you or any Conversation Participant provide, submit, upload, publish, or make available to the Services. You are solely responsible for your User Generated Content.\n\nsmart10X: (i) is not involved in the creation or development of User Generated Content; (ii) disclaims any responsibility for User Generated Content; (iii) cannot be liable for claims arising out of or relating to User Generated Content; and (iv) is not obligated to monitor, review, or remove User Generated Content, but reserves the right to limit or remove it at its sole discretion.` },
  { id: 5, title: 'Communication by Text Message or Email', content: `If you communicate with users via text message or email, you agree to comply with all applicable laws including the Telephone Consumer Protection Act (TCPA), Canada's Anti-Spam Law (CASL), and the Brazilian General Data Protection Law (LGPD).\n\nYou understand that it is generally a violation of federal law to contact a consumer by phone, text, or email without prior express written consent. smart10X is not responsible for ensuring that you do not transmit messages in violation of consent rules. You agree to indemnify and hold harmless smart10X from any claims arising out of your violation of applicable law.` },
  { id: 6, title: 'Communication with smart10X and its Clients', content: `You verify that any contact information provided to smart10X and its clients, including your email address and phone number, is true and accurate. You acknowledge that by voluntarily providing your telephone numbers and/or email addresses, you expressly agree to be contacted at those numbers and addresses.\n\nYou consent to receive emails, text messages, pre-recorded voice messages, and/or autodialed calls by or on behalf of smart10X relating to this agreement, any transaction, matters related to your account, and promotions.` },
  { id: 7, title: 'Prohibited Uses', content: `You are prohibited from using the Services:\n• For any unlawful purpose\n• To violate any international, federal, provincial or state regulations\n• To harass, abuse, defame, slander, or discriminate against any person\n• To submit false or misleading information\n• To upload or transmit viruses or malicious code\n• To interfere with or circumvent the security features of the Services\n• To attempt to access unauthorized Accounts or collect personal information of others\n• In any way which violates the policies of Facebook, Instagram, WhatsApp, or Telegram\n• To transmit spam, chain letters, or other unsolicited messages\n• To impersonate another person or misrepresent your affiliation\n• To decompile, disassemble, or reverse engineer any software used in the Services\n\nWe reserve the right to terminate your use of the Services for violating any of the prohibited uses.` },
  { id: 8, title: 'Representations and Warranties; Compliance with Laws', content: `You represent and warrant that: (i) you are 18 years of age or older and capable of entering into binding contracts, and (ii) you have the right, authority and capacity to enter into this Agreement.\n\nYou are responsible for determining whether the Services are suitable for use in light of any applicable regulations. If you are located in the EEA, United Kingdom, Switzerland or Brazil, you represent that you will obtain consent to transfer data to smart10X, inform your data subjects of such transfer, and comply with all applicable data protection laws.` },
  { id: 9, title: 'Mobile App Updates and Upgrades', content: `By installing the App, you consent to the installation of the App and any updates or upgrades released through the Services. The App may: (i) cause your device to automatically communicate with smart10X's servers, (ii) affect App-related preferences or data stored on your device, and (iii) collect personal information as set out in our Privacy Policy. You can uninstall the App at any time.` },
  { id: 10, title: 'Billing and Payment', content: `All prices and fees displayed on the Services are exclusive of applicable taxes. Unless otherwise indicated, all prices and fees are in U.S. dollars.\n\nIf you have signed up for a Subscription Plan, you authorize smart10X to deduct the monthly or yearly charges against your provided credit card. We'll give you a refund for a prepaid period if we stop providing our Services to you for a reason not laid out in these Terms. We may change our fees at any time by posting a new pricing structure to our Site.\n\nFrom time to time, we may offer trials of paid Services (a "Trial"). UNLESS YOU CANCEL A TRIAL BEFORE THE END OF THE TRIAL PERIOD, YOU WILL AUTOMATICALLY BECOME A RECURRING SUBSCRIBER AND YOUR PAYMENT METHOD WILL BE CHARGED THE THEN-CURRENT APPLICABLE PRICE.` },
  { id: 11, title: 'Termination and Suspension', content: `Either party may terminate these Terms of Service for any or no cause at any time. You may cancel and delete your Account at any time using the features on the Services. After cancellation, you will no longer have access to your Account or any information through the Services.\n\nsmart10X may terminate or limit your right to use the Services if we believe you have breached any provision of this Agreement. Following the termination or cancellation of your Account, we reserve the right to delete all your data. Your data cannot be recovered once your Account is terminated or canceled.` },
  { id: 12, title: 'Links to Third-Party Websites; Optional Third-Party Tools', content: `The Services may contain links to third-party websites. Such links do not constitute endorsement by smart10X. smart10X is not responsible for the availability, accuracy, content, advertising, products, or services of third-party websites.\n\nWe may provide you with access to third-party tools which we do not monitor and over which we have no control. Any use by you of third-party tools offered through the Services is entirely at your own risk and discretion.` },
  { id: 13, title: 'Optional smart10X-Provided Tools', content: `We may provide you with access to smart10X tools and the smart10X Developer Program, including application program interfaces, to allow you to build upon and further enhance the Services.\n\nSubject to these Terms, we grant you a non-exclusive, non-transferable, revocable right to access and use the Developer Program for the limited purpose of creating Integration Products to integrate your software applications into the Services. You shall not decompile, modify, or reverse engineer any part of the smart10X platform.` },
  { id: 14, title: 'Ownership and Intellectual Property Rights', content: `All text, graphics, data, formatting, designs, HTML, photographs, software, videos, trademarks, logos, and other content (collectively "Proprietary Material") that users see through the Services is owned by smart10X, excluding User Generated Content. Proprietary Material is protected by domestic and international laws governing copyright, patents, and other proprietary rights.\n\nYou may not copy, download, use, redesign, reconfigure, or retransmit anything from the Services without smart10X's express prior written consent. Subject to these Terms, you are granted a limited, nonexclusive, nontransferable, freely revocable license to access and use the Services.` },
  { id: 15, title: 'Copyright Complaints and Copyright Agent', content: `smart10X respects the intellectual property of others. If you believe any materials on the Services infringe upon your copyright, please send the following to legal@smart10x.com:\n\n• A description of the copyrighted work that you claim has been infringed\n• The location of the original or authorized copy of the copyrighted work\n• Your address, telephone number, and email address\n• A statement that you have a good faith belief that the disputed use is not authorized\n• A statement, made under penalty of perjury, that the information in your notice is accurate\n• Your electronic or physical signature` },
  { id: 16, title: 'Confidential Information', content: `You acknowledge that Confidential Information is a valuable, special and unique asset of smart10X and agree that you will not disclose, transfer, or use any Confidential Information for any purpose other than using the Services in accordance with these Terms.\n\n"Confidential Information" means any and all of smart10X's trade secrets, confidential and proprietary information, and all other information and data of smart10X that is not generally known to the public, including technical data, know-how, research, product plans, software, inventions, processes, and financial information.` },
  { id: 17, title: 'Disclaimer of Warranties', content: `THE SERVICES ARE PROVIDED ON AN "AS IS" BASIS WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.\n\nsmart10X MAKES NO WARRANTIES ABOUT THE RELIABILITY, TIMELINESS, SECURITY, ACCURACY OR COMPLETENESS OF THE SERVICES AND ASSUMES NO LIABILITY FOR ANY BUGS, ERRORS, PERSONAL INJURY, PROPERTY DAMAGE, OR EVENTS BEYOND OUR REASONABLE CONTROL.\n\nIN NO EVENT WILL smart10X AND AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, ACTUAL, CONSEQUENTIAL, ECONOMIC, SPECIAL OR EXEMPLARY DAMAGES ARISING IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICES.` },
  { id: 18, title: 'Indemnification', content: `You hereby agree to indemnify, defend, and hold harmless smart10X and its officers, directors, employees, agents, attorneys, insurers, successors and assigns from and against any and all liabilities incurred in connection with:\n\n(i) your use or inability to use the Services\n(ii) your breach or violation of this Agreement\n(iii) your violation of any law, or the rights of any user or third party\n(iv) any content submitted by you or using your Account to the Services\n\nsmart10X reserves the right, in its sole discretion, to assume the exclusive defense and control of any matter subject to your indemnification.` },
  { id: 19, title: 'Dispute Resolution – Arbitration & Class Action Waiver', content: `PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS.\n\nYou agree that in the event any dispute arises out of or relating to your use of the Services, you will first contact us and attempt in good faith to negotiate a written resolution. If the matter remains unresolved for 30 days, it will be deemed a "Dispute."\n\nBinding Arbitration: Any Dispute will be settled by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules. The seat of arbitration shall be in San Francisco, California.\n\nClass Action Waiver: You and smart10X agree that any proceedings to resolve Disputes will be conducted on an individual basis and not in a class, consolidated, or representative action.` },
  { id: 20, title: 'Governing Law', content: `This Agreement and your use of the Services will be governed by, and construed under, the laws of the State of California, without regard to choice of law principles.\n\nFor Brazilian consumers, this Agreement and your use of the Services will be governed by, and construed under, the laws of Brazil, as mandated by the Brazilian Consumer Protection Code.` },
  { id: 21, title: 'No Agency; No Employment', content: `No agency, partnership, joint venture, employer-employee or franchiser-franchisee relationship is intended or created by this Agreement.` },
  { id: 22, title: 'General Provisions', content: `Failure by smart10X to enforce any provision of this Agreement will not be construed as a waiver of any provision or right. This Agreement constitutes the complete and exclusive agreement between you and smart10X with respect to its subject matter and supersedes any and all prior agreements or communications.\n\nThis Agreement may not be assigned or transferred by you without our prior written approval. We may assign or transfer this Agreement without your consent to a parent or subsidiary, to an acquirer of assets, or to any other successor or acquirer.` },
  { id: 23, title: 'Changes to this Agreement and the Services', content: `smart10X reserves the right, at its sole and absolute discretion, to change, modify, add to, supplement, suspend, discontinue, or delete any of the terms and conditions of this Agreement at any time, effective with or without prior notice.\n\nsmart10X will endeavor to notify you of material changes by email. Your continued use of the Services following any revision to this Agreement constitutes your complete and irrevocable acceptance of any and all such changes.` },
  { id: 24, title: 'No Rights of Third Parties', content: `None of the terms of this Agreement are enforceable by any persons who are not a party to this Agreement.` },
  { id: 25, title: 'Notices and Consent to Receive Notices Electronically', content: `You consent to receive any agreements, notices, disclosures and other communications to which this Agreement refers electronically, including without limitation by email or by posting Notices on the Site. You agree that all Notices that we provide to you electronically satisfy any legal requirement that such communications be in writing.` },
  { id: 26, title: 'Contacting Us', content: `If you have any questions about these Terms of Service or about the Services, please contact us:\n\nEmail: legal@smart10x.com\nSupport: Visit the Help Center from your dashboard\n\nsmart10X AI\n© 2026 smart10X AI. All rights reserved.` },
];

export default function Terms() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header Card */}
        <div style={{ background: 'white', borderRadius: '40px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)', padding: '60px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', zIndex: 0 }} />

          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px', position: 'relative', zIndex: 1 }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 28px rgba(37,99,235,0.25)' }}>
              <Scale size={44} color="white" />
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-2px', lineHeight: 1.1 }}>Terms of Service</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>smart10X, Inc. — Effective Date: April 1, 2026</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef9c3', color: '#854d0e', padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid #fde68a' }}>
              ⚠️ This agreement contains a binding arbitration provision — please read carefully
            </div>
          </div>
        </div>

        {/* Intro Box */}
        <div style={{ background: '#0f172a', color: 'white', borderRadius: '24px', padding: '32px 40px', marginBottom: '32px', lineHeight: '1.75', fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.85)' }}>
            These Terms of Service constitute a legally binding agreement between you and <strong style={{ color: 'white' }}>smart10X, Inc.</strong> ("smart10X", "we," "our" or "us") governing your use of our products, services, mobile application, and website (collectively, the "Services").
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            <strong style={{ color: '#60a5fa' }}>BY CLICKING "I AGREE", REGISTERING FOR AN ACCOUNT, OR USING THE SERVICES, YOU AGREE TO BE BOUND BY THESE TERMS.</strong> If you do not agree, you have no right to access or use the Services.
          </p>
        </div>

        {/* Table of Contents */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '36px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>📋 Table of Contents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => { toggle(s.id); setTimeout(() => document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', color: '#475569', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
                <ChevronRight size={14} /> {s.id}. {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {sections.map(s => (
            <div key={s.id} id={`section-${s.id}`} style={{ background: 'white', borderRadius: '20px', border: `1px solid ${openSection === s.id ? '#bfdbfe' : '#e2e8f0'}`, boxShadow: openSection === s.id ? '0 8px 24px rgba(59,130,246,0.08)' : '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.3s', overflow: 'hidden' }}>
              <button onClick={() => toggle(s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: openSection === s.id ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: openSection === s.id ? 'white' : '#64748b' }}>{s.id}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: openSection === s.id ? '#1e40af' : '#1e293b' }}>{s.title}</span>
                </div>
                <ChevronDown size={18} color={openSection === s.id ? '#3b82f6' : '#94a3b8'} style={{ transform: openSection === s.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0 }} />
              </button>

              {openSection === s.id && (
                <div style={{ padding: '0 28px 28px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ paddingTop: '20px' }}>
                    {s.content.split('\n').map((line, i) => (
                      line.trim() === '' ? <br key={i} /> :
                      line.startsWith('•') ? (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#3b82f6', fontWeight: '700', flexShrink: 0, marginTop: '2px' }}>•</span>
                          <span style={{ color: '#475569', lineHeight: '1.7', fontSize: '0.95rem' }}>{line.slice(1).trim()}</span>
                        </div>
                      ) : (
                        <p key={i} style={{ color: '#475569', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '12px' }}>{line}</p>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Questions About These Terms?</h3>
          <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.95rem' }}>Our legal team is happy to clarify anything in this Agreement.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <a href="mailto:legal@smart10x.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(37,99,235,0.2)' }}>
              <Mail size={18} /> legal@smart10x.com
            </a>
            <Link to="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#f8fafc', color: '#1e293b', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #e2e8f0' }}>
              Help Center
            </Link>
          </div>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
          © 2026 smart10X AI. All rights reserved. · <Link to="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
        </footer>
      </div>
    </div>
  );
}
