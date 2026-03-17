import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('visuaize_token');
        if (token) {
            const controller = new AbortController();
            fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            })
                .then(res => res.json())
                .then(data => {
                    if (data.username) {
                        setUser({ username: data.username, token });
                    } else {
                        sessionStorage.removeItem('visuaize_token');
                    }
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        sessionStorage.removeItem('visuaize_token');
                    }
                })
                .finally(() => setLoading(false));

            return () => controller.abort();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem('visuaize_token', data.token);
            setUser({ username: data.username, token: data.token });
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const signup = async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Reset preferences for new users: Beginner mode + show onboarding tour
            localStorage.removeItem('visuaize_mode');
            localStorage.removeItem('visuaize_tourCompleted');
            // Automatically log in after successful signup
            return login(username, password);
        }
        return { success: false, error: data.error };
    };

    const logout = () => {
        sessionStorage.removeItem('visuaize_token');
        setUser(null);
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
