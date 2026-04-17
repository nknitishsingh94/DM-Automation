import Flow from '../models/Flow.js';
import Message from '../models/Message.js';
import Contact from '../models/Contact.js';
import { sendMessageToInstagram, sendPrivateReply } from './metaApi.js';
import mongoose from 'mongoose';

/**
 * FlowRunner Engine
 * Interprets and executes node-based automation graphs
 */
export const runFlow = async (userId, flowId, contactId, platform, initialText = '', commentId = null) => {
  try {
    const flow = await Flow.findOne({ _id: flowId, userId });
    if (!flow || flow.status !== 'Active') return;

    const contact = await Contact.findOne({ chatId: contactId, userId });
    if (!contact || contact.isBotMuted) return;

    // 1. Identify starting point
    // We look for a node of type 'trigger' 
    let currentNode = flow.nodes.find(n => n.type === 'trigger');
    if (!currentNode) {
      // Fallback: use first message node
      currentNode = flow.nodes.find(n => n.type === 'message');
    }

    if (!currentNode) return;

    // 2. Traversal Loop
    let iterations = 0;
    const MAX_NODES = 10; // Prevent infinite loops

    while (currentNode && iterations < MAX_NODES) {
      iterations++;
      console.log(`🚀 Executing Node: ${currentNode.id} (${currentNode.type})`);

      // Handle Node Types
      if (currentNode.type === 'message') {
        const text = currentNode.data?.text || 'Hello!';
        const mediaUrl = currentNode.data?.mediaUrl || '';
        
        if (commentId) {
          await sendPrivateReply(platform, commentId, text, userId);
        } else {
          await sendMessageToInstagram(platform, contactId, text, mediaUrl, userId);
        }

        // Save AI response to DB
        const aiMsg = new Message({
          userId: new mongoose.Types.ObjectId(userId),
          chatId: contactId, sender: 'AI Agent', text, type: 'sent', platform, isAI: true, timestamp: new Date()
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

      // 3. Find Next Node via Edges
      // Simple path: Find edge where source === current.id
      const outgoingEdges = flow.edges.filter(e => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) break;

      // Handle branching for 'condition' type nodes
      if (currentNode.type === 'condition') {
        // TODO: Implement logic based on edge labels like 'True'/'False'
        // For now, always take first path or use simple criteria
        currentNode = flow.nodes.find(n => n.id === outgoingEdges[0].target);
      } else {
        // Standard linear path
        currentNode = flow.nodes.find(n => n.id === outgoingEdges[0].target);
      }

      // If next node is a "wait" or "user_input" we would break here and save state
      // For mvp, we run linearly
    }

  } catch (err) {
    console.error("❌ FlowRunner Error:", err.message);
  }
};
