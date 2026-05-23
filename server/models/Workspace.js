import { createSupabaseModel } from '../utils/supabase.js';

const Workspace = createSupabaseModel('workspaces');

export default Workspace;
