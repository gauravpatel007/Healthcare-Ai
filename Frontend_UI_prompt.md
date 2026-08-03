# Comprehensive User UI Regeneration Prompt

*You can copy everything below this line and provide it to any AI (including me) when you want to rebuild or redesign the User-side tabs of the Healthcare application to match the modern, premium Admin Overview aesthetic.*

---

## 🎯 Global Context & Persona
You are an expert Frontend Developer and UI/UX Designer. Your task is to rebuild the user-facing dashboard and application tabs for a premium Healthcare AI platform using React and Tailwind CSS. 
The user-facing application must perfectly mirror the "Admin Overview UI" aesthetic. This aesthetic is defined by ultra-clean white surfaces, extreme border radii, subtle colored gradient accents, bold typography, and smooth micro-animations.

## 🎨 The Design System (Must Follow)
Whenever you create components, use the following Tailwind CSS patterns:

### 1. The Core "Stat Card" Pattern
Every card on the platform MUST follow this exact structure:
```jsx
<div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
  {/* The Top Right Background Blob Accent */}
  <div className={`absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
  
  <div className="flex items-start justify-between relative z-10">
    <div>
      <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">Card Subtitle</p>
      <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">Main Value</h3>
    </div>
    {/* Icon Container */}
    <div className={`p-4 bg-indigo-500 bg-opacity-10 rounded-2xl shadow-sm text-indigo-500`}>
      <IconComponent className="w-7 h-7" />
    </div>
  </div>
</div>
```
*(Colors should be varied based on the card's theme: `bg-indigo-500`, `bg-emerald-500`, `bg-rose-500`, `bg-cyan-500`, `bg-amber-500`, `bg-purple-500`)*

### 2. Section Headers
All sections must start with this header pattern:
```jsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-400 rounded-full"></div>
  <div>
    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Section Title</h2>
    <p className="text-gray-400 text-sm font-medium">Subtitle describing the section</p>
  </div>
</div>
```

### 3. Page Headers
The top of every page should look like this:
```jsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
  <div>
    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Page Name</h1>
    <p className="text-gray-500 font-medium mt-1">Page description.</p>
  </div>
  <div className="flex gap-3">
    {/* Page-level Action Buttons */}
    <button className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
      Primary Action
    </button>
  </div>
</div>
```

### 4. General Aesthetics
- **Background:** The main app background should be a very light gray/off-white (e.g., `bg-gray-50` or `#f9fafb`).
- **Typography:** Use extremely bold weights for numbers and headers (`font-extrabold`, `tracking-tight`), and thick uppercase labels (`font-bold`, `uppercase`, `tracking-wide`).
- **Borders:** Extremely rounded corners (`rounded-[2rem]` or `32px` for large containers, `rounded-xl` or `rounded-2xl` for inner elements).

---

## 📑 Page-by-Page Requirements

Please implement the following tabs using the design system above:

### 1. Dashboard Overview (`DashboardOverview.jsx`)
- **Page Header:** Greeting ("Good Morning, [Name]") with the Health Score prominently displayed.
- **Top Row (Stat Cards):** 4-5 cards showing Quick Stats (e.g., Steps Taken, Calories Burned, Next Appointment, Current Weight).
- **Activity & Nutrition Section:** Grid layout. One side showing Circular Progress rings for steps/activity. The other side showing progress bars (gradient filled) for Protein, Carbs, and Fats.
- **Health Parameters Chart:** A large rounded card containing a line chart (Weight/BP) with the section header design. Include a time filter (7 days, 30 days) styled as a custom dropdown.
- **Upcoming Appointments:** A list view inside a rounded card. Each row should have a soft tinted icon representing the doctor or time, doctor's name, and specialty.

### 2. AI Chat & Symptom Checker (`AIChat.jsx` / `AISymptom.jsx`)
- **Layout:** A two-column layout or a centered main interface.
- **Left/Top:** A summary of previous AI diagnoses or chat history using the Stat Card design.
- **Chat Interface:** A highly polished chat window. User messages should have a soft gray/indigo background; AI messages should have a white background with a subtle shadow. 
- **Input Area:** Floating input box with a soft shadow (`shadow-lg`), rounded full (`rounded-full`), and an integrated send button with a gradient background.

### 3. AI Fitness & Nutrition (`AIFitness.jsx` / `AINutrition.jsx`)
- **Header:** "AI Fitness Coach" or "AI Nutritionist".
- **Stat Cards:** Daily Goals (Calories, Workouts Completed, Active Minutes).
- **Plan Generation:** A large, inviting section to "Generate New Workout/Meal Plan" using a wide card with a background gradient accent.
- **The Plan Display:** Use lists with beautiful rounded containers for each meal or exercise. Include icons (e.g., a dumbbell icon in an orange box for workouts, an apple in a green box for meals).

### 4. Trackers & Parameters (`Trackers.jsx`)
- **Grid of Trackers:** Use the Stat Card pattern for Weight, Blood Pressure, Heart Rate, Blood Sugar, etc.
- **Log Button:** A prominent "Log New Metric" button that opens a beautiful, glassmorphic modal.
- **Historical Data:** A table or list styled cleanly with no vertical borders, just subtle horizontal dividers (`border-b border-gray-100`), showing past logs.

### 5. Appointments & Records (`Appointments.jsx` / `Records.jsx`)
- **Appointments Grid:** Upcoming and Past appointments displayed as cards. Use the top-right blob accent (e.g., cyan for upcoming, gray for past).
- **Records (Files):** A grid of uploaded medical documents. Each document is a card (`rounded-2xl`, `p-4`) with a large File Icon in a colored square, the filename, and upload date.
- **Upload Area:** A dashed-border dropzone `border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-[2rem]` for uploading new records.

### 6. Medicine Tracker (`Medicine.jsx`)
- **Header:** "Medication Schedule".
- **Stat Cards:** "Taken Today", "Missed", "Active Prescriptions".
- **Timeline/List:** A vertical list of medications. For each medication, show the pill name, dosage, and time. Use a toggle or check button with a satisfying hover effect (e.g., turning from gray to vibrant green when marked as taken).

### 7. Emergency & SOS (`Emergency.jsx`)
- **Thematic Override:** Use Red/Rose accents for this page (`bg-rose-500`, `text-rose-600`).
- **SOS Button:** A massive, pulsing button centered on the screen for absolute emergencies.
- **Emergency Contacts:** Cards representing contacts with phone icons. 
- **Medical ID:** A summary card containing blood type, allergies, and critical conditions, easily readable.

### 8. Settings & Profile (`Settings.jsx`)
- **Layout:** A left sidebar with pills (`rounded-xl`) for navigation (Profile, Security, Notifications, Preferences). The active pill should have a dark background (`bg-gray-900 text-white`).
- **Form Fields:** Inputs should be large (`py-3 px-4`), with soft borders (`border-gray-200`), rounded (`rounded-xl`), and subtly highlight on focus (`focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10`).

---

**Execution Instructions for the AI:** 
When rebuilding these pages, do not use generic or boring styles. Adhere strictly to the extreme border radii (`rounded-[2rem]`), the specific shadow styles (`shadow-sm` on rest, `hover:shadow-xl hover:-translate-y-1` on hover), and the top-right colored corner blobs for all cards to maintain the premium, modern aesthetic of the platform.
