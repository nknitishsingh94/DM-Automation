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

function parseFilter(q, queryObj) {
  if (!queryObj) return q;

  for (const [key, val] of Object.entries(queryObj)) {
    if (key === '_id' || key === 'id') {
      q = q.eq('id', val);
    } else if (key === '$or' && Array.isArray(val)) {
      const orConditions = val.map(cond => {
        const [subKey, subVal] = Object.entries(cond)[0];
        const parsedKey = subKey === '_id' || subKey === 'id' ? 'id' : subKey;
        return `${parsedKey}.eq.${subVal}`;
      }).join(',');
      q = q.or(orConditions);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const [op, subVal] of Object.entries(val)) {
        const parsedKey = key === '_id' || key === 'id' ? 'id' : key;
        if (op === '$gte') q = q.gte(parsedKey, subVal);
        else if (op === '$lte') q = q.lte(parsedKey, subVal);
        else if (op === '$gt') q = q.gt(parsedKey, subVal);
        else if (op === '$lt') q = q.lt(parsedKey, subVal);
        else q = q.eq(parsedKey, subVal);
      }
    } else {
      q = q.eq(key, val);
    }
  }
  return q;
}

function convertIncoming(doc) {
  if (!doc) return null;
  const newDoc = { ...doc };
  if (doc.id) {
    newDoc._id = doc.id;
  }
  if (newDoc.response && newDoc.response.includes('__CAMP_NAME__:')) {
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

function convertOutgoing(doc) {
  if (!doc) return null;
  const newDoc = { ...doc };
  if (newDoc._id) {
    newDoc.id = newDoc._id;
    delete newDoc._id;
  }
  if (newDoc.name && newDoc.response) {
    newDoc.response = `__CAMP_NAME__:${newDoc.name}__END_CAMP_NAME__${newDoc.response}`;
  }
  delete newDoc.name;
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
      const cleanData = convertOutgoing(finalDoc);

      if (doc._id || doc.id) {
        const idToUse = doc.id || doc._id;
        const { data: updated, error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', idToUse)
          .select()
          .single();
        if (error) throw error;
        Object.assign(doc, convertIncoming(updated));
      } else {
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert(cleanData)
          .select()
          .single();
        if (error) throw error;
        Object.assign(doc, convertIncoming(inserted));
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
    q = parseFilter(q, query);

    const promise = (async () => {
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(convertIncoming);
    })();

    promise.sort = function (sortObj) {
      if (sortObj) {
        const [field, dir] = Object.entries(sortObj)[0];
        q = q.order(field, { ascending: dir === 1 });
      }
      return promise;
    };

    promise.limit = function (num) {
      if (num) {
        q = q.limit(num);
      }
      return promise;
    };

    return promise;
  };

  ModelInstance.findOne = async function (query) {
    if (!supabase) {
      console.warn(`⚠️ Supabase is not connected. This findOne() operation for table '${tableName}' was skipped.`);
      return null;
    }
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return convertIncoming(data);
  };

  ModelInstance.findById = async function (id) {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return convertIncoming(data);
  };

  ModelInstance.findByIdAndUpdate = async function (id, updateData, options = {}) {
    if (!supabase || !id) return null;
    let finalUpdate = { ...updateData };
    if (tableName === 'campaigns') {
      const existing = await ModelInstance.findById(id);
      if (existing) {
        finalUpdate = { ...existing, ...updateData };
      }
    }
    const cleanUpdate = convertOutgoing(finalUpdate);
    const { data, error } = await supabase
      .from(tableName)
      .update(cleanUpdate)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return convertIncoming(data);
  };

  ModelInstance.findOneAndUpdate = async function (query, updateData, options = {}) {
    if (!supabase) return null;
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query);
    const { data: existing, error: getErr } = await q.maybeSingle();

    let finalUpdate = { ...updateData };
    if (tableName === 'campaigns' && existing) {
      finalUpdate = { ...convertIncoming(existing), ...updateData };
    }
    const cleanUpdate = convertOutgoing(finalUpdate);

    if (getErr || !existing) {
      if (options.upsert) {
        // Build insert data including query fields
        const insertData = { ...convertOutgoing(query), ...cleanUpdate };
        const { data, error } = await supabase
          .from(tableName)
          .insert(insertData)
          .select()
          .maybeSingle();
        if (error) throw error;
        return convertIncoming(data);
      }
      return null;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(cleanUpdate)
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return convertIncoming(data);
  };

  ModelInstance.findOneAndDelete = async function (query) {
    if (!supabase) return null;
    let q = supabase.from(tableName).select('*');
    q = parseFilter(q, query);
    const { data: existing, error: getErr } = await q.maybeSingle();
    if (getErr || !existing) return null;

    const { error } = await supabase.from(tableName).delete().eq('id', existing.id);
    if (error) throw error;
    return convertIncoming(existing);
  };

  ModelInstance.deleteMany = async function (query) {
    if (!supabase) return { acknowledged: true };
    let q = supabase.from(tableName).delete();
    q = parseFilter(q, query);
    const { error } = await q;
    if (error) throw error;
    return { acknowledged: true };
  };

  ModelInstance.countDocuments = async function (query) {
    if (!supabase) return 0;
    let q = supabase.from(tableName).select('*', { count: 'exact', head: true });
    q = parseFilter(q, query);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  };

  ModelInstance.distinct = async function (field, query) {
    if (!supabase) return [];
    let q = supabase.from(tableName).select(field);
    q = parseFilter(q, query);
    const { data, error } = await q;
    if (error) throw error;
    return [...new Set((data || []).map(item => item[field]))];
  };

  ModelInstance.aggregate = async function (pipeline) {
    if (!supabase) return [];
    let q = supabase.from(tableName).select('*');
    const matchStage = pipeline.find(p => p.$match);
    if (matchStage) {
      q = parseFilter(q, matchStage.$match);
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

    return (data || []).map(convertIncoming);
  };

  return ModelInstance;
}
