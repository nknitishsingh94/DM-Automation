import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export let supabase = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('⚠️ Supabase URL is not configured or is invalid. Add it to .env. Database actions will be logged but skipped.');
  }
} catch (e) {
  console.warn('⚠️ Could not initialize Supabase Client:', e.message);
}

const isUUID = (str) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

function parseFilter(q, queryObj, tableName) {
  if (!queryObj) return q;
  
  if (tableName) {
    console.log(`🔍 [Supabase Query] Table: ${tableName}, Filter Keys: ${Object.keys(queryObj).join(', ')}`);
  }

  for (const [key, v] of Object.entries(queryObj)) {
    let val = v;
    if (val instanceof Date) {
      val = val.toISOString();
    }

    let parsedKey = (key === '_id' || key === 'id') ? 'id' : key;
    
    // Defensive mapping for case-sensitive Postgres columns
    if (key === 'userId') {
      if (tableName === 'settings' || tableName === 'campaigns' || tableName === 'scheduled_posts') {
        parsedKey = 'userId'; 
      } else {
        parsedKey = 'user_id';
      }
    } else if (key === 'createdAt') {
      parsedKey = (tableName === 'settings' || tableName === 'campaigns') ? 'createdAt' : 'created_at';
    } else if (key === 'updatedAt') {
      parsedKey = (tableName === 'settings' || tableName === 'campaigns') ? 'updatedAt' : 'updated_at';
    }

    if (parsedKey === 'id' && !isUUID(val)) {
        console.warn(`🛑 Skipping filter for non-UUID: ${key}=${val}`);
        q = q.eq('id', '00000000-0000-0000-0000-000000000000');
        continue;
    }

    if (key === '$or' && Array.isArray(val)) {
      const orConditions = val.map(cond => {
        const [subKey, subValRaw] = Object.entries(cond)[0];
        const subVal = subValRaw instanceof Date ? subValRaw.toISOString() : subValRaw;
        let subParsedKey = subKey === '_id' || subKey === 'id' ? 'id' : subKey;
        if (subKey === 'userId') {
          subParsedKey = (tableName === 'settings' || tableName === 'campaigns') ? 'userId' : 'user_id';
        }
        return `${subParsedKey}.eq.${subVal}`;
      }).join(',');
      q = q.or(orConditions);
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
      for (const [op, subVal] of Object.entries(val)) {
        if (op === '$gte') q = q.gte(parsedKey, subVal);
        else if (op === '$lte') q = q.lte(parsedKey, subVal);
        else if (op === '$gt') q = q.gt(parsedKey, subVal);
        else if (op === '$lt') q = q.lt(parsedKey, subVal);
        else if (op === '$ne') q = q.neq(parsedKey, subVal);
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
  if (doc.created_at) newDoc.createdAt = doc.created_at;
  if (doc.updated_at) newDoc.updatedAt = doc.updated_at;

  ['requireFollow', 'openingMessage', 'triggerOnDms', 'triggerOnComments', 'triggerOnStories', 'isAnyPost', 'isUniversal'].forEach(field => {
    if (newDoc[field] !== undefined && newDoc[field] !== null) {
      if (typeof newDoc[field] === 'string') {
        newDoc[field] = newDoc[field] === 'true' || newDoc[field] === 't';
      } else {
        newDoc[field] = Boolean(newDoc[field]);
      }
    }
  });
  if (tableName === 'campaigns' && newDoc.response && newDoc.response.includes('__CAMP_NAME__:')) {
    const startIdx = newDoc.response.indexOf('__CAMP_NAME__:');
    const endIdx = newDoc.response.indexOf('__END_CAMP_NAME__');
    if (startIdx !== -1 && endIdx !== -1) {
      const name = newDoc.response.slice(startIdx + '__CAMP_NAME__:'.length, endIdx);
      newDoc.name = name;
      newDoc.response = newDoc.response.slice(0, startIdx) + newDoc.response.slice(endIdx + '__END_CAMP_NAME__'.length);
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
    if (tableName === 'settings' || tableName === 'campaigns' || tableName === 'scheduled_posts') {
      newDoc.userId = newDoc.userId;
    } else {
      newDoc.user_id = newDoc.userId;
    }
  }

  if (newDoc.createdAt) {
    const fieldName = (tableName === 'settings' || tableName === 'campaigns') ? 'createdAt' : 'created_at';
    newDoc[fieldName] = newDoc.createdAt;
    if (fieldName !== 'createdAt') delete newDoc.createdAt;
  }
  if (newDoc.updatedAt) {
    const fieldName = (tableName === 'settings' || tableName === 'campaigns') ? 'updatedAt' : 'updated_at';
    newDoc[fieldName] = newDoc.updatedAt;
    if (fieldName !== 'updatedAt') delete newDoc.updatedAt;
  }

  if (tableName === 'campaigns') {
    if (newDoc.name && newDoc.response) {
      newDoc.response = `__CAMP_NAME__:${newDoc.name}__END_CAMP_NAME__${newDoc.response}`;
    }
    delete newDoc.name;
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
          const results = (data || []).map(d => convertIncoming(d, tableName));
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
    return data && data.length > 0 ? convertIncoming(data[0], tableName) : null;
  };

  ModelInstance.findById = async function (id) {
    if (!supabase || !id) return null;
    if (!isUUID(id)) {
      console.warn(`🛑 findById skipped: Invalid UUID format "${id}"`);
      return null;
    }
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? convertIncoming(data[0], tableName) : null;
  };

  ModelInstance.findByIdAndUpdate = async function (id, updateData, options = {}) {
    if (!supabase || !id) return null;
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
    
    const existing = await ModelInstance.findById(id);
    if (existing) {
      if (updateData.$inc) {
        for (const [key, val] of Object.entries(updateData.$inc)) {
          finalUpdate[key] = (existing[key] || 0) + val;
        }
        delete finalUpdate.$inc;
      }
      finalUpdate = { ...existing, ...finalUpdate };
    }
    const cleanUpdate = convertOutgoing(finalUpdate, tableName);
    const { data, error } = await supabase
      .from(tableName)
      .update(cleanUpdate)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data && data.length > 0 ? convertIncoming(data[0], tableName) : null;
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

  ModelInstance.deleteMany = async function (query) {
    if (!supabase) return { acknowledged: true };
    let q = supabase.from(tableName).delete();
    q = parseFilter(q, query, tableName);
    const { error } = await q;
    if (error) throw error;
    return { acknowledged: true };
  };

  ModelInstance.countDocuments = async function (query) {
    if (!supabase) return 0;
    let q = supabase.from(tableName).select('*', { count: 'exact', head: true });
    q = parseFilter(q, query, tableName);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
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

  ModelInstance.findByIdAndDelete = async function (id) {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const { error: delErr } = await supabase.from(tableName).delete().eq('id', id);
      if (delErr) throw delErr;
      return convertIncoming(data[0], tableName);
    }
    return null;
  };

  return ModelInstance;
}
