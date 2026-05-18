import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
// Service role key bypasses RLS — used ONLY for server-side storage uploads
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

export let supabase = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } else {
    console.warn('⚠️ Supabase URL is not configured or is invalid. Add it to .env. Database actions will be logged but skipped.');
  }
} catch (e) {
  console.warn('⚠️ Could not initialize Supabase Client:', e.message);
}

// Separate admin client for storage uploads (bypasses RLS)
let supabaseAdmin = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (e) {}

export const uploadToSupabase = async (fileBuffer, fileName, contentType) => {
  const client = supabaseAdmin || supabase;
  if (!client) return null;
  try {
    // --- AUTO-CREATE BUCKET IF MISSING ---
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'media');
    
    if (!bucketExists) {
      console.log("📁 Creating 'media' bucket in Supabase...");
      await client.storage.createBucket('media', { public: true });
    }

    const { data, error } = await client.storage
      .from('media') 
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = client.storage
      .from('media')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (err) {
    console.error('❌ Supabase Upload Error:', err.message);
    return null;
  }
};

const isUUID = (str) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const convertObjectIDToUUID = (id) => {
  if (typeof id !== 'string') return id;
  if (id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
    return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(12, 16)}-${id.substring(16, 20)}-${id.substring(20, 24)}00000000`;
  }
  return id;
};

const convertUUIDToObjectID = (uuid) => {
  if (typeof uuid !== 'string') return uuid;
  if (uuid.endsWith('00000000')) {
    const clean = uuid.replace(/-/g, '');
    if (clean.length === 32) {
      return clean.substring(0, 24);
    }
  }
  return uuid;
};


function parseFilter(q, queryObj, tableName) {
  if (!queryObj) return q;
  
  if (tableName) {
    console.log(`🔍 [Supabase Query] Table: ${tableName}, Filter Keys: ${Object.keys(queryObj).join(', ')}`);
  }

  const fieldMap = {
    'userId': (tableName === 'captions') ? 'user_id' : 'userId',
    'createdAt': (tableName === 'scheduled_posts' || tableName === 'captions') ? 'created_at' : 'createdAt',
    'updatedAt': (tableName === 'scheduled_posts' || tableName === 'captions') ? 'updated_at' : 'updatedAt',
    'dmsSent': 'dmsSent',
    'trigger': 'trigger',
    'response': 'response',
    'triggerSource': 'triggerSource',
    'triggerOnDms': 'triggerOnDms',
    'triggerOnComments': 'triggerOnComments',
    'triggerOnStories': 'triggerOnStories',
    'publicReplyText': 'publicReplyText',
    'isUniversal': 'isUniversal',
    'status': 'status',
    'isAI': 'isAI',
    'timestamp': 'timestamp',
    'chatId': 'chatId',
    'automationStatus': 'automationStatus'
  };

  for (const [key, v] of Object.entries(queryObj)) {
    let val = v;
    if (val instanceof Date) {
      val = val.toISOString();
    }

    let parsedKey = (key === '_id' || key === 'id') ? 'id' : (fieldMap[key] || key);
    
    // UUID Safety Check: Prevents Postgres from crashing on invalid UUID syntax
    const uuidColumns = ['id', 'userId', 'user_id'];
    
    // Map ObjectID queries to UUID queries for UUID columns
    if (uuidColumns.includes(parsedKey) && val && typeof val === 'string' && val.length === 24 && /^[0-9a-f]{24}$/i.test(val)) {
      val = convertObjectIDToUUID(val);
    }

    if (uuidColumns.includes(parsedKey) && val && typeof val === 'string' && !isUUID(val)) {
        console.warn(`🛑 Skipping filter for invalid UUID on column ${parsedKey}: ${val}`);
        // Instead of crashing, we force a no-match to prevent 500 error
        q = q.eq(parsedKey, '00000000-0000-0000-0000-000000000000');
        continue;
    }

    if (key === '$or' && Array.isArray(val)) {
      const orConditions = val.map(cond => {
        const [subKey, subValRaw] = Object.entries(cond)[0];
        const subVal = subValRaw instanceof Date ? subValRaw.toISOString() : subValRaw;
        let subParsedKey = subKey === '_id' || subKey === 'id' ? 'id' : subKey;
        if (subKey === 'userId') {
          subParsedKey = (tableName === 'captions') ? 'user_id' : 'userId';
        }
        return `${subParsedKey}.eq.${subVal}`;
      }).join(',');
      q = q.or(orConditions);
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
      for (const [op, subValRaw] of Object.entries(val)) {
        let subVal = subValRaw;
        if (subVal instanceof Date) {
          subVal = subVal.toISOString();
        }
        
        if (op === '$gte') q = q.gte(parsedKey, subVal);
        else if (op === '$lte') q = q.lte(parsedKey, subVal);
        else if (op === '$gt') q = q.gt(parsedKey, subVal);
        else if (op === '$lt') q = q.lt(parsedKey, subVal);
        else if (op === '$ne') q = q.neq(parsedKey, subVal);
        else if (op === '$in') q = q.in(parsedKey, subVal);
        else q = q.eq(parsedKey, subVal);
      }
    } else {
      q = q.eq(parsedKey, val);
    }
  }
  return q;
}

function convertIncoming(doc, tableName) {
  if (!doc) return null;
  const newDoc = { ...doc };
  if (doc.id) {
    newDoc._id = doc.id;
  }
  // Universal mapping for incoming data
  if (doc.user_id) newDoc.userId = doc.user_id;
  if (doc.userid) newDoc.userId = doc.userid;
  if (newDoc.userId) newDoc.userId = convertUUIDToObjectID(newDoc.userId);
  if (doc.created_at) newDoc.createdAt = doc.created_at;
  if (doc.updated_at) newDoc.updatedAt = doc.updated_at;
  if (doc.automation_status) newDoc.automationStatus = doc.automation_status;

  ['requireFollow', 'openingMessage', 'triggerOnDms', 'triggerOnComments', 'triggerOnStories', 'isAnyPost', 'isUniversal'].forEach(field => {
    if (newDoc[field] !== undefined && newDoc[field] !== null) {
      if (typeof newDoc[field] === 'string') {
        newDoc[field] = newDoc[field] === 'true' || newDoc[field] === 't';
      } else {
        newDoc[field] = Boolean(newDoc[field]);
      }
    }
  });
  if (tableName === 'campaigns') {
    if (newDoc.response && newDoc.response.includes('__CAMP_NAME__:')) {
      const startIdx = newDoc.response.indexOf('__CAMP_NAME__:');
      const endIdx = newDoc.response.indexOf('__END_CAMP_NAME__');
      if (startIdx !== -1 && endIdx !== -1) {
        const name = newDoc.response.slice(startIdx + '__CAMP_NAME__:'.length, endIdx);
        newDoc.name = name;
        newDoc.response = newDoc.response.slice(0, startIdx) + newDoc.response.slice(endIdx + '__END_CAMP_NAME__'.length);
      }
    }
    // Parse isAI from response tag
    if (newDoc.response && newDoc.response.includes('__IS_AI__:')) {
      const startIdx = newDoc.response.indexOf('__IS_AI__:');
      const endIdx = newDoc.response.indexOf('__END_IS_AI__');
      if (startIdx !== -1 && endIdx !== -1) {
        const valStr = newDoc.response.slice(startIdx + '__IS_AI__:'.length, endIdx);
        newDoc.isAI = valStr === 'true';
        newDoc.response = newDoc.response.slice(0, startIdx) + newDoc.response.slice(endIdx + '__END_IS_AI__'.length);
      }
    } else {
      newDoc.isAI = false;
    }
  }
  newDoc.toObject = () => newDoc;
  return newDoc;
}

function convertOutgoing(doc, tableName) {
  if (!doc) return null;
  const newDoc = { ...doc };
  if (newDoc._id) {
    newDoc.id = newDoc._id;
    delete newDoc._id;
  }
  
  // Per-table mapping based on verified schema
  if (newDoc.userId) {
    const mappedUserId = convertObjectIDToUUID(newDoc.userId);
    if (tableName === 'captions') {
      newDoc.user_id = mappedUserId;
      delete newDoc.userId;
    } else {
      newDoc.userId = mappedUserId;
      delete newDoc.user_id;
    }
  }

  if (newDoc.createdAt) {
    const fieldName = (tableName === 'scheduled_posts' || tableName === 'captions') ? 'created_at' : 'createdAt';
    newDoc[fieldName] = newDoc.createdAt;
    if (fieldName !== 'createdAt') delete newDoc.createdAt;
  }
  if (newDoc.updatedAt) {
    const fieldName = (tableName === 'scheduled_posts' || tableName === 'captions') ? 'updated_at' : 'updatedAt';
    newDoc[fieldName] = newDoc.updatedAt;
    if (fieldName !== 'updatedAt') delete newDoc.updatedAt;
  }
  
  if (newDoc.automationStatus) {
    delete newDoc.automation_status;
  }

  if (tableName === 'campaigns') {
    // Pack isAI into response field to avoid schema cache issues
    if (newDoc.isAI !== undefined && newDoc.isAI !== null) {
      newDoc.response = `__IS_AI__:${newDoc.isAI}__END_IS_AI__${newDoc.response || ''}`;
    }
    if (newDoc.name && newDoc.response) {
      newDoc.response = `__CAMP_NAME__:${newDoc.name}__END_CAMP_NAME__${newDoc.response}`;
    }
    delete newDoc.name;
    delete newDoc.isAI;
  }
  delete newDoc.toObject;
  delete newDoc.save;
  delete newDoc.comparePassword;
  return newDoc;
}


export function createSupabaseModel(tableName, comparePasswordFunc, hashPasswordFunc) {
  function ModelInstance(data) {
    const doc = { ...data };

    if (comparePasswordFunc) {
      doc.comparePassword = async function (candidatePassword) {
        return comparePasswordFunc(candidatePassword, doc.password);
      };
    }

    doc.toObject = () => {
      const obj = { ...doc };
      delete obj.save;
      delete obj.toObject;
      delete obj.comparePassword;
      return obj;
    };

    doc.save = async function () {
      if (!supabase) {
        console.warn(`⚠️ Supabase is not connected. This save() operation for table '${tableName}' was skipped.`);
        return doc;
      }

      if (hashPasswordFunc && doc.password && !doc.id && !doc._id) {
        doc.password = await hashPasswordFunc(doc.password);
      }

      let finalDoc = { ...doc };
      if (tableName === 'campaigns' && (doc._id || doc.id)) {
        const idToUse = doc.id || doc._id;
        const existing = await ModelInstance.findById(idToUse);
        if (existing) {
          finalDoc = { ...existing, ...doc };
        }
      }
      const cleanData = convertOutgoing(finalDoc, tableName);

      if (doc._id || doc.id) {
        const idToUse = doc.id || doc._id;
        const { data: updated, error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', idToUse)
          .select();
        if (error) throw error;
        if (updated && updated.length > 0) {
          Object.assign(doc, convertIncoming(updated[0], tableName));
        }
      } else {
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert(cleanData)
          .select();
        if (error) throw error;
        if (inserted && inserted.length > 0) {
          Object.assign(doc, convertIncoming(inserted[0], tableName));
        }
      }
      return doc;
    };

    return doc;
  }

  ModelInstance.find = function (query) {
    if (!supabase) {
      console.warn(`⚠️ Supabase is not connected. This find() operation for table '${tableName}' was skipped.`);
      const dummyPromise = Promise.resolve([]);
      dummyPromise.sort = () => dummyPromise;
      dummyPromise.limit = () => dummyPromise;
      return dummyPromise;
    }

    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query, tableName);

    const queryObj = {
      sort: function (sortObj) {
        if (sortObj) {
          const [field, dir] = Object.entries(sortObj)[0];
          let parsedField = field;
          if (field === 'createdAt') parsedField = (tableName === 'settings' || tableName === 'campaigns') ? 'createdAt' : 'created_at';
          if (field === 'updatedAt') parsedField = (tableName === 'settings' || tableName === 'campaigns') ? 'updatedAt' : 'updated_at';
          if (field === 'userId') parsedField = (tableName === 'settings' || tableName === 'campaigns') ? 'userId' : 'user_id';
          
          console.log(`   └─ Sorting by: ${parsedField} (${dir === 1 ? 'asc' : 'desc'}) for table ${tableName}`);
          q = q.order(parsedField, { ascending: dir === 1 });
        }
        return this;
      },
      limit: function (num) {
        if (num) {
          q = q.limit(num);
        }
        return this;
      },
      populate: function (field) {
        // Stub for MongoDB compatibility, could implement basic join logic if needed
        console.log(`ℹ️ Populate called for field: ${field} (Supabase stub)`);
        return this;
      },
      // Make it awaitable
      then: async function (resolve, reject) {
        try {
          const { data, error } = await q;
          if (error) throw error;
          const results = (data || []).map(d => ModelInstance(convertIncoming(d, tableName)));
          resolve(results);
        } catch (err) {
          reject(err);
        }
      }
    };

    return queryObj;
  };

  ModelInstance.findOne = async function (query) {
    if (!supabase) {
      console.warn(`⚠️ Supabase is not connected. This findOne() operation for table '${tableName}' was skipped.`);
      return null;
    }
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query, tableName);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    return data && data.length > 0 ? ModelInstance(convertIncoming(data[0], tableName)) : null;
  };

  ModelInstance.findById = async function (id) {
    if (!supabase || !id) return null;
    let idToUse = id;
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
      idToUse = convertObjectIDToUUID(id);
    }
    if (!['users', 'settings'].includes(tableName) && !isUUID(idToUse)) {
      console.warn(`🛑 findById skipped: Invalid UUID format "${idToUse}"`);
      return null;
    }
    const { data, error } = await supabase.from(tableName).select('*').eq('id', idToUse).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? ModelInstance(convertIncoming(data[0], tableName)) : null;
  };


  ModelInstance.findOneAndUpdate = async function (query, updateData, options = {}) {
    if (!supabase) return null;
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query, tableName);
    const { data, error: getErr } = await q.limit(1);
    const existing = data && data.length > 0 ? data[0] : null;

    let finalUpdate = { ...updateData };
    
    // Handle MongoDB operators
    if (updateData.$set) {
      finalUpdate = { ...finalUpdate, ...updateData.$set };
      delete finalUpdate.$set;
    }
    
    if (updateData.$unset) {
      for (const key of Object.keys(updateData.$unset)) {
        finalUpdate[key] = null;
      }
      delete finalUpdate.$unset;
    }

    if (existing) {
      if (updateData.$inc) {
        for (const [key, val] of Object.entries(updateData.$inc)) {
          finalUpdate[key] = (existing[key] || 0) + val;
        }
        delete finalUpdate.$inc;
      }
      finalUpdate = { ...convertIncoming(existing, tableName), ...finalUpdate };
    }
    const cleanUpdate = convertOutgoing(finalUpdate, tableName);

    if (getErr || !existing) {
      if (options.upsert) {
        const insertData = { ...convertOutgoing(query, tableName), ...cleanUpdate };
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert(insertData)
          .select();
        if (error) throw error;
        return inserted && inserted.length > 0 ? convertIncoming(inserted[0], tableName) : null;
      }
      return null;
    }

    const { data: updated, error } = await supabase
      .from(tableName)
      .update(cleanUpdate)
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return updated && updated.length > 0 ? convertIncoming(updated[0], tableName) : null;
  };

  ModelInstance.countDocuments = async function (query) {
    if (!supabase) return 0;
    let q = supabase.from(tableName).select('*', { count: 'exact', head: true });
    q = parseFilter(q, query, tableName);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  };

  ModelInstance.findOneAndDelete = async function (query) {
    if (!supabase) return null;
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query, tableName);
    const { data, error: getErr } = await q.limit(1);
    const existing = data && data.length > 0 ? data[0] : null;
    if (getErr || !existing) return null;

    const { error } = await supabase.from(tableName).delete().eq('id', existing.id);
    if (error) throw error;
    return convertIncoming(existing, tableName);
  };

  ModelInstance.findByIdAndDelete = async function (id) {
    if (!supabase || !id) return null;
    const existing = await ModelInstance.findById(id);
    if (!existing) return null;

    let idToUse = id;
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
      idToUse = convertObjectIDToUUID(id);
    }
    const { error } = await supabase.from(tableName).delete().eq('id', idToUse);
    if (error) throw error;
    return existing;
  };

  ModelInstance.findByIdAndUpdate = async function (id, updateData, options = {}) {
    if (!supabase || !id) return null;
    let idToUse = id;
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
      idToUse = convertObjectIDToUUID(id);
    }
    return await ModelInstance.findOneAndUpdate({ id: idToUse }, updateData, options);
  };

  ModelInstance.deleteMany = async function (query) {
    if (!supabase) return { acknowledged: true };
    let q = supabase.from(tableName).delete();
    q = parseFilter(q, query, tableName);
    const { error } = await q;
    if (error) throw error;
    return { acknowledged: true };
  };


  ModelInstance.distinct = async function (field, query) {
    if (!supabase) return [];
    let q = supabase.from(tableName).select(field);
    q = parseFilter(q, query, tableName);
    const { data, error } = await q;
    if (error) throw error;
    return [...new Set((data || []).map(item => item[field]))];
  };

  ModelInstance.aggregate = async function (pipeline) {
    if (!supabase) return [];
    let q = supabase.from(tableName).select('*');
    const matchStage = pipeline.find(p => p.$match);
    if (matchStage) {
      q = parseFilter(q, matchStage.$match, tableName);
    }
    const { data, error } = await q;
    if (error) throw error;

    const groupStage = pipeline.find(p => p.$group);
    if (groupStage) {
      const sumField = Object.keys(groupStage).find(key => groupStage[key].$sum);
      if (sumField) {
        const sumOn = typeof groupStage[sumField].$sum === 'string'
          ? groupStage[sumField].$sum.replace('$', '')
          : null;
        if (sumOn) {
          const total = (data || []).reduce((acc, item) => acc + (item[sumOn] || 0), 0);
          return [{ _id: null, total }];
        }
      }
    }

    return (data || []).map(d => convertIncoming(d, tableName));
  };

  ModelInstance.create = async function (docs) {
    if (!supabase) return Array.isArray(docs) ? [] : null;
    const isArr = Array.isArray(docs);
    const toInsert = isArr ? docs : [docs];

    const insertedDocs = [];
    for (const doc of toInsert) {
      let finalDoc = { ...doc };
      const cleanData = convertOutgoing(finalDoc, tableName);
      const { data, error } = await supabase
        .from(tableName)
        .insert(cleanData)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        insertedDocs.push(convertIncoming(data[0], tableName));
      }
    }
    return isArr ? insertedDocs : insertedDocs[0];
  };

  ModelInstance.deleteOne = async function (query) {
    if (!supabase) return { acknowledged: true, deletedCount: 0 };
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const { error: delErr } = await supabase.from(tableName).delete().eq('id', data[0].id);
      if (delErr) throw delErr;
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  };

  ModelInstance.updateOne = async function (query, updateData, options = {}) {
    if (!supabase) return { acknowledged: true, modifiedCount: 0 };
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const existing = data[0];
      let finalUpdate = { ...updateData };
      if (updateData.$inc) {
        for (const [key, val] of Object.entries(updateData.$inc)) {
          finalUpdate[key] = (existing[key] || 0) + val;
        }
        delete finalUpdate.$inc;
      }
      finalUpdate = { ...convertIncoming(existing, tableName), ...finalUpdate };
      const cleanUpdate = convertOutgoing(finalUpdate, tableName);
      const { error: upErr } = await supabase.from(tableName).update(cleanUpdate).eq('id', data[0].id);
      if (upErr) throw upErr;
      return { acknowledged: true, modifiedCount: 1 };
    }
    return { acknowledged: true, modifiedCount: 0 };
  };



  ModelInstance.updateMany = async function (query, updateData, options = {}) {
    if (!supabase) return { acknowledged: true, modifiedCount: 0 };
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query, tableName);
    const { data, error } = await q;
    if (error) throw error;
    if (data && data.length > 0) {
      let modifiedCount = 0;
      for (const existing of data) {
        let finalUpdate = { ...updateData };
        if (updateData.$set) {
          finalUpdate = { ...finalUpdate, ...updateData.$set };
        }
        if (updateData.$unset) {
          for (const key of Object.keys(updateData.$unset)) {
            finalUpdate[key] = null;
          }
        }
        delete finalUpdate.$set;
        delete finalUpdate.$unset;
        if (updateData.$inc) {
          for (const [key, val] of Object.entries(updateData.$inc)) {
            finalUpdate[key] = (existing[key] || 0) + val;
          }
          delete finalUpdate.$inc;
        }
        const merged = { ...convertIncoming(existing, tableName), ...finalUpdate };
        const cleanUpdate = convertOutgoing(merged, tableName);
        const { error: upErr } = await supabase.from(tableName).update(cleanUpdate).eq('id', existing.id);
        if (upErr) throw upErr;
        modifiedCount++;
      }
      return { acknowledged: true, modifiedCount };
    }
    return { acknowledged: true, modifiedCount: 0 };
  };

  return ModelInstance;
}
