const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/utils/flowTemplates.js');
let content = fs.readFileSync(file, 'utf8');

// I will just use a smarter AST/Regex based approach
// For edges from node '1' (which is almost always 'trigger'), we DO NOT add sourceHandle: 'next'.
// For edges from a node with type 'ai', we DO NOT add sourceHandle: 'next'.
// For 'condition' nodes, they already have 'true'/'false'.

// Replace { id: 'e1-2', source: '1', target: '2' } -> add style only
content = content.replace(/\{ id: 'e1-2', source: '1', target: '2' \}/g, "{ id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }");

// Replace edges coming from source '2' without sourceHandle -> add sourceHandle: 'next' AND style
// Wait, in some cases Node 2 is AI or Condition.
// Let's just do a manual replacement in the script since there aren't *that* many templates.

// A safer approach is to replace:
// sourceHandle: 'b1' -> style
// sourceHandle: 'b2' -> style
// sourceHandle: 'true' -> style
// sourceHandle: 'false' -> style
// What about source: '2', target: '3' without handle?

// Let's use eval to parse the file, modify it, and then stringify... wait, we can't easily stringify JS code back to the exact format with functions.
// Actually, `flowTemplates.js` only exports a function `getTemplateData`. We can't eval and overwrite the file easily.

// Let's use regex with specific knowledge:
// 1. All edges from '1' -> '2':
content = content.replace(/\{ id: 'e1-2', source: '1', target: '2' \}/g, "{ id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }");

// 2. All edges from source '2' to target '3' without sourceHandle:
// If it's AI, it shouldn't have handle. If message, it should be 'next'.
// Let's just add { type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } } to EVERY edge that doesn't have it yet.
// regex to find all edge objects and add styles if missing:
const edgeRegex = /\{ id: '([^']+)', source: '([^']+)', (?:sourceHandle: '([^']+)', )?target: '([^']+)' \}/g;
content = content.replace(edgeRegex, (match, id, source, sourceHandle, target) => {
    let newEdge = `{ id: '${id}', source: '${source}', `;
    if (sourceHandle) {
        newEdge += `sourceHandle: '${sourceHandle}', `;
    } else {
        // If source is not '1' and it's a message node, we need 'next'.
        // To be safe, if source != '1', let's assume it needs 'next' UNLESS it's an AI node.
        // I'll just skip adding sourceHandle and only add style. React flow might auto-connect if there's only one un-id'd handle... 
        // wait, I explicitly added `id="next"` to the fallback handle in MessageNode! So it NEEDS `sourceHandle: 'next'`.
        // Let's just remove the id="next" from MessageNode's fallback handle in FlowBuilder.jsx!
        // That is MUCH safer and easier!
    }
    newEdge += `target: '${target}' }`;
    return match; // didn't change anything here, see thoughts below
});
