DONT FOLLOW THIS 
You are going to refer this
A new BIG task here :
I need to change UI for the user 
I uploaded in the folder :
So. Basically as the images you are going to match that UI in that folder
(mainly 3 videos)
and refer links :
1.Frammer part 1 contains Dashboard and AI chat TAB : https://active-osprey-701720.framer.app/
2.Frammer part 2 contains Trackers, Appointments ,Records,Medicines TAB : https://vivacious-area-069594.framer.app/medicine
Other modules photographs are in folder and
Backend should remain same i mean they should working like as usual

Below is a **master prompt** you can give to **Cursor AI, Claude Code, Lovable, Bolt, v0, Windsurf, or ChatGPT** to transform your **current Healthcare User Website** into the same premium style as your **LifeOS Admin Dashboard**, while **keeping all existing functionality**.   

---

# MASTER UI REDESIGN PROMPT

## Role

You are a Senior UI/UX Designer and Senior React + TailwindCSS Frontend Engineer.

I have an existing Healthcare AI web application.

The current user UI is shown in the attached screenshots (Word file).

I also attached screenshots of my Admin Dashboard.

I want the **entire User Portal** to follow the exact same design language as the Admin Dashboard.

DO NOT change business logic.

DO NOT remove features.

DO NOT break API calls.

DO NOT modify backend functionality.

Only redesign the frontend while keeping everything functional.

---

# Overall Design Style

Use the Admin Dashboard as the design reference.

The entire application should feel like a premium SaaS platform.

Design style:

* Modern
* Clean
* Minimal
* Apple-inspired
* Soft shadows
* Rounded corners
* Light backgrounds
* Glassmorphism where appropriate
* White cards
* Plenty of spacing
* Professional medical application
* Dashboard appearance
* Responsive

---

# Theme

Background

```
#F8FAFC
```

Cards

```
White
Rounded 24px
Soft Shadow

box-shadow:
0 10px 35px rgba(0,0,0,.06)
```

Border

```
1px solid #EEF2F7
```

Hover

```
translateY(-2px)

transition 300ms
```

---

# Colors

Primary

```
#2563EB
```

Secondary

```
#7C3AED
```

Success

```
#10B981
```

Warning

```
#F59E0B
```

Danger

```
#EF4444
```

Info

```
#06B6D4
```

Background

```
#F8FAFC
```

Text

```
#0F172A
```

Secondary Text

```
#64748B
```

Border

```
#E2E8F0
```

---

# Typography

Use

```
Inter
```

Weights

```
400
500
600
700
```

Headings

Bold

Large

Subtle hierarchy

---

# Navigation

Convert the current navigation into the Admin Dashboard style.

Left Sidebar

Width

```
260px
```

Contains:

Dashboard

AI Chat

Health Analytics

Medical Records

Appointments

Fitness

Medication

Emergency

Nutrition

Profile

Settings

Logout

Each item should have

Icon

Hover animation

Active indicator

Rounded background

Blue accent

Collapsible on mobile

---

Top Navbar

Like Admin UI.

Contains

Search

Notifications

Profile Avatar

User name

Dropdown

Sticky

Blur background

Shadow

---

Cards

Every section should be inside beautiful cards.

Card Style

Rounded 24px

Large padding

Soft shadow

Hover effect

Smooth transition

---

Buttons

Primary

Blue Gradient

```
#2563EB
↓

#3B82F6
```

Rounded

12px

Height

48px

Hover

Slight lift

Shadow

Loading animation

Secondary

Outlined

Ghost

Danger

Green

Success

Variants

---

Inputs

Modern inputs

Rounded

Soft borders

Focus glow

Icons inside

Floating labels if suitable

---

Tables

Convert every table to modern SaaS table.

Rounded container

Sticky header

Hover rows

Status badges

Pagination

Search

Filters

Sorting

---

Charts

Use

Recharts

or

Chart.js

Cards

Rounded

Animated

Gradient

Tooltips

Legends

Smooth transitions

---

Dashboard

Redesign dashboard exactly like Admin UI.

Top Statistics Cards

Examples

Heart Rate

Water Intake

Calories

Sleep

Appointments

Medicine Reminder

AI Chats

Weight

Steps

Blood Pressure

Each card contains

Gradient icon

Title

Large value

Small subtitle

Hover animation

---

Graphs

Weekly Health

Monthly Activity

Calories Burned

Water Intake

Heart Rate

Weight Trend

Medication Progress

Sleep Analytics

All graphs should have

Rounded card

Gradient

Legend

Tooltip

Animation

---

Health Tracker

Redesign all tracker pages.

Water

Exercise

Weight

Sleep

Heart Rate

Calories

Steps

Mood

Blood Pressure

Cards instead of plain layouts.

---

Medical Records

Convert to premium management UI.

Features

Search

Filters

Category Tabs

Preview

Upload

Download

Timeline

Status badge

Empty state

Icons

---

Appointments

Modern calendar

Upcoming cards

Timeline

Doctor cards

Status

Filter

Search

Beautiful booking modal

---

Medication

Medication Cards

Reminder Cards

Progress Ring

History

Next Dose

Completion %

Color indicators

---

AI Chat

Transform chatbot into ChatGPT-quality interface.

Requirements

Rounded chat bubbles

Avatar

Markdown support

Code highlighting

Typing animation

Streaming effect

Message timestamps

Suggested prompts

Copy button

Regenerate

Like

Dislike

Speech

File upload

Image upload

Voice input

Dark code blocks

Beautiful scrollbar

Typing indicator

Auto scroll

Conversation history

Pinned chats

Search conversations

---

Fitness

Modern dashboard

Workout cards

Calories

Charts

Progress

Exercise history

Weekly summary

Achievements

Badges

---

Profile

Modern profile page.

Sections

Personal Info

Health Info

Emergency Contacts

Insurance

Medical History

Settings

Security

Devices

Activity

Cards

Editable

Profile image

Upload

---

Settings

Beautiful settings page.

Grouped cards

General

Notifications

Privacy

Theme

Security

Language

Units

Accessibility

---

Notifications

Modern notification center

Unread badge

Filters

Categories

Mark all read

Animation

---

Modals

Rounded

Blur background

Smooth animation

Close animation

---

Loading States

Skeleton loaders

Progress bars

Shimmer effects

Animated placeholders

---

Empty States

Illustrations

Helpful message

Action button

---

Animations

Use Framer Motion.

Fade

Slide

Scale

Hover lift

Button ripple

Card hover

Page transitions

Accordion

Smooth route transitions

---

Icons

Use Lucide Icons everywhere.

Consistent sizes

Gradient icon backgrounds

---

Spacing

Use an 8px spacing system.

Large whitespace.

Do not crowd components.

---

Responsive

Desktop

Tablet

Mobile

Collapsible sidebar

Responsive cards

Responsive tables

Responsive charts

Responsive typography

---

Accessibility

Keyboard navigation

ARIA labels

Proper contrast

Focus states

Screen reader support

---

Performance

Lazy loading

Code splitting

Memoization

Optimized images

Virtualized tables

---

Dark Mode

Implement a complete dark mode.

Dark cards

Dark navbar

Dark sidebar

Proper shadows

Persistent preference

---

Code Requirements

Keep existing APIs.

Keep routes.

Keep backend.

Keep database.

Keep state management.

Keep authentication.

Only replace UI.

Create reusable components.

Avoid duplicated code.

Organize components properly.

---

Component Structure

Create reusable components:

```
/components/ui

StatCard

GradientCard

DashboardCard

MetricCard

ChartCard

ModernTable

SearchBar

Sidebar

Navbar

Avatar

ProfileDropdown

NotificationDropdown

Badge

StatusBadge

LoadingSkeleton

EmptyState

ProgressRing

GradientButton

GlassCard

AnimatedCard

Modal

Drawer

Tabs

Timeline

FileUploader

MarkdownViewer

ChatBubble

TypingIndicator

HealthMetricCard

AppointmentCard

MedicationCard
```

---

Expected Result

The final UI should look like:

* Premium SaaS Healthcare Platform
* Similar visual language to the attached Admin Dashboard
* Consistent spacing, typography, and color palette
* Smooth animations throughout
* Fully responsive
* Modern, clean, and professional
* All existing functionality preserved
* No backend or API changes
* Reusable component architecture
* Pixel-perfect, production-ready interface

---

This prompt is based on the visual style of your attached **LifeOS Admin Dashboard** and is intended to make your **entire user portal match that same premium design language** while preserving the existing application behavior. 
