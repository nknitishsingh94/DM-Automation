import { generateAIResponse } from './aiHandler.js';
import Flow from '../models/Flow.js';
import Contact from '../models/Contact.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendMessageToInstagram, sendPrivateReply } from './metaApi.js';

/**
 * FlowRunner Engine
 * Interprets and executes node-based automation graphs
 */
export const runFlow = async (userId, flowId, contactId, platform, initialText = '', commentId = null, workspaceId = null) => {
  try {
    const flowQuery = { id: flowId, userId };
    if (workspaceId) flowQuery.workspaceId = workspaceId;
    const flow = await Flow.findOne(flowQuery);
    if (!flow || flow.status !== 'Active') return;

    const user = await User.findById(userId);
    if (!user || user.plan !== 'pro') {
      console.log(`❌ Flow Execution Blocked: User ${userId} is not on a PRO plan.`);
      return;
    }

    const contactQuery = { chatId: contactId, userId };
    if (workspaceId) contactQuery.workspaceId = workspaceId;
    const contact = await Contact.findOne(contactQuery);
    if (contact && contact.isBotMuted) return;

    if (typeof flow.nodes === 'string') {
      try { flow.nodes = JSON.parse(flow.nodes); } catch (e) { flow.nodes = []; }
    }
    if (typeof flow.edges === 'string') {
      try { flow.edges = JSON.parse(flow.edges); } catch (e) { flow.edges = []; }
    }

    if (!Array.isArray(flow.nodes)) flow.nodes = [];
    if (!Array.isArray(flow.edges)) flow.edges = [];

    let currentNode = flow.nodes.find(n => n.type === 'trigger');
    if (!currentNode && flow.nodes.length > 0) {
      currentNode = flow.nodes[0]; 
    }

    if (!currentNode) {
       console.log("⚠️ Flow is completely empty, nothing to execute.");
       return;
    }

    let iterations = 0;
    const MAX_NODES = 10; // Prevent infinite loops

    while (currentNode && iterations < MAX_NODES) {
      iterations++;
      console.log(`🚀 Executing Node: ${currentNode.id} (${currentNode.type})`);

      if (currentNode.type === 'message') {
        const text = currentNode.data?.text || 'Hello!';
        const mediaUrl = currentNode.data?.mediaUrl || '';
        
        if (commentId) {
          await sendPrivateReply(platform, commentId, text, userId);
        } else {
          await sendMessageToInstagram(platform, contactId, text, mediaUrl, userId);
        }

        const aiMsg = new Message({
          userId: userId,
          chatId: contactId, sender: 'AI Agent', text, type: 'sent', platform, isAI: true, timestamp: new Date(),
          workspaceId: workspaceId
        });
        await aiMsg.save();
      }

      if (currentNode.type === 'ai') {
        const responseText = await generateAIResponse(userId, initialText || "Continue Conversation", workspaceId);
        
        if (commentId) {
          await sendPrivateReply(platform, commentId, responseText, userId);
        } else {
          await sendMessageToInstagram(platform, contactId, responseText, '', userId);
        }

        const aiMsg = new Message({
          userId: userId,
          chatId: contactId, sender: 'AI Agent', text: responseText, type: 'sent', platform, isAI: true, timestamp: new Date(),
          workspaceId: workspaceId
        });
        await aiMsg.save();
      }

      if (currentNode.type === 'action') {
        if (currentNode.data?.action === 'set_tag') {
          const tag = currentNode.data?.tagValue;
          if (tag && !contact.tags.includes(tag)) {
            contact.tags.push(tag);
            await contact.save();
          }
        }
      }

      const outgoingEdges = flow.edges.filter(e => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) break;

      if (currentNode.type === 'condition') {
        const trueEdge = outgoingEdges.find(e => e.label === 'True' || e.data?.label === 'True');
        currentNode = flow.nodes.find(n => n.id === (trueEdge?.target || outgoingEdges[0].target));
      } else {
        currentNode = flow.nodes.find(n => n.id === outgoingEdges[0].target);
      }

      console.log(`➡️ Moving to next node: ${currentNode?.id} (${currentNode?.type})`);
      
      if (currentNode?.type === 'wait') {
        const delay = parseInt(currentNode.data?.delay) || 2;
        console.log(`⏱️ Waiting ${delay} seconds...`);
        await new Promise(r => setTimeout(r, delay * 1000));
        const nextEdges = flow.edges.filter(e => e.source === currentNode.id);
        if (nextEdges.length > 0) {
           currentNode = flow.nodes.find(n => n.id === nextEdges[0].target);
        } else {
           break;
        }
      }
    }

  } catch (err) {
    console.error("❌ FlowRunner Error:", err.message);
  }
};
