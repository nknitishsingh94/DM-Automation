export const getTemplateData = (templateId) => {
  switch (templateId) {
    case 'automate_conv_ai':
      return {
        name: 'AI Conversation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'HI' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'auto_reply_dm':
      return {
        name: 'Auto-reply to DM',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'MENU' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is our product lineup! \n1. Product A\n2. Product B" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'auto_send_links_dm':
      return {
        name: 'Auto-send Website Link',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'LINK' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! Here's the link to my website: https://example.com" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'follow_first_freebie':
      return {
        name: 'Follow for Freebie',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'FREEBIE' } },
          { id: '2', type: 'condition', position: { x: 250, y: 200 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 50, y: 350 }, data: { text: "Here is your freebie! Enjoy 🎁" } },
          { id: '4', type: 'message', position: { x: 450, y: 350 }, data: { text: "Please follow us first to get the freebie! 😊" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true' },
          { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false' }
        ]
      };
    case 'grow_email_list':
      return {
        name: 'Email List Builder',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'EMAIL' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Awesome! What's your best email address?" } },
          { id: '3', type: 'condition', position: { x: 250, y: 350 }, data: { condition: 'Wait for Reply' } },
          { id: '4', type: 'message', position: { x: 250, y: 500 }, data: { text: "Got it! We've sent the details to your inbox." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' }
        ]
      };
    case 'run_giveaway':
      return {
        name: 'Giveaway Automation',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'WIN' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "You're entered into the giveaway! 🎉 Want an extra entry? Share this to your story." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_followers_comments_flow':
      return {
        name: 'Comment to Follow Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'GIFT', publicReplyText: 'Check DMs! 🚀' } },
          { id: '2', type: 'condition', position: { x: 250, y: 200 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 50, y: 350 }, data: { text: "Here is your gift! 🎁" } },
          { id: '4', type: 'message', position: { x: 450, y: 350 }, data: { text: "Please follow us to unlock the gift! 😊" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e2-4', source: '2', target: '4' }
        ]
      };
    case 'grow_youtube':
      return {
        name: 'YouTube Subscriber Growth',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'YOUTUBE' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Thanks for the support! Subscribe to my YouTube channel here: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'recognize_questions_ai':
      return {
        name: 'AI FAQ Agent',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'QUESTION' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'get_collabs_stories':
      return {
        name: 'Story Collab Manager',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'COLLAB' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! We'd love to chat about a collab. Please send your media kit to collab@example.com" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'give_coupons_stories':
      return {
        name: 'Story VIP Coupon',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'VIP' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is your secret VIP coupon code: VIP20 💸" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'go_to_whatsapp':
      return {
        name: 'Move to WhatsApp',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'WHATSAPP' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Let's chat on WhatsApp! Click here to message me: https://wa.me/..." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'send_offers_live':
      return {
        name: 'Live Offers',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'LIVE' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Thanks for joining the Live! Here is the special offer link as promised: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'sell_reel_comments':
      return {
        name: 'Sell from Reel',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'BUY', publicReplyText: 'Sent you a DM! 🛒' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is the link to purchase the item from the reel! 🛍️" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'dm_course':
      return {
        name: 'Course Launch Early Access',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'COURSE' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "You're in! Here is your exclusive early access link to the course: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_sms_list':
      return {
        name: 'Grow SMS List',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'TEXT' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Awesome! What's your phone number so we can text you?" } },
          { id: '3', type: 'condition', position: { x: 250, y: 350 }, data: { condition: 'Wait for Reply' } },
          { id: '4', type: 'message', position: { x: 250, y: 500 }, data: { text: "Got it! You're added to our SMS list. 📱" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' }
        ]
      };
    case 'trigger_dms_live':
      return {
        name: 'IG Live Lead Gen',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'JOIN' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! Drop your email below to get the resources we're talking about on the Live." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'answer_faqs_stories':
      return {
        name: 'Story FAQ Bot',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'FAQ' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    default:
      return {
        name: 'New Automation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'START' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: 'Welcome to our automation!' } },
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
  }
};
