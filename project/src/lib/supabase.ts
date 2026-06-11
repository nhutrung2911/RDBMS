import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are valid Supabase credentials
const isValidSupabaseConfig = 
  supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient: any;

if (isValidSupabaseConfig) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn("Failed to initialize Supabase client. Falling back to local storage auth.", error);
    supabaseClient = createMockSupabase();
  }
} else {
  console.warn("Supabase credentials not found or invalid. Falling back to local storage auth.");
  supabaseClient = createMockSupabase();
}

export const supabase = supabaseClient;

function createMockSupabase() {
  const LISTENERS = new Set<(event: string, session: any) => void>();
  
  const getMockUsers = () => {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
    } catch {
      users = [];
    }
    
    const defaultAccounts = [
      {
        id: 'user-nhutrung-admin',
        email: 'nguyennhutrung788@gmail.com',
        password: '29112006',
        fullName: 'Như Trung (Admin)',
        user_metadata: {
          full_name: 'Như Trung (Admin)',
          role: 'admin'
        }
      },
      {
        id: 'user-customer',
        email: 'customer@gmail.com',
        password: 'password123',
        fullName: 'Nguyễn Khách Hàng',
        user_metadata: {
          full_name: 'Nguyễn Khách Hàng',
          role: 'customer'
        }
      },
      {
        id: 'user-staff',
        email: 'staff@gmail.com',
        password: 'password123',
        fullName: 'Trần Nhân Viên',
        user_metadata: {
          full_name: 'Trần Nhân Viên',
          role: 'staff'
        }
      },
      {
        id: 'user-admin',
        email: 'admin@gmail.com',
        password: 'password123',
        fullName: 'Lê Quản Trị',
        user_metadata: {
          full_name: 'Lê Quản Trị',
          role: 'admin'
        }
      }
    ];

    let modified = false;
    defaultAccounts.forEach(acc => {
      const idx = users.findIndex((u: any) => u.email === acc.email);
      if (idx === -1) {
        users.push(acc);
        modified = true;
      } else {
        const u = users[idx];
        if (u.password !== acc.password || JSON.stringify(u.user_metadata) !== JSON.stringify(acc.user_metadata)) {
          users[idx] = {
            ...u,
            password: acc.password,
            fullName: acc.fullName,
            user_metadata: acc.user_metadata
          };
          modified = true;
        }
      }
    });

    if (modified || !localStorage.getItem('mock_supabase_users')) {
      localStorage.setItem('mock_supabase_users', JSON.stringify(users));
    }
    return users;
  };

  // Helper to get active session
  const getSessionData = () => {
    try {
      const activeUser = localStorage.getItem('mock_supabase_session');
      if (!activeUser) return null;
      const user = JSON.parse(activeUser);
      return {
        session: {
          user: {
            id: user.id || 'mock-id',
            email: user.email,
            user_metadata: user.user_metadata || {}
          }
        }
      };
    } catch {
      return null;
    }
  };

  const notify = (event: string) => {
    const sessionData = getSessionData();
    const session = sessionData ? sessionData.session : null;
    LISTENERS.forEach(cb => cb(event, session));
  };

  // Synchronize/seed default accounts immediately on startup
  getMockUsers();

  return {
    auth: {
      getSession: async () => {
        return { data: getSessionData(), error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        LISTENERS.add(callback);
        // Call immediately with initial session
        const sessionData = getSessionData();
        callback('INITIAL_SESSION', sessionData ? sessionData.session : null);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                LISTENERS.delete(callback);
              }
            }
          }
        };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const users = getMockUsers();
        const user = users.find((u: any) => u.email === email);
        if (!user || user.password !== password) {
          return { data: { user: null }, error: { message: "Invalid login credentials" } };
        }
        
        const sessionUser = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || { full_name: user.fullName || 'Khách hàng', role: 'customer' }
        };
        
        localStorage.setItem('mock_supabase_session', JSON.stringify(sessionUser));
        notify('SIGNED_IN');
        return { data: { user: sessionUser }, error: null };
      },
      signUp: async ({ email, password, options }: any) => {
        const users = getMockUsers();
        if (users.some((u: any) => u.email === email)) {
          return { data: { user: null }, error: { message: "Email này đã được đăng ký" } };
        }
        
        const fullName = options?.data?.full_name || 'Khách hàng';
        const role = options?.data?.role || 'customer';
        const phone = options?.data?.phone || '';
        const newUser = {
          id: Math.random().toString(36).substring(2, 15),
          email,
          password,
          fullName,
          phone,
          user_metadata: {
            full_name: fullName,
            role: role,
            phone: phone
          }
        };
        
        users.push(newUser);
        localStorage.setItem('mock_supabase_users', JSON.stringify(users));
        
        // Log in immediately
        const sessionUser = {
          id: newUser.id,
          email: newUser.email,
          user_metadata: newUser.user_metadata
        };
        localStorage.setItem('mock_supabase_session', JSON.stringify(sessionUser));
        notify('SIGNED_IN');
        
        return { data: { user: sessionUser }, error: null };
      },
      updateUser: async ({ password, data }: any) => {
        const sessionData = getSessionData();
        if (!sessionData || !sessionData.session) {
          return { error: { message: "Not logged in" } };
        }
        
        const currentUser = sessionData.session.user;
        if (data) {
          currentUser.user_metadata = {
            ...currentUser.user_metadata,
            full_name: data.full_name || currentUser.user_metadata.full_name,
            phone: data.phone || currentUser.user_metadata.phone
          };
        }
        
        // Save in session
        localStorage.setItem('mock_supabase_session', JSON.stringify(currentUser));
        
        // Save in mock users DB
        const users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
        const updatedUsers = users.map((u: any) => {
          if (u.email === currentUser.email) {
            return {
              ...u,
              password: password || u.password,
              fullName: data?.full_name || u.fullName,
              user_metadata: currentUser.user_metadata
            };
          }
          return u;
        });
        localStorage.setItem('mock_supabase_users', JSON.stringify(updatedUsers));
        
        notify('USER_UPDATED');
        return { data: { user: currentUser }, error: null };
      },
      resetPasswordForEmail: async (email: string) => {
        const users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
        const user = users.find((u: any) => u.email === email);
        if (!user) {
          return { error: { message: "Email không tồn tại trong hệ thống." } };
        }
        
        // Log user in automatically in mock session to simulate authenticating via reset link
        const sessionUser = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || { full_name: user.fullName || 'Khách hàng' }
        };
        localStorage.setItem('mock_supabase_session', JSON.stringify(sessionUser));
        
        // Notify listeners with PASSWORD_RECOVERY event
        notify('PASSWORD_RECOVERY');
        
        return { data: {}, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('mock_supabase_session');
        notify('SIGNED_OUT');
        return { error: null };
      }
    }
  };
}

