import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();
const TOKEN_KEY = 'visuaize_token';
const DEMO_USER_KEY = 'visuaize_demo_user';

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const startDemoSession = (username) => {
        const demoToken = `demo_token_${Date.now()}`;
        sessionStorage.setItem(TOKEN_KEY, demoToken);
        sessionStorage.setItem(DEMO_USER_KEY, username);
        setUser({ username, token: demoToken });
        return { success: true };
    };

    const clearSession = () => {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(DEMO_USER_KEY);
        setUser(null);
    };

    useEffect(() => {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const demoUsername = sessionStorage.getItem(DEMO_USER_KEY);

        if (token && demoUsername && token.startsWith('demo_token_')) {
            setUser({ username: demoUsername, token });
            setLoading(false);
            return;
        }

        if (token) {
            const controller = new AbortController();
            fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            })
                .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    return { ok: res.ok, data };
                })
                .then(data => {
                    if (data.ok && data.data.username) {
                        setUser({ username: data.data.username, token });
                    } else {
                        clearSession();
                    }
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        if (demoUsername) {
                            setUser({ username: demoUsername, token });
                        } else {
                            clearSession();
                        }
                    }
                })
                .finally(() => setLoading(false));

            return () => controller.abort();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && data.token) {
                sessionStorage.setItem(TOKEN_KEY, data.token);
                sessionStorage.removeItem(DEMO_USER_KEY);
                setUser({ username: data.username, token: data.token });
                return { success: true };
            }

            if (response.status === 404 || response.status >= 500) {
                return startDemoSession(username);
            }

            return { success: false, error: data.error || 'Login failed' };
        } catch {
            return startDemoSession(username);
        }
    };

    const signup = async (username, password) => {
        localStorage.removeItem('visuaize_mode');
        localStorage.removeItem('visuaize_tourCompleted');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                return login(username, password);
            }

            if (response.status === 404 || response.status >= 500) {
                return startDemoSession(username);
            }

            return { success: false, error: data.error || 'Signup failed' };
        } catch {
            return startDemoSession(username);
        }
    };

    const logout = () => {
        clearSession();
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
