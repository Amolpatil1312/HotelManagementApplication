import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Two modes:
  // 1. Admin logged in → adding staff to their restaurant
  // 2. No user logged in → new restaurant registration (always ADMIN)
  const isAdminCreating = user?.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isAdminCreating && !restaurantName.trim()) {
      setError('Restaurant name is required');
      return;
    }

    setSubmitting(true);
    try {
      await register(
        username,
        password,
        displayName,
        isAdminCreating ? role : 'ADMIN',
        undefined,
        isAdminCreating ? undefined : restaurantName.trim()
      );
      if (isAdminCreating) {
        navigate('/admin');
      } else {
        // New restaurant admin — auto-login happened, go to setup
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const title = isAdminCreating ? 'Add Staff Member' : 'Register Your Restaurant';
  const subtitle = isAdminCreating
    ? 'Create a new team member account'
    : 'Create an admin account for your restaurant';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🍽️</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {!isAdminCreating && (
            <div className="auth-field">
              <label>Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Biryani House"
                required
                style={{ fontSize: '16px' }}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Smith"
              required
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              required
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              autoComplete="new-password"
              required
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              style={{ fontSize: '16px' }}
            />
          </div>

          {isAdminCreating && (
            <div className="auth-field">
              <label>Role</label>
              <div className="auth-role-selector">
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'STAFF' ? 'active' : ''}`}
                  onClick={() => setRole('STAFF')}
                >
                  Staff
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setRole('ADMIN')}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting || !username || !password || !confirmPassword || !displayName || (!isAdminCreating && !restaurantName.trim())}
          >
            {submitting
              ? 'Creating account...'
              : isAdminCreating
                ? 'Create Account'
                : 'Register Restaurant'}
          </button>
        </form>

        <div className="auth-footer">
          {isAdminCreating ? (
            <Link to="/admin">Back to Admin</Link>
          ) : (
            <>Already have an account? <Link to="/login">Sign In</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
