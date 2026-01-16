
import { User, VocabTable } from '../types';

const KEYS = {
  USER: 'lexicon_user', // Current logged in session
  USERS_LIST: 'lexicon_users_list', // Registry of all local scholars
  TABLES: 'lexicon_tables',
  NOTES: 'lexicon_notes'
};

export const storageService = {
  getCurrentUser: async (): Promise<User | null> => {
    const user = localStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: async (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    
    // Also ensure they are in the registry
    const usersRaw = localStorage.getItem(KEYS.USERS_LIST);
    let users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    if (!users.find(u => u.username === user.username)) {
      users.push(user);
      localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
    }
  },

  findUserByName: async (username: string): Promise<User | null> => {
    const usersRaw = localStorage.getItem(KEYS.USERS_LIST);
    if (!usersRaw) return null;
    const users: User[] = JSON.parse(usersRaw);
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  getTables: async (userId: string): Promise<VocabTable[]> => {
    const tables = localStorage.getItem(KEYS.TABLES);
    if (!tables) return [];
    
    const allTables: VocabTable[] = JSON.parse(tables);
    return allTables.filter(t => t.userId === userId);
  },

  saveTable: async (table: VocabTable) => {
    const tablesRaw = localStorage.getItem(KEYS.TABLES);
    let tables: VocabTable[] = tablesRaw ? JSON.parse(tablesRaw) : [];
    
    const index = tables.findIndex(t => t.id === table.id);
    if (index > -1) {
      tables[index] = table;
    } else {
      tables.push(table);
    }
    
    localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
  },

  deleteTable: async (id: string) => {
    const tablesRaw = localStorage.getItem(KEYS.TABLES);
    if (!tablesRaw) return;
    
    let tables: VocabTable[] = JSON.parse(tablesRaw);
    tables = tables.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
  },

  getNotes: async (userId: string): Promise<string> => {
    return localStorage.getItem(`${KEYS.NOTES}_${userId}`) || '';
  },

  saveNotes: async (userId: string, notes: string) => {
    localStorage.setItem(`${KEYS.NOTES}_${userId}`, notes);
  },

  logout: async () => {
    localStorage.removeItem(KEYS.USER);
  }
};
