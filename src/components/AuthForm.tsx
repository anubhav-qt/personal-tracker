import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styled from 'styled-components';

interface AuthFormProps {
  setSession: (session: any) => void;
}

// Use localStorage to check if dark mode is enabled, to match the rest of the app
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedTheme = localStorage.getItem('preferredTheme');
    if (typeof storedTheme === 'string') {
      return storedTheme;
    }
  }
  // Default to dark theme which works well with the login animation
  return 'dark';
};

export function AuthForm({ setSession }: AuthFormProps) {
  const [authError, setAuthError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    // Update theme if it changes in localStorage
    const handleStorageChange = () => {
      setTheme(getInitialTheme());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.session) {
        setSession(data.session);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setAuthError('Check your email for the confirmation link.');
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setAuthError('');
  };

  return (
    <StyledWrapper
      className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[rgb(23_23_23/1)]' : 'bg-zinc-50'}`}
      $isDark={theme === 'dark'}
    >
      <div className="login-box">
        <div className="app-title">
          <h2>Personal Tracker</h2>
          <p>Manage your finances, fitness, and academics all in one place</p>
        </div>

        <p>{isLogin ? 'Login' : 'Sign Up'}</p>
        {authError && (
          <div className="error-message">
            {authError}
          </div>
        )}
        
        <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
          <div className="user-box">
            <input 
              required 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email</label>
          </div>
          <div className="user-box">
            <input 
              required 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {isLoading 
              ? (isLogin ? 'Signing in...' : 'Creating Account...') 
              : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <p>
          {isLogin 
            ? "Don't have an account? " 
            : "Already have an account? "}
          <a href="#" className="a2" onClick={(e) => {
            e.preventDefault();
            toggleForm();
          }}>
            {isLogin ? 'Sign up!' : 'Login'}
          </a>
        </p>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $isDark: boolean }>`
  .login-box {
    position: relative;
    width: 400px;
    padding: 40px;
    margin: 20px auto;
    background: ${props => props.$isDark 
      ? 'rgba(38, 36, 46, 0.9)' // dark theme box bg
      : 'rgba(255, 255, 255, 0.9)' // light theme box bg
    };
    box-sizing: border-box;
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    backdrop-filter: blur(10px);
  }

  .app-title {
    margin-bottom: 30px;
    text-align: center;
  }

  .app-title h2 {
    color: ${props => props.$isDark ? '#fff' : '#333'};
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .app-title p {
    color: ${props => props.$isDark ? '#aaa' : '#666'};
    font-size: 0.9rem;
  }

  .login-box p:first-of-type:not(.app-title p) {
    margin: 0 0 30px;
    padding: 0;
    color: ${props => props.$isDark ? '#fff' : '#333'};
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .error-message {
    background: ${props => props.$isDark 
      ? 'rgba(220, 38, 38, 0.2)' // dark red bg
      : 'rgba(254, 226, 226, 1)' // light red bg
    };
    color: ${props => props.$isDark ? '#f87171' : '#dc2626'};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    text-align: center;
  }

  .login-box .user-box {
    position: relative;
  }

  .login-box .user-box input {
    width: 100%;
    padding: 10px 0;
    font-size: 16px;
    color: ${props => props.$isDark ? '#fff' : '#333'};
    margin-bottom: 30px;
    border: none;
    border-bottom: 1px solid ${props => props.$isDark ? '#fff' : '#333'};
    outline: none;
    background: transparent;
  }

  .login-box .user-box input:focus {
    outline: none;
  }

  .login-box .user-box label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px 0;
    font-size: 16px;
    color: ${props => props.$isDark ? '#fff' : '#666'};
    pointer-events: none;
    transition: .5s;
  }

  .login-box .user-box input:focus ~ label,
  .login-box .user-box input:valid ~ label {
    top: -20px;
    left: 0;
    color: ${props => props.$isDark ? '#8983f7' : '#6366f1'};
    font-size: 12px;
  }

  .login-box form .submit-btn {
    position: relative;
    display: inline-block;
    padding: 10px 20px;
    font-weight: bold;
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${props => props.$isDark ? '#fff' : '#333'};
    font-size: 16px;
    text-decoration: none;
    text-transform: uppercase;
    overflow: hidden;
    transition: .5s;
    margin-top: 40px;
    letter-spacing: 3px;
    width: 100%;
    text-align: center;
  }

  .login-box .submit-btn:hover {
    background: ${props => props.$isDark 
      ? 'linear-gradient(90deg, #8983f7, #a3dafb)' 
      : 'linear-gradient(90deg, #6366f1, #60a5fa)'
    };
    color: #fff;
    border-radius: 5px;
  }

  .login-box .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .login-box .submit-btn span {
    position: absolute;
    display: block;
  }

  .login-box .submit-btn span:nth-child(1) {
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${props => props.$isDark ? '#8983f7' : '#6366f1'});
    animation: btn-anim1 1.5s linear infinite;
  }

  @keyframes btn-anim1 {
    0% {
      left: -100%;
    }

    50%,100% {
      left: 100%;
    }
  }

  .login-box .submit-btn span:nth-child(2) {
    top: -100%;
    right: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, transparent, ${props => props.$isDark ? '#a3dafb' : '#60a5fa'});
    animation: btn-anim2 1.5s linear infinite;
    animation-delay: .375s
  }

  @keyframes btn-anim2 {
    0% {
      top: -100%;
    }

    50%,100% {
      top: 100%;
    }
  }

  .login-box .submit-btn span:nth-child(3) {
    bottom: 0;
    right: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(270deg, transparent, ${props => props.$isDark ? '#8983f7' : '#6366f1'});
    animation: btn-anim3 1.5s linear infinite;
    animation-delay: .75s
  }

  @keyframes btn-anim3 {
    0% {
      right: -100%;
    }

    50%,100% {
      right: 100%;
    }
  }

  .login-box .submit-btn span:nth-child(4) {
    bottom: -100%;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(360deg, transparent, ${props => props.$isDark ? '#a3dafb' : '#60a5fa'});
    animation: btn-anim4 1.5s linear infinite;
    animation-delay: 1.125s
  }

  @keyframes btn-anim4 {
    0% {
      bottom: -100%;
    }

    50%,100% {
      bottom: 100%;
    }
  }

  .login-box p:last-of-type {
    color: ${props => props.$isDark ? '#aaa' : '#666'};
    font-size: 14px;
    text-align: center;
    margin-top: 30px;
  }

  .login-box a.a2 {
    color: ${props => props.$isDark ? '#8983f7' : '#6366f1'};
    text-decoration: none;
  }

  .login-box a.a2:hover {
    background: transparent;
    color: ${props => props.$isDark ? '#a3dafb' : '#60a5fa'};
    text-decoration: underline;
  }

  @media (max-width: 500px) {
    .login-box {
      width: 90%;
      padding: 30px;
    }
  }
`;
