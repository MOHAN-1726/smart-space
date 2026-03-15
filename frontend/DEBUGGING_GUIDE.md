# 🔍 Create Class Button - Debugging Checklist

## Quick Steps to Debug

### Step 1: Open Browser Console
1. Open your browser (Chrome/Firefox)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try creating a class and watch the logs

### Step 2: Check Console Logs

You should see logs like:
```
[APP] Checking for stored user...
[APP] User found: { email: "harry@hogwarts.edu", role: "STUDENT" }
[DIAGNOSTIC] Checking token status...
[DIAGNOSTIC] User email: harry@hogwarts.edu
[DIAGNOSTIC] Has token: true
```

**If you DON'T see these:** User is not logged in properly ❌

---

## When You Click "Create Class" Button

### Expected Console Output:

```
[DEBUG] Create class submitted
[DEBUG] Form data: { name: "Math Class", ... }
[DEBUG] Sending POST request to /classes...
[API] Request started: { endpoint: "/classes", method: "POST", hasToken: true }
[API] Response received: { endpoint: "/classes", status: 200 }
[API] Success: { endpoint: "/classes", status: 200, data: {...} }
[DEBUG] Class created successfully: {...}
[DEBUG] Classes list refreshed
```

---

## What Each Log Means

| Log | Meaning | If Missing = | Solution |
|-----|---------|--------------|----------|
| `[DEBUG] Create class submitted` | Button click detected | Button not connected | Check onClick handler |
| `[DEBUG] Form data:` | Form values captured | Form inputs not connected | Check onChange handlers |
| `[API] Request started` | API call starting | Service not called | Check api.post() call |
| `hasToken: true` | Auth header present | No token stored | User not logged in |
| `[API] Response received: status: 200` | Server accepted | Auth failed (401/403) | Check user role |
| `[DEBUG] Class created successfully` | Success response | Invalid response format | Check API response |

---

## Common Issues & Fixes

### Issue 1: Button Click Not Working
```
❌ NO [DEBUG] logs appearing
```

**Fix:**
- Check if `onClick={() => setShowCreateModal(true)}` exists
- Clear browser cache: Ctrl+Shift+Delete
- Restart frontend: `npm run dev`

---

### Issue 2: `hasToken: false` 
```
❌ [API] Request started: { ..., hasToken: false }
```

**Fix:**
1. Check if you're actually logged in
2. Go to **F12 → Application → Local Storage**
3. Look for `currentUser` key
4. Should contain a `token` field with JWT
5. If missing, login again

---

### Issue 3: `status: 401 (Unauthorized)`
```
❌ [API] Response received: { endpoint: "/classes", status: 401 }
```

**Cause:** Invalid or expired token

**Fix:**
```javascript
// In browser console, run:
JSON.parse(localStorage.getItem('currentUser'))
```

Should show a valid JWT token starting with "eyJ..."

---

### Issue 4: `status: 403 (Forbidden)`
```
❌ [API] Response received: { endpoint: "/classes", status: 403 }
```

**Cause:** User role is not STAFF (only STAFF can create classes)

**Fix:**
- Login as teacher: `mcgonagall@hogwarts.edu` (role: TEACHER)
- Or `dumbledore@hogwarts.edu` (role: ADMIN)
- Student account `harry@hogwarts.edu` cannot create classes

---

### Issue 5: `status: 400 (Bad Request)`
```
❌ Class name is empty
```

**Fix:**
- Fill in the class name - it's required
- Check form validation is working

---

## Network Tab Debugging

### Open Network Tab:
1. Press **F12**
2. Go to **Network** tab
3. Click "Create Class"
4. You should see a `POST` request to `/api/classes`

### What to Check:

| Column | Should be | If not = |
|--------|-----------|----------|
| Status | 200 ✅ | API error (see Body tab) |
| Method | POST ✅ | Wrong endpoint |
| URL | `/api/classes` ✅ | Proxy not working |
| Headers | Authorization: Bearer... | Token missing |
| Request Body | `{name, section...}` | Form data not sent |
| Response | `{success: true}` | Check Body tab |

---

## Step-by-Step Debug Process

### 1️⃣ Verify Login
```javascript
// In console, run:
JSON.parse(localStorage.getItem('currentUser'))
```
Should show:
- `email`: ✅
- `role`: ✅
- `token`: ✅ (starts with "eyJ")

### 2️⃣ Check Button HTML
```javascript
// In console, run:
document.querySelector('[class*="Create"]')?.onclick
```
Should NOT be null

### 3️⃣ Verify Form State
```javascript
// When modal opens, check console for:
[DEBUG] Create class submitted
```

### 4️⃣ Check API Response
- F12 → Network → Find POST /api/classes
- Click it → Response tab
- Should show: `{success: true, id: "...", enrollmentCode: "..."}`

---

## Emergency Fixes

### Clear All Local Data
```javascript
localStorage.clear()
```
Then refresh and login again.

### Check Server is Running
In terminal:
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status":"ok"}
```

### Restart Everything
```bash
# Kill current process
npm run dev
```

---

## Critical Info to Share When Reporting Issues

When reporting a bug, share:

1. **Console logs** (from F12 console)
2. **Network request** (F12 → Network → POST /api/classes)
3. **User role** (check localStorage for role value)
4. **Stored user data**:
```javascript
console.log(JSON.parse(localStorage.getItem('currentUser')))
```

5. **Backend logs** (terminal where `npm run dev` is running)

---

## Success Indicators ✅

You'll know it's working when:

1. Console shows `[DEBUG] Create class submitted`
2. Console shows `[API] Success: { status: 200 }`
3. Modal closes
4. New class appears in the list
5. Network tab shows `POST /api/classes → 200 OK`

