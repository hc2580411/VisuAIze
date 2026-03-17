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

    const parseResponsePayload = async (response) => {
        const raw = await response.text().catch(() => '');
        if (!raw) return { data: {}, raw: '' };
        try {
            return { data: JSON.parse(raw), raw };
        } catch {
            return { data: {}, raw };
        }
    };

    const buildDetailedAuthError = (action, response, payload) => {
        const fromPayload = payload?.data?.error || payload?.data?.message;
        const fromRaw = payload?.raw && payload.raw.trim() ? payload.raw.trim() : '';
        const detail = fromPayload || fromRaw || 'No error details returned by server';
        const statusText = response.statusText || 'HTTP Error';
        return `${action} failed (${response.status} ${statusText}): ${detail}`;
    };

    const shouldFallbackToDemoSession = (response, payload) => {
        const infraStatusCodes = [404, 405, 500, 501, 502, 503, 504];
        if (infraStatusCodes.includes(response.status)) return true;
        const raw = (payload?.raw || '').toLowerCase();
        if (raw.includes('<!doctype html') || raw.includes('<html')) return true;
        return false;
    };

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

            const payload = await parseResponsePayload(response);
            const data = payload.data || {};
            if (response.ok && data.token) {
                sessionStorage.setItem(TOKEN_KEY, data.token);
                sessionStorage.removeItem(DEMO_USER_KEY);
                setUser({ username: data.username, token: data.token });
                return { success: true };
            }

            if (shouldFallbackToDemoSession(response, payload)) {
                return startDemoSession(username);
            }

            return { success: false, error: buildDetailedAuthError('Login', response, payload) };
        } catch (error) {
            return { success: false, error: `Login failed (network): ${error?.message || 'Unknown network error'}` };
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

            const payload = await parseResponsePayload(response);
            if (response.ok) {
                return login(username, password);
            }

            if (shouldFallbackToDemoSession(response, payload)) {
                return startDemoSession(username);
            }

            return { success: false, error: buildDetailedAuthError('Signup', response, payload) };
        } catch (error) {
            return { success: false, error: `Signup failed (network): ${error?.message || 'Unknown network error'}` };
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
