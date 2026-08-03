# Healthcare AI - Technical Specification

This document is a comprehensive, implementation-ready technical specification of the current application's feature set. It follows a strict 10-point format for each audited feature to allow another developer or AI assistant to perfectly recreate the functionality.

---

## AUTH & IDENTITY

### Email/password Auth & JWT Implementation
1. **Feature name**: Standard Email/Password Authentication & JWT Session Management
2. **Status**: Fully implemented
3. **Files involved**:
   - `backend/app/routers/auth.py` - Contains the actual endpoint logic for login, registration, and refresh.
   - `backend/app/models/user.py` - Contains the `User` and `UserProfile` SQLAlchemy models.
   - `backend/app/utils/security.py` - Utility functions for password hashing (`bcrypt`) and JWT generation (`PyJWT`).
4. **API endpoints**:
   - **POST `/auth/register`**: Requires `{email, password, role, name}`. Hashes password, creates `User` & `UserProfile`, generates `EmailVerificationToken`. Background task triggers email.
   - **POST `/auth/login`**: Requires `{email, password}`. Returns `{"access_token", "refresh_token", "expires_in"}`. Logs attempt in `LoginHistory`.
   - **POST `/auth/refresh`**: Requires `{refresh_token}`. Returns new tokens.
   - **POST `/auth/logout`**: Requires valid JWT token. Currently just returns success (no actual token blacklisting implemented yet).
5. **Database schema**:
   - `users`: `id` (String(36)), `email` (String(255), unique), `hashed_password` (String(255)), `role` (Enum: patient, doctor, admin), `is_active` (Boolean), `is_verified` (Boolean), `two_factor_enabled` (Boolean), `two_factor_secret` (String(32)).
   - `login_history`: `id`, `user_id` (FK users.id), `ip_address`, `user_agent`.
6. **Third-party services**: 
   - `passlib[bcrypt]` (Password hashing)
   - `PyJWT` (Token generation)
   - Env vars: `SECRET_KEY`, `ALGORITHM` (HS256), `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`.
7. **Business logic**:
   - 1. User submits email/password.
   - 2. Backend queries `User` by email.
   - 3. If found, compares `verify_password(raw, hashed)`.
   - 4. Checks `is_active` and `is_verified` flags.
   - 5. If `two_factor_enabled` is True, generates a short-lived (5 min) temporary JWT and returns `requires_2fa=True` flag instead of standard tokens.
   - 6. Otherwise, generates standard access/refresh JWTs.
   - 7. Creates `LoginHistory` record and fires background email task if `login_alerts_enabled=True`.
8. **Edge cases**: `is_verified` blocks full login until email is validated. 2FA intercepts the login flow with a temporary token.
9. **Frontend components**: Not provided in scope (but handles standard `/auth/login` REST calls).
10. **Known bugs/TODOs**: `POST /auth/logout` is purely client-side; there is no token blacklist/revocation table implemented for server-side enforcement.

### Google OAuth / Other OAuth
1. **Feature name**: Google OAuth Login/Registration
2. **Status**: Fully implemented (Google only). GitHub/other OAuth providers are **stubbed/not implemented**.
3. **Files involved**: `backend/app/routers/auth.py`
4. **API endpoints**: 
   - **POST `/auth/google`**: Requires `{credential}` (Google ID token). Returns standard JWT token response.
5. **Database schema**: Reuses `users` and `user_profiles`. Creates a user with a random 32-char password if they don't exist.
6. **Third-party services**: `google-auth` (`id_token.verify_oauth2_token`). Env var: `GOOGLE_CLIENT_ID`.
7. **Business logic**:
   - 1. Receives Google JWT (`credential`).
   - 2. Verifies signature via `google.auth` using `GOOGLE_CLIENT_ID`.
   - 3. Extracts email. Looks up `User`.
   - 4. If missing, auto-registers with random hashed password and default "patient" role.
   - 5. Triggers standard 2FA check or returns JWTs.
8. **Edge cases**: Auto-registered users bypass email verification since Google verified the email.
9. **Frontend components**: Google Sign-In button component expected.
10. **Known bugs/TODOs**: No mechanism for an OAuth user to later set a manual password since the random password is unknown.

### Video Auth / Face Verification (Liveness)
1. **Feature name**: Face Login Verification
2. **Status**: Partially implemented (Biometric matching exists, Liveness detection does **not** exist).
3. **Files involved**: `backend/app/routers/auth.py`, `backend/app/models/user.py`.
4. **API endpoints**:
   - **POST `/auth/face-setup`**: Requires `{descriptor: list[float]}`. Saves JSON array to DB.
   - **POST `/auth/face-login`**: Requires `{email: str, descriptor: list[float]}`. Returns JWT response.
   - **POST `/auth/face-disable`**: Disables feature.
5. **Database schema**: `users.face_login_enabled` (Boolean), `users.face_descriptor` (Text - JSON array).
6. **Third-party services**: None on backend (relies on client-side face mesh/embedding generation).
7. **Business logic**:
   - 1. User submits email and a 128-float face descriptor.
   - 2. Retrieves user's stored descriptor from DB.
   - 3. Computes Euclidean distance: `math.sqrt(sum((a - b) ** 2 for a, b in zip(stored, new)))`.
   - 4. If distance `> 0.45`, raises 401 Unauthorized. Otherwise, grants access.
8. **Edge cases**: Descriptor array length mismatch raises 401. Corrupted JSON raises 401.
9. **Frontend components**: Expected to use a library like `face-api.js` to generate the 128-float embedding.
10. **Known bugs/TODOs**: Euclidean distance computation is done natively in Python (slow for large scale). No anti-spoofing or liveness detection on the backend.

### 2FA / MFA & OTP/SMS Verification
1. **Feature name**: Two-Factor Authentication via TOTP
2. **Status**: Fully implemented (TOTP). SMS/OTP is **not implemented**.
3. **Files involved**: `backend/app/routers/auth.py`, `backend/app/models/user.py`.
4. **API endpoints**:
   - **GET `/auth/2fa/setup`**: Returns `{secret, uri}` for authenticator apps.
   - **POST `/auth/2fa/enable`**: Requires `{code}` to verify and activate.
   - **POST `/auth/login/2fa`**: Requires `{temp_token, code}`. Returns full JWTs.
5. **Database schema**: `users.two_factor_secret` (String(32)), `users.two_factor_enabled` (Boolean).
6. **Third-party services**: `pyotp` for TOTP generation and verification.
7. **Business logic**: 
   - 1. At login, if `two_factor_enabled`, issue 5-min temp token.
   - 2. User calls `/auth/login/2fa` with temp token and 6-digit code.
   - 3. Decode temp token to get `user_id`. Verify code using `pyotp.TOTP(user.two_factor_secret).verify(code)`.
   - 4. Issue actual JWTs.
8. **Edge cases**: Session expires quickly (5 min).
9. **Frontend components**: Modal for entering the 6-digit code during login.
10. **Known bugs/TODOs**: No backup recovery codes are generated or supported.

### Email Verification Flow & Password Reset
1. **Feature name**: Email Verification and Password Reset
2. **Status**: Fully implemented.
3. **Files involved**: `backend/app/routers/auth.py`, `backend/app/models/user.py`, `backend/app/utils/email.py`.
4. **API endpoints**:
   - **POST `/auth/verify-email`**: Requires `{email, code}`. Updates `is_verified`.
   - **POST `/auth/forgot-password`**: Requires `{email}`. Generates code.
   - **POST `/auth/reset-password`**: Requires `{email, code, new_password}`.
5. **Database schema**: `email_verification_tokens` (id, email, verification_code, expires_at), `password_reset_tokens` (id, email, reset_code, expires_at).
6. **Third-party services**: Native Python `secrets`, `smtplib` (in `utils/email.py`).
7. **Business logic**: Generates a 6-digit code, stores it in DB with a 15-minute expiration, and fires a background thread (`asyncio.to_thread`) to send the email.
8. **Edge cases**: Prevents email enumeration by returning a generic success message even if the user doesn't exist during password reset.

### RBAC / Permission Levels
1. **Feature name**: Role-Based Access Control
2. **Status**: Stubbed. Role exists on the model but no middleware/guard enforces it strictly.
5. **Database schema**: `users.role` (Enum: 'patient', 'doctor', 'admin').
10. **Known bugs/TODOs**: Lacks robust `@requires_role("admin")` dependencies.

---

## MEDIA & FILES

### Image/Video/Audio Upload & Storage Integration
1. **Feature name**: File Uploads (Static Local Storage)
2. **Status**: Partially implemented (PDF/Images via Local Storage). Cloudinary/S3/Video/Audio processing is **not implemented**.
3. **Files involved**: `backend/app/routers/medical_records.py`, `backend/app/services/file_service.py`, `backend/app/main.py`.
4. **API endpoints**: 
   - **POST `/records`**: Accepts `multipart/form-data` with `file: UploadFile`.
5. **Database schema**: `medical_records.file_path` (String(500)).
6. **Third-party services**: FastAPI `UploadFile`. `StaticFiles` in `main.py` serves the directory. Env Var: `UPLOAD_DIR` (default `/app/uploads`), `MAX_FILE_SIZE_MB`.
7. **Business logic**: Saves file locally using `file_service.save_upload_file`. Filenames are likely randomized. Mounted via `application.mount("/uploads", StaticFiles(...))` for direct HTTP download.
10. **Known bugs/TODOs**: Relies entirely on local disk storage (Docker volumes) which limits horizontal scaling.

### PDF/Document Generation or Parsing
1. **Feature name**: Medical Report PDF Parsing
2. **Status**: Fully implemented.
3. **Files involved**: `backend/app/routers/medical_records.py`.
4. **API endpoints**:
   - **POST `/records/upload-ai`**: Uploads PDF, parses text, uses AI to extract metrics, creates `MedicalRecord` and `HealthEntry` items automatically.
5. **Database schema**: Inserts into `health_entries` and `medical_records`.
6. **Third-party services**: `PyMuPDF` (`fitz`) for PDF text extraction.
7. **Business logic**: 
   - 1. Save PDF locally.
   - 2. Read text via `fitz.open()`.
   - 3. Send text to Groq AI prompt asking for a JSON object of health metrics.
   - 4. Create `MedicalRecord` with raw findings.
   - 5. Loop over JSON keys, match them to `METRIC_CATEGORY_MAP` (e.g. "systolic bp" -> "blood_pressure").
   - 6. Create corresponding `HealthEntry` points automatically.
8. **Edge cases**: Rejects image-based PDFs (requires OCR which is missing). Handles missing `fitz` module gracefully via Exception catching.

---

## REAL-TIME & COMMUNICATIONS

### Push Notifications, WebSockets, SMS
1. **Status**: **Not implemented**. The codebase has no WebSocket routers, no Push Notification integrations (APNS/FCM), and no SMS service integrations.

### Email Sending Service & In-app Notifications
1. **Feature name**: Email Alerts
2. **Status**: Partially implemented (Email sending works, in-app notification DB is **not implemented**).
3. **Files involved**: `backend/app/utils/email.py`, `backend/app/routers/auth.py`.
6. **Third-party services**: Python `smtplib`.
7. **Business logic**: Fires emails via `asyncio.to_thread` for non-blocking execution during login alerts (if `login_alerts_enabled=True`) and verification codes.

---

## AI / ML FEATURES

### RAG Chatbot
1. **Feature name**: AI Health Assistant (RAG Chatbot)
2. **Status**: Partially implemented (Generation works, full RAG/Vector DB retrieval is **stubbed/not implemented** natively in the router, relies purely on prompt context injection).
3. **Files involved**: `backend/app/routers/ai_assistant.py`, `backend/app/services/ai_service.py`, `backend/app/models/chat.py`.
4. **API endpoints**:
   - **POST `/ai/chat`**: Requires `{message}`. Returns `{response}`.
   - **GET `/ai/chat/history`**: Returns `ChatMessageResponse` list.
5. **Database schema**: `chat_messages`: `id`, `user_id`, `role` (user/assistant), `content`, `module`, `created_at`.
6. **Third-party services**: `Groq` API (llama-3.3-70b-versatile). Env vars: `GROQ_API_KEY`, `GROQ_MODEL`.
7. **Business logic**:
   - 1. Save user's chat message to `chat_messages`.
   - 2. Fetch user's `UserProfile` (age, conditions, allergies).
   - 3. Build string context: `Patient: {name}, Age: {age}, Conditions: {conditions}...`
   - 4. Call `generate_ai_response()` passing the user message and profile context.
   - 5. Save AI's response to `chat_messages`.
8. **Edge cases**: No historical conversation context window is passed to the AI prompt; it only passes the immediate user profile and the single new message.
10. **Known bugs/TODOs**: True RAG (chunking, embeddings, vector DB schema) does not exist in the primary FastAPI app. A separate `chatbot` Flask app exists in `docker-compose.yml` using Pinecone, but is completely decoupled from the main FastAPI flow.

### Symptom Checker
1. **Feature name**: AI Symptom Checker
2. **Status**: Fully implemented (Hybrid AI + Hardcoded fallback).
3. **Files involved**: `backend/app/routers/ai_symptom.py`.
4. **API endpoints**: 
   - **POST `/ai/symptoms/analyze`**: Requires `{symptoms: list, duration, severity, age_group}`. Returns `{urgency, conditions: list, specialists, recommendations}`.
5. **Database schema**: Reads `UserProfile` for context. Does not save history.
6. **Third-party services**: Groq AI for JSON parsing.
7. **Business logic**:
   - 1. Asks AI to output a JSON object scoring the condition probabilities.
   - 2. Parses the JSON.
   - 3. If JSON fails or AI fails, drops into a hardcoded fallback dictionary (`SYMPTOM_CONDITIONS`) mapping keywords like "headache" -> {"Tension Headache": 60%}.
   - 4. Computes urgency based on hardcoded rules (e.g. "Severe" or "chest pain" = High urgency).

### Fitness AI, Mental Health AI, Nutrition AI
1. **Feature name**: Domain AI Modules
2. **Status**: Fully implemented (Fitness), Others (Mental, Nutrition) implied but detailed logic is analogous.
3. **Files involved**: `backend/app/routers/ai_fitness.py`.
4. **API endpoints**: 
   - **GET `/ai/fitness/workout`**: Returns hardcoded JSON workout database.
7. **Business logic**: Uses hardcoded data structures (e.g., `WORKOUTS` dict) for standard queries, and routes voice intents to log data (e.g. `/trackers/steps`).

---

## DATA & INTEGRATIONS

### Wearable Integrations
1. **Feature name**: Fitbit API Integration
2. **Status**: Fully implemented.
3. **Files involved**: `backend/app/routers/health_trackers.py`.
4. **API endpoints**:
   - **POST `/trackers/fitbit/callback`**: Handles OAuth callback from Fitbit.
   - **GET `/trackers/wearable/sync`**: Syncs steps, HR, calories from Fitbit.
5. **Database schema**: `user_profiles.fitbit_access_token`, `fitbit_refresh_token`, `connected_devices` (JSON list).
6. **Third-party services**: Native `urllib.request` to `api.fitbit.com`. Env vars: `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`.
7. **Business logic**:
   - 1. User redirects to Fitbit, gets code, frontend sends to backend.
   - 2. Backend posts to Fitbit OAuth endpoint, saves tokens in `UserProfile`.
   - 3. During `/wearable/sync`, calls `api.fitbit.com/1/user/-/activities/date/today.json`.
   - 4. Writes data into `HealthEntry` table. If Fitbit call fails (e.g. token expired), silently falls back to random simulated data generation for demonstration purposes.

### Health Data Standards (FHIR/HL7)
1. **Status**: **Not implemented**. Uses proprietary internal JSON structures.

### Payment, Calendar, Geolocation
1. **Status**: **Not implemented**. 

---

## CORE DOMAIN FEATURES

### Health Trackers
1. **Feature name**: Daily Health Metrics (Water, Sleep, Vitals)
2. **Status**: Fully implemented.
3. **Files involved**: `backend/app/routers/health_trackers.py`, `backend/app/models/health_tracker.py`.
4. **API endpoints**:
   - **PUT `/trackers/water`**: Upserts daily water glasses.
   - **POST `/trackers/sleep`**: Logs sleep hours and quality.
   - **POST `/trackers/health-entry`**: Logs generic metrics (steps, heart rate).
   - **POST `/trackers/voice-log`**: NLP parsing for voice commands (e.g. "I drank 3 glasses of water").
5. **Database schema**:
   - `water_intake`: user_id, date, glasses. Unique constraint on (user_id, date).
   - `sleep_entries`: user_id, date, hours, quality, bedtime, wake_time.
   - `health_entries`: user_id, category (Enum: blood_sugar, bp, weight, hr, steps, calories), value, secondary_value (for diastolic BP), label, recorded_at.

### Medical Records
1. **Feature name**: Medical Records & AI Comparison
2. **Status**: Fully implemented.
3. **Files involved**: `backend/app/routers/medical_records.py`.
4. **API endpoints**:
   - **CRUD endpoints**: GET `/records`, GET `/records/{id}`, POST `/records`, PUT, DELETE.
   - **POST `/records/{id}/ai-summary`**: Extracts PDF text and generates Markdown summary.
   - **POST `/records/compare`**: Requires two record IDs, extracts text from both PDFs, and asks AI to compare and highlight changes.
5. **Database schema**: `medical_records`: `title`, `category`, `doctor`, `hospital`, `date`, `findings`, `notes`, `file_path`, `family_member_id`.

### Appointments
1. **Feature name**: Doctor Appointments
2. **Status**: Stubbed schema. Router logic not extensively implemented or audited.
5. **Database schema**: `appointments`: `doctor`, `specialty`, `hospital`, `date`, `time`, `notes`, `status` (upcoming, completed, cancelled), `ai_prep_notes`.

### Expense Tracking
1. **Feature name**: Medical Expenses
2. **Status**: Schema implemented. 
5. **Database schema**: `medical_expenses`: `description`, `category` (medicine, doctor, tests, insurance, other), `amount`, `date`.

### Family Management
1. **Feature name**: Family Member Profiles
2. **Status**: Schema implemented.
5. **Database schema**: `family_members`: `name`, `relation` (father, mother, etc.), `age`, `blood_type`, `avatar`, `conditions`, `medications`. 

### Analytics & Challenges
1. **Feature name**: Challenges & Gamification
2. **Status**: Schema implemented.
5. **Database schema**: `challenge_progress` (challenge_id, date, progress, target, completed), `user_badges` (badge_name, earned_at).

---

## INFRASTRUCTURE

### Middleware, Background Jobs, Caching
1. **Feature name**: Infrastructure Stack
2. **Status**: Partially implemented.
3. **Files involved**: `backend/app/main.py`, `backend/app/middleware.py`.
4. **Implementation details**:
   - **Middleware**: CORS is registered via `CORSMiddleware` in `main.py` using `CORS_ORIGINS` env var. A custom timing/logging middleware exists in `middleware.py`.
   - **Background Jobs**: Handled via simple `asyncio.create_task(asyncio.to_thread(...))` calls (e.g. for sending emails). No Celery or Redis queue exists.
   - **Caching**: **Not implemented**.
   - **Feature Flags, Admin Routes, Webhooks**: **Not implemented**.
   - **API Docs**: FastAPI auto-generates Swagger at `/docs` (default).

### Deployment
1. **Docker**: `docker-compose.yml` configures a Postgres DB (`lifeos_db`), FastAPI app (`lifeos_app`), and a separate Flask Chatbot app (`lifeos_chatbot`).
2. **Database Migrations**: Alembic is configured. `docker-compose` runs `alembic upgrade head 2>/dev/null || echo ...` on startup to auto-create tables in DEBUG mode.
