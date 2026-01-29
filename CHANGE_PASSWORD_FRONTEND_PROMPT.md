# Change Password Feature - Frontend Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing the **Change Password** feature in the Admin Dashboard. This feature allows both **Admin** and **Staff** accounts to securely change their passwords with full session invalidation and email notifications.

---

## 🎯 Feature Requirements

### Core Functionality
- ✅ Admin can change their own password
- ✅ Staff can change their own password
- ✅ Requires current password verification for security
- ✅ Strong password validation (client + server side)
- ✅ All sessions invalidated after password change (forced re-login)
- ✅ Email notification sent to account owner
- ✅ Clear error messages for validation failures

### Security Features
- 🔒 Current password must be verified before change
- 🔒 New password must meet complexity requirements
- 🔒 Cannot reuse current password
- 🔒 All refresh tokens invalidated (logout everywhere)
- 🔒 Works with dual cookie system (httpOnly cookies + Authorization header)

---

## 📡 API Endpoints

### 1. Admin Change Password

**Endpoint:** `POST /api/v1/auth/admin/change-password`

**Authentication:** Required (Admin token)

**Request Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <adminToken>"  // For Safari/iOS compatibility
}
```

**Request Body:**
```json
{
  "currentPassword": "OldAdminPass123!",
  "newPassword": "NewAdminPass123!"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Password changed successfully. All sessions have been logged out for security. Please login again.",
  "data": {
    "logoutRequired": true,
    "email": "admin@bambite.com"
  }
}
```

**Error Responses:**

**401 Unauthorized - Invalid current password:**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Current password is incorrect"
}
```

**400 Bad Request - Same password:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "New password must be different from current password"
}
```

**400 Bad Request - Weak password:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
}
```

---

### 2. Staff Change Password

**Endpoint:** `POST /api/v1/staff-accounts/change-password`

**Authentication:** Required (Staff token) OR Optional (for first login with email)

**Request Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <staffAccountToken>"  // For Safari/iOS compatibility
}
```

**Request Body (Authenticated):**
```json
{
  "currentPassword": "OldStaffPass123!",
  "newPassword": "NewStaffPass123!"
}
```

**Request Body (First Login - No Auth):**
```json
{
  "email": "staff@bambite.com",
  "currentPassword": "TempPass123!",
  "newPassword": "NewStaffPass123!"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

**Error Responses:** (Same as admin endpoint)

---

## 🎨 Frontend Implementation

### 1. Change Password Page/Modal Structure

#### Recommended UI Components:

```
┌─────────────────────────────────────┐
│  Change Password                    │
├─────────────────────────────────────┤
│                                     │
│  Current Password                   │
│  ┌───────────────────────────────┐ │
│  │ ••••••••••••••              👁️ │ │
│  └───────────────────────────────┘ │
│                                     │
│  New Password                       │
│  ┌───────────────────────────────┐ │
│  │ ••••••••••••••              👁️ │ │
│  └───────────────────────────────┘ │
│  ✅ At least 8 characters           │
│  ✅ One uppercase letter            │
│  ✅ One lowercase letter            │
│  ✅ One number                      │
│  ✅ One special character           │
│                                     │
│  Confirm New Password               │
│  ┌───────────────────────────────┐ │
│  │ ••••••••••••••              👁️ │ │
│  └───────────────────────────────┘ │
│  ✅ Passwords match                 │
│                                     │
│  ┌─────────────┐  ┌──────────────┐│
│  │   Cancel    │  │ Change Pwd   ││
│  └─────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

### 2. Password Strength Validation (Client-Side)

Validate **BEFORE** submitting to backend to improve UX:

```javascript
// Password validation rules
const passwordRequirements = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[@$!%*?&]/,
};

function validatePassword(password) {
  return {
    minLength: password.length >= passwordRequirements.minLength,
    hasUppercase: passwordRequirements.hasUppercase.test(password),
    hasLowercase: passwordRequirements.hasLowercase.test(password),
    hasNumber: passwordRequirements.hasNumber.test(password),
    hasSpecialChar: passwordRequirements.hasSpecialChar.test(password),
  };
}

function isPasswordValid(password) {
  const validation = validatePassword(password);
  return Object.values(validation).every(Boolean);
}
```

### 3. React/TypeScript Implementation Example

```typescript
import { useState } from 'react';

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time password strength validation
  const passwordStrength: PasswordStrength = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecialChar: /[@$!%*?&]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`, // For Safari/iOS
        },
        credentials: 'include', // For httpOnly cookies (Chrome/Firefox)
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // ✅ SUCCESS: Password changed
        // Show success message
        alert('✅ Password changed successfully! You will be logged out for security. Please login again.');
        
        // Force logout (clear all tokens and redirect to login)
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = '/admin/login';
      } else {
        // ❌ ERROR: Show error message from backend
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Change password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h1>Change Password</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Current Password */}
        <div className="form-group">
          <label>Current Password *</label>
          <div className="password-input">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="form-group">
          <label>New Password *</label>
          <div className="password-input">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>
          
          {/* Password Requirements */}
          {newPassword && (
            <div className="password-requirements">
              <div className={passwordStrength.minLength ? 'valid' : 'invalid'}>
                {passwordStrength.minLength ? '✅' : '❌'} At least 8 characters
              </div>
              <div className={passwordStrength.hasUppercase ? 'valid' : 'invalid'}>
                {passwordStrength.hasUppercase ? '✅' : '❌'} One uppercase letter
              </div>
              <div className={passwordStrength.hasLowercase ? 'valid' : 'invalid'}>
                {passwordStrength.hasLowercase ? '✅' : '❌'} One lowercase letter
              </div>
              <div className={passwordStrength.hasNumber ? 'valid' : 'invalid'}>
                {passwordStrength.hasNumber ? '✅' : '❌'} One number
              </div>
              <div className={passwordStrength.hasSpecialChar ? 'valid' : 'invalid'}>
                {passwordStrength.hasSpecialChar ? '✅' : '❌'} One special character (@$!%*?&)
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label>Confirm New Password *</label>
          <div className="password-input">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
          
          {confirmPassword && (
            <div className={passwordsMatch ? 'valid' : 'invalid'}>
              {passwordsMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="security-notice" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <p><strong>🔒 Security Notice:</strong></p>
        <ul>
          <li>After changing your password, you will be logged out from all devices</li>
          <li>You will receive an email notification about this password change</li>
          <li>If you didn't request this change, contact support immediately</li>
        </ul>
      </div>
    </div>
  );
}
```

### 4. For Staff Change Password

Use the **same component** but change the API endpoint:

```typescript
// For staff, use this endpoint instead:
const endpoint = isStaff 
  ? '/api/v1/staff-accounts/change-password'
  : '/api/v1/auth/admin/change-password';

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('staffAccountToken')}`,
  },
  credentials: 'include',
  body: JSON.stringify({ currentPassword, newPassword }),
});
```

---

## 🎨 UI/UX Best Practices

### 1. Navigation Integration

**Admin Dashboard:**
```
Settings → Change Password
Profile → Security → Change Password
User Menu → Change Password
```

**Staff Portal:**
```
My Account → Change Password
Settings → Change Password
```

### 2. Visual Feedback

#### Password Strength Indicator
```
Weak:      🔴 ▱▱▱▱ (0-25%)
Fair:      🟠 🟠▱▱ (26-50%)
Good:      🟡 🟡 🟡▱ (51-75%)
Strong:    🟢 🟢 🟢 🟢 (76-100%)
```

#### Real-time Validation
- ✅ Green checkmark: Requirement met
- ❌ Red X: Requirement not met
- Show requirements as user types in "New Password" field

### 3. Success Modal/Toast

After successful password change:

```
┌─────────────────────────────────────┐
│  ✅ Password Changed Successfully   │
├─────────────────────────────────────┤
│                                     │
│  Your password has been changed.    │
│                                     │
│  For security, you have been logged │
│  out from all devices.              │
│                                     │
│  Please login again with your new   │
│  password.                          │
│                                     │
│         [Login Now]                 │
│                                     │
└─────────────────────────────────────┘
```

**Auto-redirect to login page after 3 seconds**

---

## ⚠️ Error Handling

### Common Error Scenarios

| Error | Cause | User Message | Action |
|-------|-------|--------------|--------|
| 401 Unauthorized | Current password incorrect | "Current password is incorrect. Please try again." | Allow retry |
| 400 Bad Request | Same password | "New password must be different from current password." | Clear new password field |
| 400 Bad Request | Weak password | "Password does not meet requirements. Please check the requirements below." | Show requirements |
| 400 Bad Request | Passwords don't match | "Passwords do not match. Please try again." | Clear confirm field |
| 401 Unauthorized | Token expired | "Your session has expired. Please login again." | Redirect to login |
| 500 Server Error | Server error | "Something went wrong. Please try again later." | Show retry button |

### Error Display Component

```typescript
{error && (
  <div className="error-alert" role="alert">
    <span className="error-icon">⚠️</span>
    <span className="error-message">{error}</span>
    <button onClick={() => setError('')} className="error-close">×</button>
  </div>
)}
```

---

## 🔐 Security Considerations

### 1. Client-Side Validation
- ✅ Validate password strength before submission
- ✅ Ensure passwords match before submission
- ✅ Show real-time feedback to user
- ⚠️ **Note:** Client validation is for UX only. Backend still validates everything.

### 2. Password Display Toggle
- ✅ Provide "Show/Hide" toggle for each password field
- ✅ Use eye icon (👁️) for show, closed eye (🙈) for hide
- ✅ Each field has its own toggle (current, new, confirm)

### 3. Session Management After Password Change
- ✅ **CRITICAL:** After successful password change, immediately:
  1. Clear all tokens from localStorage
  2. Clear all tokens from sessionStorage
  3. Redirect to login page
  4. Do NOT allow user to continue using the app

```javascript
// ✅ CORRECT: Complete logout after password change
localStorage.clear();
sessionStorage.clear();
// Clear any app-specific state/cache if needed
window.location.href = '/admin/login'; // Hard redirect (clears everything)

// ❌ WRONG: Don't do this
// Just showing a message without logout
```

### 4. CSRF Protection
- ✅ Use `credentials: 'include'` for httpOnly cookies
- ✅ Include Authorization header for Safari/iOS compatibility
- ✅ Backend handles CSRF token validation

### 5. Rate Limiting
- Backend rate limits: 5 attempts per hour per account
- Show friendly message if rate limit exceeded:
  ```
  "Too many password change attempts. Please try again in 1 hour."
  ```

---

## 🧪 Testing Checklist

### Functional Tests

- [ ] **Valid Password Change**
  - [ ] Enter correct current password
  - [ ] Enter strong new password
  - [ ] Confirm new password matches
  - [ ] Submit form
  - [ ] Verify success message displayed
  - [ ] Verify redirected to login page
  - [ ] Verify can login with new password
  - [ ] Verify old password no longer works

- [ ] **Invalid Current Password**
  - [ ] Enter incorrect current password
  - [ ] Verify error message: "Current password is incorrect"
  - [ ] Verify form allows retry

- [ ] **Weak New Password**
  - [ ] Enter password with < 8 characters
  - [ ] Verify error shown
  - [ ] Enter password without uppercase
  - [ ] Verify error shown
  - [ ] Verify requirements shown in red

- [ ] **Password Reuse**
  - [ ] Enter current password as new password
  - [ ] Verify error: "New password must be different from current password"

- [ ] **Passwords Don't Match**
  - [ ] Enter different values in new password and confirm password
  - [ ] Verify error shown
  - [ ] Verify submit button disabled

- [ ] **Session Invalidation**
  - [ ] Login on Device A and Device B
  - [ ] Change password on Device A
  - [ ] Verify Device B is logged out (token invalidated)
  - [ ] Verify must login again on both devices

### UI/UX Tests

- [ ] **Password Visibility Toggle**
  - [ ] Click eye icon on current password
  - [ ] Verify password shown
  - [ ] Click again, verify password hidden
  - [ ] Repeat for new password and confirm password

- [ ] **Real-time Validation**
  - [ ] Type in new password field
  - [ ] Verify requirements update in real-time
  - [ ] Verify checkmarks/X marks appear

- [ ] **Responsive Design**
  - [ ] Test on mobile (iOS Safari, Android Chrome)
  - [ ] Test on tablet
  - [ ] Test on desktop
  - [ ] Verify form is usable on all screen sizes

- [ ] **Loading State**
  - [ ] Click submit button
  - [ ] Verify button shows "Changing Password..."
  - [ ] Verify button is disabled during request
  - [ ] Verify cannot submit multiple times

### Security Tests

- [ ] **Dual Cookie System**
  - [ ] Test on Chrome (httpOnly cookies)
  - [ ] Test on Safari (Authorization header)
  - [ ] Test on iOS Safari
  - [ ] Verify works on all browsers

- [ ] **Token Cleanup**
  - [ ] After password change, open browser DevTools
  - [ ] Check localStorage - should be empty
  - [ ] Check sessionStorage - should be empty
  - [ ] Check cookies - should be cleared

- [ ] **Email Notification**
  - [ ] Change password
  - [ ] Check email inbox
  - [ ] Verify received "Password Changed Successfully" email
  - [ ] Verify email contains timestamp
  - [ ] Verify email contains security warning

---

## 📱 Mobile Considerations

### iOS Safari Specific
- ✅ Uses Authorization header (dual cookie system handles this)
- ✅ Test form autofill behavior
- ✅ Ensure keyboard doesn't hide submit button
- ✅ Test password managers (1Password, iCloud Keychain)

### Android Chrome Specific
- ✅ Test biometric password autofill
- ✅ Test Google Password Manager integration

---

## 🎨 Recommended CSS Styling

```css
/* Password Input with Toggle */
.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  padding-right: 40px; /* Space for eye icon */
}

.password-input button {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

/* Password Requirements */
.password-requirements {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.password-requirements .valid {
  color: #28a745; /* Green */
}

.password-requirements .invalid {
  color: #dc3545; /* Red */
}

/* Error Message */
.error-alert {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

/* Security Notice */
.security-notice {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 2rem;
}

.security-notice ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}

.security-notice li {
  margin-bottom: 0.5rem;
}
```

---

## 🔄 Integration with Existing Auth System

### Dual Cookie System Compatibility

This implementation works with your existing two-cookie authentication system:

1. **Chrome/Firefox/Edge:** Uses httpOnly cookies automatically
   ```javascript
   credentials: 'include' // Sends cookies with request
   ```

2. **Safari/iOS:** Uses Authorization header as fallback
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

### Token Storage Locations

**Admin:**
- Cookie: `accessToken` (httpOnly, 15 min)
- Cookie: `refreshToken` (httpOnly, 7 days)
- LocalStorage: `adminToken` (for Safari/iOS fallback)

**Staff:**
- Cookie: `accessToken` (httpOnly, 15 min)
- Cookie: `refreshToken` (httpOnly, 7 days)
- LocalStorage: `staffAccountToken` (for Safari/iOS fallback)

### After Password Change
- ✅ All cookies are cleared by backend (tokens revoked)
- ✅ Frontend must clear localStorage/sessionStorage
- ✅ Frontend must redirect to login page

---

## 📊 Success Metrics

Track these metrics for the feature:

- **Usage:** Number of password changes per month
- **Errors:** Failed attempts (wrong current password)
- **Security:** Time between password changes
- **UX:** Form completion rate (started vs completed)

---

## 🚀 Deployment Checklist

- [ ] Component implemented for Admin Dashboard
- [ ] Component implemented for Staff Portal
- [ ] Client-side validation working
- [ ] Server-side validation working
- [ ] Error handling implemented
- [ ] Success message/modal implemented
- [ ] Forced logout after change working
- [ ] Email notifications working
- [ ] Tested on Chrome (cookies)
- [ ] Tested on Safari (Authorization header)
- [ ] Tested on mobile (iOS + Android)
- [ ] Password strength indicator working
- [ ] Show/hide password toggles working
- [ ] Responsive design verified
- [ ] Accessibility verified (keyboard navigation, screen readers)

---

## 📚 Additional Resources

### Password Requirements Summary
```
✅ Minimum 8 characters
✅ At least one uppercase letter (A-Z)
✅ At least one lowercase letter (a-z)
✅ At least one number (0-9)
✅ At least one special character (@$!%*?&)
❌ Cannot reuse current password
```

### Regex Pattern for Client Validation
```javascript
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

### Example Strong Passwords
```
MyP@ssw0rd123
Secur3!Pass
Admin#2024
StaffP@ss1
```

---

## ❓ FAQ for Frontend Developers

**Q: Do I need to handle token invalidation manually?**  
A: No, the backend automatically revokes all refresh tokens. You just need to clear localStorage/sessionStorage and redirect to login.

**Q: What if the user closes the browser before being redirected?**  
A: That's fine. Their tokens are already invalidated on the backend. Next time they try to access a protected route, they'll get 401 and be redirected to login.

**Q: Should I show the password requirements initially or only after user starts typing?**  
A: Show them after user focuses on the "New Password" field or starts typing. This keeps the UI clean.

**Q: Can I use this same component for "First Login" password change (staff)?**  
A: Yes! For first login, hide the "Current Password" field and use the email-based endpoint instead.

**Q: What if email sending fails?**  
A: Password change will still succeed. Email failure doesn't block the password change (it's non-blocking on backend).

---

## 🎯 Summary

- ✅ Implement change password form with real-time validation
- ✅ Use dual cookie system (cookies + Authorization header)
- ✅ Force logout after successful password change
- ✅ Show clear error messages for all validation failures
- ✅ Display password requirements with visual feedback
- ✅ Test on all browsers (Chrome, Safari, Firefox, Edge)
- ✅ Test on mobile devices (iOS Safari, Android Chrome)
- ✅ Implement responsive design for all screen sizes

**Backend is ready. Frontend implementation is all that's needed!** 🚀
