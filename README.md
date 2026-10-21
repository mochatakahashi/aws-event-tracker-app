# AWS SBG-APC Event Tracker ☁️📱

**AWS SBG-APC Event Tracker** is a web application for the **AWS Student Builder Group – Asia Pacific College** that works on phones and laptops. It is the companion app for attendees, officers and admins during cloud events, workshops and meetups: sign-ups with admin approval, event registration and check-in, session stamps, officer tasks, and email notifications.

---

## 🌟 Key Features

### 👤 Attendee Experience
- **Official Event Stamp Passport (`EventStampCard`)**:
  - Automatically generates circular stamp slots for every session requiring activity completion in the selected event.
  - Visual status indicators:
    - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with officer verification.
    - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator awaiting review.
    - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" functionality.
  - Progress tracking with a completion bar and "PASSPORT COMPLETED 🎉" status badge.
- **🗓️ Pick your sessions**: an event has **one expected-participants number** (shown on the event page); once registered, you tap **I'll attend** on the sessions you'll actually go to. Every session shows its **own real "going" count** (no more fake "+15 Going"), on the event page, the session page and the stamp passport. Events can have **many sessions or none** - an event with no sessions says it's one program and your registration covers it.
- **🏠 Live Dashboard**: what's happening now - a *Happening now* card for events you're registered for, *Up next for you* with a countdown ("See you there!"), *At {event}* (session now / next and your stamp progress), *Your registrations* (Registered / Interested / Attended), *Latest updates* (notifications and new events) and, for officers, *Your work* (open tasks, pubmats, next deadline). The event pass is on the event page, not the dashboard.
- **🤝 Connect**: **QR Card** opens your profile summary (bio, every social link, achievements) instead of a single link; **Scan QR** reads someone else's card with the camera. **AWS SBG-APC connection requests**: tap **Connect** on someone's profile → they get a notification with **Approve / Decline** (also listed under *Connection requests* on Connect); you see **Requested** (with Cancel) until they answer. Approved connections show in *My connections* (with their stamps, events and badges), and every profile shows **how many AWS SBG-APC connections** the person has. Profile pages are at `/people/:id`.
- **🔗 Social links you choose**: add any of **Facebook, Instagram, LinkedIn, GitHub, X, TikTok, YouTube, Website** - or **Other** with your own name for it (up to 10). Only the ones you add show, as quick links on Connect, your QR card and your profile. Links are checked by the server (no `javascript:` links).
- **🔖 Save events**: the bookmark icon on event cards and event pages saves the event to your account (works on every device); see them under **Events → Saved**.
- **✅ Registration approval**: tap **Register** and your registration is **Pending** until an admin or the event's check-in team **Approves** (or **Declines**) it - attendees can't change the status themselves. Your QR pass appears once approved; a declined person can **Ask again**. Checking in at the door also approves. **After you're checked in you can't cancel the registration.**
- **⭐ Stamps badge**: events with stamp activities (for now only Tech Barangay) show **⭐ Stamps** on the event card and *Stamp passport · N stamps* on the event page; other events say *No stamps at this event*.
- **🧑‍🏫 App tour for new users**: on first sign-in people are offered a one-minute tour (or **Skip**). Animated highlight boxes point at each part of the app (sidebar on laptops, bottom bar on phones) with Next / Back / Skip; it's remembered on the account. Forgot where things are? **Tap your profile picture** (top bar on phones, bottom of the sidebar on laptops) → **Replay the app tour** - also on the sidebar (*Take the app tour*) and Profile.
- **My Registrations**: your registrations with their status (Pending / Approved / Declined).
- **🎟️ Digital Event Pass**: shown on the event page as soon as you register (and full-size at `/pass`) - a personal QR code that turns green the moment an officer scans it.
- **📆 Past events stay correct**: an event that has ended moves to **Past** automatically (status follows the dates), even if nobody updated it.
- **📅 Add to Calendar**: one tap on the event page or pass - **Google Calendar** link, or an **.ics** file for Apple Calendar / Outlook - with Manila time, venue, the session schedule and a 1-hour reminder.
- **🏅 Certificate of Participation**: **only for people checked in at the event, and only after the event ends** - registered but didn't come means no certificate. Each one has a **unique code** (e.g. `CERT-2026-FR8WRZX2`, reserved at check-in) and a **link** (`/#/verify/<code>`). On the pass or event page: **View** (opens the PDF), **Download** (saves `AWS-SBG-APC-Certificate-<code>.pdf`), **Copy link**. The PDF has the attendee's name, event, date (the day the event ended), venue, the code and a **"Scan to verify" QR code**. Attendees get a bell notice and an email when it unlocks (daily 8:00 AM run).
- **📜 Certificate link (`/#/verify/:code`, public - no sign-in)**: anyone with the link (professors, recruiters) sees whether it's genuine, with the attendee's name, event, date and issue date, and can **View** or **Download** the PDF. Codes from an event that hasn't ended show *Not issued yet*; withdrawn certificates (check-in undone) show as no longer valid.
- **🏆 Builder Leaderboard (`/leaderboard`, admins only)**: for monitoring who's most active, ranked by **achievement points**, per event or across all events, with progress bars (passport completion for one event; tasks done for officers). Two boards:
  - **Attendees** - everyone (officers included, since they attend too), even with 0 points: 10 per approved stamp, +5 if it's a workshop, 15 per event check-in, 20 per badge.
  - **Officers** - 5 per stamp approved, 5 per attendee checked in, 20 per task completed, 25 per event worked, 20 per officer badge.
  - A podium for the top 3, the full ranking with each person's stats (same points share a rank) and *How points work*.
- **🎫 Stamp passport where you need it**: for events you're registered for that are **live or upcoming and have ⭐ Stamps**, the passport is on your **Dashboard** and on the **event page** (events without stamps, like Cloud Watch, show none).
- **🏆 My achievements**: only what you've completed - tiles for stamps earned, events attended and certificates; *My progress* and badges; your **certificates** (View / Download / Copy link); the stamps you've earned; and the events you checked in at.
- **🎖️ My progress & badges (Achievements page)**: your own stats - stamps, workshops, events attended, and for officers stamps approved, check-ins, tasks done and events volunteered - plus your **achievement badges** (no rankings for attendees/officers): ⭐ First Stamp, 🛠️ Workshop Warrior (3 workshops), ☁️ Cloud Explorer (5 stamps), 🏆 Full Passport Complete (every stamp of an event), 🚀 Multi-Event Builder (stamps at 2+ events).
- **🏅 Officer badges**: earned automatically - 🎟️ First Duty, ⭐ Stamp Master (25 stamps approved), 🚪 Door Keeper (25 check-ins), ✅ Task Finisher (5 tasks), 🎨 Content Creator (worked on a posted pubmat), 🎤 Event Host (assigned as *Host* on an event), 🚀 Event Regular (3 events) - and **awarded by an admin**: 🏅 Best Host, 🖼️ Best in Pubmat, 🏆 Event MVP, 🤝 Team Player, 🌟 Rising Star (optionally for a specific event, can be given again for another event). Officers are notified and see them on Achievements; others see them on the officer's profile; each badge is worth 20 points on the admin leaderboard.

### ✍️ Sign Up & Accounts
- **Three sign-up types**: APC Student (APC email + student ID), Outside Attendee (any email + school/organization, no student ID) and Officer (APC email, optional personal Gmail, student ID, **position, committee and sub-committee**). What they picked is kept and shown to admins as *Signed up as …*.
- **Password rules (everyone)**: at least 6 characters with **one capital letter, one small letter, one number and one special symbol** - a live checklist under every password field; checked again by the server.
- **Change password (with an emailed code)**: profile menu → *Change password*, or **Profile → Password**. Step 1 **Email me a code**; step 2 type the **6-digit code** from your email together with your current password and the new one. The app never fills the code in (no links, no autofill). Codes expire in 10 minutes, work once, allow 5 wrong tries, and at most one is sent a minute (five an hour). The same applies to the first password change after a temporary password.
- **Forgot password?** (sign-in page): a dialog asks for your email (APC or personal) → a code is emailed → type it with a new password. It gives the same answer whether or not the email has an account. Old reset links open the same code page (`/forgot-password`). No access to the email? An admin can still set a temporary password.
- **Sign-in protection**: after 5 wrong passwords in a row the account is locked for 15 minutes (resetting the password unlocks it).
- **Accounts - the recommended way**: everyone has **their own** account (no shared or premade logins). People **sign up themselves** and an admin approves them (the type and officer role they picked is shown). For someone who can't sign up, an admin uses **Add account** and hands over a temporary password they must change at first sign-in. New **admins** are only created by an existing admin through Add account.
- **Name format**: First Name, M.I. (optional), Last Name - shown as "Juan D. Dela Cruz".
- **Admin approval for everyone**: new accounts are *pending* and can't sign in until an admin approves them. A declined person sees the reason (if given) and can sign up again with the same email.
- **Email sign-in** (no Google sign-in), **Change password** on the Profile page, and profile photo, bio and social links saved to the account.
- **✏️ Edit your profile** (Profile → **Edit profile**): first name, M.I., last name (the display name and certificates follow), student ID (APC) or school/organization (outside attendees), personal email, bio and social links. The sign-in email is shown but locked (ask an admin); officer position/committee are set by an admin. Checked by the server.
- **Officer hierarchy**: President → VP Internal → VP External → Directors → Assistant Directors → Associates; committees: Secretariat (**Finance, Documents**), Operations, Marketing (**Creatives, Media**), Technicals, Relations.

### 🛡️ Officer & Admin Capabilities
- **Admin Dashboard** (`/home` for admins): Manage Accounts, Edit Events, Attendees & Achievements, Officers, Officer Tasks, Leaderboard, **Event Desk**, and **Send reminders now**. If club events from the built-in list (e.g. past events) aren't in the live database yet, it offers **Add them** (adds only what's missing; never overwrites edits).
- **Manage Accounts (`AdminDashboardPage`)**: approve or decline sign-ups (optional reason with quick picks), change roles, search, and delete accounts. **Co-organizer staff**: the 🤝 button on an attendee account (or *Co-organizer staff for* in Add account) links them to a partner org such as *GDSC APC*; filter *Co-organizer staff* lists them. **Add account**: create an approved account (any type, including officers with position/committee/sub-committee) with a generated **temporary password**, then *Copy login details* to hand over; the person must set their own password at first sign-in. **Reset password** gives anyone a new temporary password. **Edit details** (✏️) fixes a name, student ID / organization or email directly; **Ask to fix** sends the person a notification and an email listing what to fix (with a note), and they see a reminder at the top of the app until they save it. Student IDs use the format **2026-140242**; ones in another format are flagged.
- **Attendees & Achievements (`AdminAttendeesPage`)**: per-event attendee list with check-in, stamp finishers per session, people who finished every session, and **Excel (.xlsx) downloads** for profs.
- **Officers (`AdminOfficersPage`)**: officers in hierarchy order with events volunteered (and their event role), stamps approved and task progress; edit position/committee; **archive** one officer or the whole school-year batch (they become alumni attendees, listed under *Past batches*); delete; Excel download.
- **🤝 Co-organized events (partner orgs, not AWS)**: add the partner under **Co-organizer(s)** in the event form - the event page says *Co-organized by AWS SBG-APC and …*. Their people (usually APC students) get an attendee account marked **Co-organizer staff · <org>** by an admin, and the admin puts them on that event's **staff list** for **check-in / registration approval** and/or **stamps**. That's all they get: the **Event Desk** for the events they're assigned to (only the tabs for their duties), a *Co-organizer staff* card on their Dashboard - **no** Officer Dashboard, officer tasks, content tracker, officer badges or leaderboard. They can still attend events like any attendee. Server-checked; removing the mark stops their duties at once.
- **Officer Tasks (`AdminTasksPage`)**: a board by **committee** (All · Secretariat · Operations · Marketing · Technicals · Relations) with **sub-committee** filters. Each task has what to do, a **deadline (date + time)**, the committee/sub-committee and the officers assigned (that committee's officers listed first); assigned officers get an in-app notification and an email. Overdue deadlines turn red.
- **📣 Marketing Content Tracker**: the pubmat sheet inside the app - per event: Content, Details / reference post, **Creatives designee**, **Caption writer**, **Poster**, Status (Not Started → In Progress → For Review → Approved → Posted), Post date, File / link, Notes and a draft deadline, with a **Caption guidelines** link. Everyone assigned is notified with their role; officers update the status, file link and notes from their Officer Dashboard.
- **🗂️ Committee Tasks for leads (`/officer/tasks`)**: **Directors and Assistant Directors** see and add tasks for their own committee's officers, edit or delete their committee's tasks, and approve the tasks their associates add (their own tasks need no approval). **VP External** leads Marketing, Relations and Technicals; **VP Internal** leads Operations, Secretariat and Technicals (a tab per committee). The **President** can manage every committee, like an admin. In the sidebar it shows as e.g. *Marketing Tasks*. Tasks can be **edited after assigning** (✏️: move the deadline, add details, change officers or the event; the officers are told). Each task is for the **Whole org** or **an event** (filter *Show*), and the board has **Cards / Table / By officer** views and **Download Excel** (sheets: Tasks, By officer, By committee). Associates keep their own tasks and requests on the Officer Dashboard and can only change a task's status.
- **Officer Dashboard (`OfficerDashboardPage`)**: the officer's tasks (Start / Mark done / Reopen) and **their duties**. Request lists appear **only for the duties an admin gave them**: **Stamp requests** (approve / decline right there, or *Review in Event Desk*) at events where they're on the stamp team, and **Registration & check-in** (approve / decline waiting registrations, *Check people in*) at events where they're on the check-in team. Officers with no duty just see a note.
- **💬 Task comments & deadlines**: admins and the officers on a task comment on it, including tasks still waiting for approval and pubmats in the Content Tracker (the others on the task are notified). Each task shows *N days left* / *Due today* / *Overdue by N days*, and when finished *Done on time* or *Done N days late*; Officer Tasks counts done-on-time and late. **Reminders**: the daily 8:00 AM job sends a notification + email the day before a deadline and when a task is overdue (again every 3 days until done).
- **🧑‍🏫 Adviser account** (Add account → Role *Adviser*): a view-only **Adviser dashboard** (officers, events with attendance, officer tasks open / done on time / late, leaderboard), **announcements to the officers** (pinned at the top of officers' and admins' dashboards for 24 hours + a notification), and **sign-off requests (papirma)** - Secretariat, the Marketing Director / Assistant Director, the VPs, the President and admins send *Ask the adviser to sign* with a document link (Google Docs / Slides / Sheets / Drive, Canva, or Microsoft Word / PowerPoint / Excel only; the request shows what kind of file it is); the adviser approves or returns it with a comment, and the requester is notified. Admins can delete any request and senders their own (with Undo; deleted requests are kept 30 days). The adviser can't edit events, accounts or tasks.
- **📝 Registration link per event**: made automatically for every event. Admins copy it or download its **QR code** (event page or event form) for posts and posters. Opening it signs people in (or up) and shows a one-tap **Register** box for that event.
- **🔗 Share an event**: the **Share** button on an event page and on each event card opens the phone's share sheet (or Copy link / Facebook / email on laptops). The link shows a preview (title, date, picture) in Messenger and Facebook, and opens a public event page where people without an account can sign in or sign up.
- **📝 Event evaluation & stamps for the certificate**: the evaluation opens for checked-in attendees 30 minutes before the event ends; the certificate unlocks once they answer it. When the event has stamp sessions, they also need **every stamp** (shown as *Collect all N stamps* with progress on the event page and pass, and listed in the check-in notification; admins can turn this off per event). Standard questions (ratings, what you learned, what to improve, would you join again), editable per event by the admin. Anyone who hasn't answered gets an app notification + email after the event. Results (averages, answers, who's missing, CSV) on the event page for admins, the adviser and the event's officers.
- **📣 Pinned announcements**: a new announcement from the admin or adviser sits at the top of the dashboard for 24 hours, then moves to the announcements list. Admins pick **Officers** or **Everyone**. Its author or an admin can **Edit** or **Remove** it right on the dashboard.
- **💾 Works when the database is down**: the last data the app loaded is kept in the browser. If the database or connection fails, pages show that saved copy with a notice, and changes show an error until it's back. Cleared on sign-out.
- **🕒 Last sign-in** on each account in Admin Home.
- **➕ Officers add their own tasks**: *Add my own task* (task, details, event, committee, deadline) → it shows as **Waiting for approval** (no Start / Mark done yet) and admins get a notification; in **Officer Tasks → Tasks officers added** an admin or the officer's committee lead (Director, Assistant Director or VP) **Approves** (it joins the board and counts on the leaderboard) or **Declines** with a reason; the officer is notified. Admin Home shows how many wait.
- **🐏 Logos**: the AWS SBG-APC logo on the Get Started page, the logo as the round app icon (browser tab, home screen, sidebar, sign-in), and the AWS SBG-APC and Asia Pacific College logos in the footer.
- **📄 Footer, Privacy and Terms**: the Get Started, sign-in and sign-up pages end with *Contact us*, **Privacy** (`/privacy`), **Terms** (`/terms`), the club website, *Report a problem*, the inquiries email and the project credit. Sign-up needs *I agree to the Terms of Use and the Privacy Notice* (saved with the date and version). The profile has *Your data*: ask for a copy or to delete the account.
- **🧭 Event Desk (`/officer/scan`, admins and officers on an event's staff list)** - everything for running an event in one place, per event:
  - **Scan**: the QR check-in scanner (below).
  - **Stamp requests** (red badge with the number waiting): every pending request for the event with who asked, the session and whether they're checked in. **Stamps are approved after check-in** - if the person isn't checked in yet, the check-in team sees **Check in & approve** (one tap does both); others see *Check in first*. Decline is there too. New requests appear by themselves (refreshes every 20 s).
  - **Attendees**: everyone registered, filter *Not in yet / Checked in*, search, stamps so far, sessions picked, who checked them in, and a **Check in** button; tap a name to open their pass.
  - Checked someone in by mistake? **Undo check-in** on the scan card or **Undo** in the Attendees list (asks to confirm).
  - **Food** (food team and admins, when the event has food stubs): pick a meal to see how many were given (*Lunch 45/120*), find anyone by name (officers and speakers without a pass), **Give** or **Undo**. Scanning a pass also shows **Give Lunch / Give Snack**.
- **🍱 Food stubs**: an admin turns them on in *Edit event* and lists the meals (default Lunch and Snack, each with an optional opening time), then ticks **Food** for the food team under *Event staff*. Checked-in attendees, officers on the event, co-organizer staff and speakers (with an account) get **one of each meal**; a second claim is refused with when and who gave the first. The pass and event page show *Ready to claim / Opens … / Claimed*. Admins only monitor. A meal given by mistake can be taken back (*Given by mistake? Undo*, on the scan card or the Food tab). Event staff shows a hint with a **Turn on food** button while food stubs are off.
- **✨ Share my stamps**: a story card (1080 x 1920) of the stamps someone got at an event, with their name and photo, the stamps (animated), *I learned that / I want to share* lines, **@awssbgapc** and hashtags. Share (phone share sheet), Download (PNG) or copy the caption. On the stamp passport (Dashboard, event page) and in Achievements.
  - Admins reach it from the sidebar (**Event Desk**, with the waiting-stamps count), the Event Desk card on Admin Home, and the phone bottom bar; officers from the sidebar or their dashboard; co-organizer staff from the sidebar / bottom bar and their Dashboard card.
  - The red count is for **every event you work**; the event picker shows each event's count and, when requests are waiting at another event, the desk says so with a one-tap link. The count updates right after you approve or decline. Tabs follow your duties (no *Stamp requests* tab without the stamp duty, no *Attendees* tab without check-in).
- **Check-in scanner (Event Desk → Scan)**: scans an attendee's QR pass with the phone or laptop camera, shows their name, affiliation and stamp passport, and checks them in with **one tap** (which reserves their certificate code; the certificate unlocks after the event). At a workshop booth, the officer taps **Give stamp** on the session they just finished (sessions happening now are listed first and highlighted) - no need to go back to the Officer Dashboard; the attendee gets a notification. A stamp given by mistake can be taken back with **Remove stamp** (on the scan card or in the *Stamps given* list). The desk shows a 3-step guide: **Accept** registrations, **Check in** at the door (this also accepts them), **Give stamps**. A *"Can't scan? Find the attendee"* list shows everyone registered (not checked in first) - tap a name, or type to narrow it; it works without a camera. Re-scanning says who already checked them in.
- **🔒 Officers-only events**: tick *Officers only* in the event form for internal meetings - everyone sees the event (labelled *Officers only*, no participant count) but only officers and admins can register.
- **🗒️ Program flow**: event form → *Program flow* → **Paste from document** turns the program from the proposal into a table (or add rows by hand); shown as a table on the event page (the *Person-in-charge* column only for officers, admins and the adviser). Admin Home's **Update them** applies the club's official event info (descriptions, dates, venues, co-organizers, participants, program flow, speakers) to existing events.
- **🎤 Speakers**: in the event form, link a speaker to an app account (an officer who speaks, or any member) - their name, photo and social links come from their profile and stay up to date, with an *AWS SBG-APC officer* label. Outside speakers get typed-in social links and an optional email; if they create an account with that email later, it links automatically.
- **🗂️ Sessions editor (event page, admins)**: **Add session** for events with several parts (title, start/end in Manila time, room, type, speakers, description, *Has a stamp*). Speakers is a type-in box: pick someone from the directory or type a new name and press Enter (added to the Speakers directory on save); everyone speaking in the sessions also shows in the event's **Speakers Lineup**, where admins can **Edit** a speaker or **Remove** them from the event (and its sessions), and **Edit** / **Delete** each one. Only admins can (server-checked). Event photos and uploads on the event page are admin-only.
- **🪪 Your access at this event** (event page, officers and co-organizer staff on the staff list): role, duties and shortcuts with waiting counts - *Check people in*, *Registrations*, *Stamp requests*.
- **🔐 Event staff list (event page, admins)**: assign officers to an event with a role (Lead, Host, Usher, Registration Booth, Creatives, Media) and tick who may **Give stamps** and **Check people in** (the role pre-ticks a sensible default). **Only those officers** can give stamps or check people in at that event - enforced by the server, not just hidden buttons; admins can always do both. Officers are notified when they get a duty. Admin Home warns about upcoming events that have nobody on stamps or check-in.
- **🏅 Award badges (Officers page)**: open an officer, pick a badge (and optionally the event and a note), **Award**; tap × on a badge to take it back.

### 🔔 Notifications
- **In-app notification center with a bell badge** (unread count in the phone top bar and the laptop sidebar, refreshed every 30 s): stamp approved/declined, account approved/declined, assigned to an event, new task, checked in, and - for admins - new sign-ups waiting. Tap one to open the related page; *Mark all as read* and remove. Events you registered for that are live or start within 24 hours are pinned on top.
- **Emails** through **Gmail SMTP** (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) or **Amazon SES** for account approved/declined, event assignment and new tasks, plus a **daily 8:00 AM (Manila)** job for "event tomorrow", "see you today" and "task due tomorrow".
- The admin inbox (`aws.apcofficial@gmail.com`) is alerted about new sign-ups and failed emails.

### 🎨 Cloud Media & Interactive Image Adjusters
- **16:9 Banner Image Adjuster (`ImageBannerAdjuster`)**: Interactive frame cropper with 1×–3× zoom, drag positioning, and direct export/upload of 1280×720 banners.
- **Circular Avatar Image Adjuster (`AvatarImageAdjuster`)**: Circular mask cropper for attendee profile pictures and event speaker headshots with direct S3 pre-signed upload.
- **Direct-to-S3 Cloud Pipeline**: Client-side canvas export uploaded directly to Amazon S3 via secure pre-signed URLs (`/api/upload-url`).
- **Persistent Picture Storage & Recent Uploads Shelf (`RecentUploadsShelf`)**: Persistent client-side IndexedDB storage and `/api/uploads` DynamoDB endpoint for event banners and photos. Loads recent uploads with file metadata, relative dates, a **"⭐ Recent Upload"** badge on the latest picture, full-resolution preview, and 1-click **Use as Banner** action with automatic offline fallback.

### 📱💻 Phone & Laptop Layouts, Overlay-Free UX
- **Phones (< 768px)**: single-column pages, sticky top bar and a thumb-friendly **bottom navigation bar** (`BottomNav`).
- **Laptops (≥ 768px)**: a permanent **sidebar**, and pages that use the width - two-column Welcome, 2–3 column event picker, side-by-side Profile/Connect/Officer Dashboard sections, two-column admin lists, and the task form beside the task list. Content is centered with a max width of 1280px on large screens.
- **No Overlays**: inline expandable cards and confirmations instead of screen-obscuring dialogs.

---

## 🔐 Admin Account

There are no demo accounts. The app has one built-in admin, **`awsapc.admin`** (email `aws.apcofficial@gmail.com`; you can sign in with either):

- **Deployed (Vercel):** set `ADMIN_PASSWORD` in Vercel → Settings → Environment Variables before the first sign-in. The account is created with that password the first time the database has no accounts. Change it any time on **Profile → Change password** (needs the code emailed to the admin address, so email must be set up).
- **Local (`npm run dev`):** create a `.env.local` file (not committed) with `VITE_LOCAL_ADMIN_PASSWORD=your-password`, then restart `npm run dev`.

Everyone else signs up and waits for the admin to approve them.

## 🌐 Deployment status (October 2026)

- **Custom domain**: the app runs at **`https://apcsbg.org`** (the domain's DNS points the root and `www` records to Vercel).
- **Amazon SES** (`ap-southeast-1`): the `apcsbg.org` domain is verified (DKIM records added to the domain's DNS) and emails are sent from **`notifications@apcsbg.org`**. Production access has been requested from AWS; until it's granted, SES only delivers to addresses verified in the SES console.
- **Least-privilege keys**: SES uses a separate IAM user that can only send email (`ses:SendEmail` / `ses:SendRawEmail`). Its keys live only in Vercel's environment variables, never in the code or these docs.
- **Vercel**: the SES keys, region and sender are set as environment variables and the app was redeployed.

**Still to do after AWS approves production access**: set `EMAIL_PROVIDER=ses` (see below) so every email goes through SES, and set `APP_URL=https://apcsbg.org` so links in emails use the domain.

**Local secrets**: `.env.local` (git-ignored) holds the local admin password and, if you want the local app on the live database, AWS keys. Never commit it; `.env.example` lists the names only.

## ✉️ Email Notifications (Amazon SES or Gmail)

`EMAIL_PROVIDER` picks the sender: `ses` (Amazon SES, the default) or `gmail` (Gmail SMTP through Nodemailer). With `ses`, an email SES rejects is not retried through Gmail (while SES is still in the sandbox, only verified addresses receive SES email). The SES sender defaults to `notifications@apcsbg.org` (shown as "AWS SBG-APC") when `SES_FROM_EMAIL` isn't set.

**Copies (CC)**: every email also goes, as CC, to a short list of club addresses set in `api/notify.ts`, plus any in `NOTIFICATION_CC_EMAILS` (comma-separated), **except password codes**, which only the account owner receives. Recipients can see CC addresses, so keep that list to club inboxes. The Google **App Password must be created while signed in to the same account as `GMAIL_USER`** (that account needs 2-Step Verification), or Gmail rejects the login with error 535. In-app notifications work either way.

Emails are sent for: account approved / declined (with the reason), officer assigned to an event, new task, and every day at 8:00 AM (Manila) - event tomorrow, "see you today", and task due tomorrow. Officers get them on both their APC email and personal email. The admin inbox (`aws.apcofficial@gmail.com`) gets an email for every new sign-up waiting for approval, and a report if any reminder email fails or the daily job breaks.

Set these in Vercel → Settings → Environment Variables:

| Variable | Example | Notes |
| :--- | :--- | :--- |
| `GMAIL_USER` | `aws.apcofficial@gmail.com` | Gmail sender (preferred when set) |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | Created on the `GMAIL_USER` account |
| `SES_FROM_EMAIL` | `AWS SBG-APC <notifications@apcsbg.org>` | SES sender; its domain must be verified in Amazon SES |
| `SES_REGION` | `ap-southeast-1` | Optional; defaults to `APP_AWS_REGION` |
| `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY` | keys of the send-only IAM user | Optional; used only for SES. Without them SES uses `APP_AWS_*` |
| `EMAIL_PROVIDER` | `ses` | Optional: `ses` (default) or `gmail` |
| `NOTIFICATION_CC_EMAILS` | `club-inbox@example.com` | Optional; extra addresses copied (CC) on every email, comma-separated |
| `APP_URL` | `https://apcsbg.org` | Optional; used for links in emails |
| `CRON_SECRET` | any long random string | Protects the daily reminder job (`vercel.json` → `crons`) |
| `ADMIN_NOTIFY_EMAIL` | `aws.apcofficial@gmail.com` | Optional; admin alerts (new sign-ups waiting, failed emails). This is the default |

Keep the send-only SES keys in `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`, **not** in `APP_AWS_*`: those keys also read and write DynamoDB and S3, which the send-only user can't. (Without dedicated SES keys, the `APP_AWS_*` user needs `ses:SendEmail`.) While SES is in sandbox mode it can only email verified addresses, so approval/decline emails to new users will fail (Manage Accounts shows a warning and the admin inbox gets a report). Request production access in the SES console (**Account dashboard → Request production access**) so every user can receive emails.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI (MUI) v6
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **State Management**: React Context (`AuthContext`, `EventContext`) + LocalStorage Persistence
- **Backend**: Vercel Serverless Functions + AWS SDK v3 (Amazon DynamoDB, Amazon S3, Amazon SES), Vercel Cron for daily reminders
- **Email**: Gmail SMTP through `nodemailer` (Amazon SES as the fallback)
- **QR codes**: `qrcode` draws the attendee pass; `jsqr` reads it from the camera (both loaded only on the pages that use them)
- **Certificates**: `pdf-lib` builds the PDF on the server (no native binaries, runs on Vercel)
- **Excel export**: `write-excel-file` (loaded only when exporting)

---

## 🚀 Getting Started

### What to install on your computer

| Tool | Version | Why | Check with |
| :--- | :--- | :--- | :--- |
| **Node.js** (includes npm) | 18 or newer (20 LTS recommended) | Runs Vite, the tests and the build | `node -v` and `npm -v` |
| **Git** | any recent | Clone, commit and push | `git --version` |
| **Vercel CLI** *(optional)* | latest | `vercel dev` runs the `/api` functions locally | `npx vercel --version` |

Everything else comes from `npm install`. The packages the project uses:

| Package | Used for | Added in |
| :--- | :--- | :--- |
| `react`, `react-dom`, `react-router-dom` | The app and its pages | 0.1.0 |
| `@mui/material`, `@mui/icons-material`, `@emotion/*`, `@mui/x-charts` | UI components, icons, charts | 0.1.0 |
| `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` | Database (API functions) | 0.3.1 |
| `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | Image uploads and certificate files in S3 | 0.3.1 |
| `@aws-sdk/client-sesv2` | Email through Amazon SES (fallback) | 0.5.0 |
| `write-excel-file` | Excel downloads for admins | 0.4.0 |
| `nodemailer` (+ `@types/nodemailer`) | Email through Gmail SMTP | 0.5.3 |
| **`qrcode`** (+ `@types/qrcode`) | Draws the attendee's QR pass | **0.6.0** |
| **`jsqr`** | Reads QR codes from the officer's camera | **0.6.0** |
| **`pdf-lib`** | Builds the certificate of participation PDF | **0.6.0** |

### First-time setup

```bash
# 1. Get the code
git clone https://github.com/mochatakahashi/aws-event-tracker-app.git
cd aws-event-tracker-app

# 2. Install all packages (reads package.json / package-lock.json)
npm install

# 3. Local admin password (file is git-ignored)
#    Windows:  copy .env.example .env.local
#    macOS/Linux: cp .env.example .env.local
#    then edit .env.local and set VITE_LOCAL_ADMIN_PASSWORD

# 4. Start the app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in as `awsapc.admin` with the password from `.env.local`.

### Updating an existing copy

When you pull changes that add packages (like v0.6.0's `qrcode`, `jsqr` and `pdf-lib`), install them before running:

```bash
git pull
npm install
npm run dev
```

If `npm run dev` or `npm run build` fails with *"Cannot find module …"* after a pull, run `npm install` again. If it still fails (for example a missing native Rollup package on Windows), delete `node_modules` and install again:

```bash
rmdir /s /q node_modules   # Windows (Command Prompt)
rm -rf node_modules        # macOS / Linux
npm install
```

### What works locally vs. deployed

| Feature | `npm run dev` (no AWS keys in `.env.local`) | Deployed on Vercel, or `npm run dev` with AWS keys in `.env.local` |
| :--- | :--- | :--- |
| Accounts, events, stamps, tasks, registrations | ✅ saved in this browser only | ✅ shared DynamoDB (the live table) |
| In-app notifications (bell) | ✅ this browser only | ✅ shared |
| QR pass and Add to Calendar | ✅ | ✅ |
| Camera scanner | ✅ on `http://localhost` in this computer's browser; phones need https | ✅ (https) |
| Certificate download | ❌ shows "downloads from the deployed app" | ✅ |
| Emails, S3 uploads | ❌ | ✅ |

### Deploying (Vercel)

Vercel installs the packages from `package-lock.json` by itself on every deploy - nothing to install on the server. Push to `main` (or redeploy) after changing settings.

Set these in Vercel → Settings → Environment Variables, then redeploy:

| Variable | Purpose |
| :--- | :--- |
| `APP_AWS_ACCESS_KEY_ID`, `APP_AWS_SECRET_ACCESS_KEY` | IAM user keys (DynamoDB, S3 and `ses:SendEmail` access) |
| `APP_AWS_REGION` | AWS region, e.g. `ap-southeast-1` |
| `DYNAMODB_TABLE_NAME` | Table name (default `aws_events`) |
| `AWS_S3_BUCKET_NAME` | Bucket for banners, photos and certificates (`certificates/<eventId>/<certificateId>.pdf`). The IAM user needs `s3:PutObject` and `s3:GetObject`; the bucket can stay private (pictures open through `/api/uploads?action=image`, certificates through signed links). Without it, certificates are generated on the fly instead of stored |
| `ADMIN_PASSWORD` | First password for `awsapc.admin` |
| `SES_FROM_EMAIL` (+ `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`, `EMAIL_PROVIDER`) or `GMAIL_USER` + `GMAIL_APP_PASSWORD`, and `CRON_SECRET` (+ optional `SES_REGION`, `APP_URL`, `ADMIN_NOTIFY_EMAIL`) | Email notifications - see above |

> The camera scanner needs the **https** app link (browsers only allow the camera on secure pages). On the deployed Vercel URL this works automatically.

### ✅ Setup checklist (deployed app)

1. **Vercel environment variables** - the table above. After adding or changing any of them, **Redeploy** (Deployments → ⋯ → Redeploy); old deployments keep the old values.
2. **IAM permissions** for the user whose keys are in `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` (replace the table, region, account and bucket names):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow",
         "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:Scan"],
         "Resource": "arn:aws:dynamodb:ap-southeast-1:<account-id>:table/aws_events" },
       { "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": ["arn:aws:s3:::<bucket>/events/*", "arn:aws:s3:::<bucket>/certificates/*"] },
       { "Effect": "Allow", "Action": "ses:SendEmail", "Resource": "*" }
     ]
   }
   ```

   The `certificates/*` line is **new in v0.6.0**. Leave out the SES statement when SES has its own send-only keys (`SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`).
3. **Gmail app password** - sign in to Google **as `aws.apcofficial@gmail.com`**, turn on 2-Step Verification, create an App Password at `myaccount.google.com/apppasswords`, and paste it into `GMAIL_APP_PASSWORD`. A password created on any other Google account fails with error 535.
4. **S3 bucket CORS** (already needed for image uploads) must allow `PUT` from your Vercel domain. Certificate downloads use signed links, so the bucket can stay private.
5. **Cron** - `CRON_SECRET` set; `vercel.json` already schedules `/api/notify` daily at 8:00 AM Manila.
6. **Test** - sign up with a spare email, approve or decline it (email + bell), register for an event, open **My Event Pass**, scan it from an officer's phone on the https link, then, after the event ends, view and download the certificate.
7. **Event staff (new in v0.6.8)** - on each upcoming event's page, under **Event staff**, tick which officers can **Give stamps** and **Check people in**. Until you do, only admins can (Admin Home reminds you).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Type-checks (`tsc -b`) and builds production bundle |
| `npm run preview` | Previews the production build locally |
| `npm test` | Runs the Vitest test suite once |
| `npm run test:watch` | Runs Vitest in watch mode |

---

## 📁 Project Structure

```
aws-event-tracker-app/
├── api/                   # Vercel Serverless Functions (AWS SDK v3)
│   ├── events.ts          # DynamoDB events CRUD
│   ├── sessions.ts        # DynamoDB sessions CRUD
│   ├── stamps.ts          # DynamoDB stamp requests & approvals
│   ├── users.ts           # Accounts: sign up, sign in (scrypt), approval, profiles
│   ├── registrations.ts   # Event registrations, QR check-in, certificate PDFs (pdf-lib → S3)
│   ├── notifications.ts   # In-app notification inbox (bell)
│   ├── tasks.ts           # Officer tasks (admins, President, committee leads)
│   ├── speakers.ts        # Speaker directory (with photos)
│   ├── notify.ts          # Email notifications (Gmail SMTP / Amazon SES) + daily reminder cron
│   ├── upload-url.ts      # S3 pre-signed upload URL generator
│   └── seed.ts            # Batch database seeding endpoint
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AddToCalendarButton.tsx # Google Calendar link / .ics download
│   │   ├── AdminHome.tsx           # Admin dashboard cards + "Send reminders now"
│   │   ├── AdminUi.tsx             # Shared admin header, stat tiles, date helpers
│   │   ├── AppLayout.tsx           # Layout: sidebar on laptops, bottom nav on phones
│   │   ├── AvatarImageAdjuster.tsx # Circular avatar cropper with S3 upload
│   │   ├── BottomNav.tsx           # Mobile bottom navigation bar
│   │   ├── CertificateButton.tsx   # Certificate download (unlocked at check-in)
│   │   ├── EventStampCard.tsx      # Automatic circle stamp passport card
│   │   ├── EventStaffPanel.tsx     # Event staff list: roles + who can approve stamps / check in
│   │   ├── SessionsSection.tsx     # Event page sessions with "I'll attend" and going counts
│   │   ├── OfficerBadgeGrid.tsx    # Officer badges (automatic + awarded)
│   │   ├── AwardBadgePanel.tsx     # Admin: award / take back officer badges
│   │   ├── ImageBannerAdjuster.tsx # 16:9 banner frame adjuster with S3 upload
│   │   ├── NetworkingCard.tsx      # Inline modal-free QR card
│   │   ├── ProtectedRoute.tsx      # Auth route guard
│   │   ├── QrScanner.tsx           # Camera QR scanner (getUserMedia + jsQR)
│   │   ├── SessionCard.tsx         # Flow session card
│   │   └── StampBadge.tsx          # Circle badge indicator
│   ├── context/           # Global React Contexts
│   │   ├── AuthContext.tsx         # Auth state & localStorage persistence
│   │   └── EventContext.tsx        # Active event selection state
│   ├── pages/             # Page route views
│   │   ├── AdminDashboardPage.tsx   # Manage Accounts (approvals, decline reasons, roles, delete)
│   │   ├── AdminAttendeesPage.tsx   # Attendees, check-in, stamp finishers, Excel
│   │   ├── AdminOfficersPage.tsx    # Officer achievements, archive batches, past batches
│   │   ├── AdminTasksPage.tsx       # Assign officer tasks; approve tasks officers added
│   │   ├── DashboardPage.tsx
│   │   ├── EventBuilderPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── EventFlowPage.tsx
│   │   ├── EventPassPage.tsx        # Attendee QR pass, calendar, certificate
│   │   ├── EventsPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MorePage.tsx
│   │   ├── LeaderboardPage.tsx      # Builder Leaderboard (Attendees / Officers)
│   │   ├── NotificationsPage.tsx    # In-app notification center
│   │   ├── OfficerDashboardPage.tsx
│   │   ├── OfficerScanPage.tsx      # Check-in scanner
│   │   ├── ProfilePage.tsx
│   │   ├── SelectEventPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── VerifyCertificatePage.tsx # Public certificate verification
│   │   └── WelcomePage.tsx
│   ├── services/          # Cloud API & service layer
│   │   ├── authService.ts
│   │   ├── eventService.ts
│   │   ├── registrationService.ts
│   │   ├── sessionService.ts
│   │   ├── speakerService.ts
│   │   ├── taskService.ts
│   │   ├── notifyService.ts        # Triggers email notifications (/api/notify)
│   │   ├── notificationService.ts  # In-app notifications (/api/notifications)
│   │   ├── apiClient.ts            # /api detection + localStorage fallback helpers
│   │   ├── storageService.ts       # S3 pre-signed upload client
│   │   └── seedData.ts
│   ├── theme/             # MUI theme configuration & brand tokens
│   │   └── theme.ts
│   ├── types/             # Shared TypeScript declarations
│   │   ├── attendee.ts
│   │   ├── auth.ts                 # User, sign-up data, officer position/committee
│   │   ├── event.ts
│   │   ├── session.ts
│   │   ├── speaker.ts
│   │   └── task.ts                 # Officer tasks
│   ├── hooks/
│   │   └── useSessionPicks.ts      # Sessions people plan to attend + going counts
│   └── utils/
│       ├── people.ts               # Name format, APC email check, officer hierarchy
│       ├── eventStaff.ts           # Who may approve stamps / check in at an event
│       ├── officerBadges.ts        # Officer badge catalogue + automatic badge rules
│       └── excelExport.ts          # .xlsx downloads
├── ARCHITECTURE.md        # Technical architecture documentation
├── CHANGELOG.md           # Version release history
├── DECISIONS.md           # Architectural Decision Records (ADRs)
├── ROADMAP.md             # Project roadmap & upcoming features
├── README.md              # Project documentation
├── vercel.json            # Vercel deployment & routing config
└── package.json
```

---

## 🔌 Cloud Backend & Database Integration

The application operates in a **Hybrid Mode**:
1. **Live AWS Cloud (Vercel Serverless + DynamoDB + S3)**: When deployed or running with the serverless API (`vercel dev`), accounts, events, sessions, stamps, registrations (with check-in and certificate info), officer tasks, speakers and in-app notifications are stored in one DynamoDB table (each record has an `entityType`), and images and certificate PDFs in the Amazon S3 bucket. Everyone sees the same data on every device.
2. **Local development (`npm run dev`)**: `vite.config.ts` has a small dev middleware (`apiDevServer`) that runs the real `/api/*` handlers inside the Vite server, reading `.env.local` on each request.
   - **With AWS keys in `.env.local`** (`APP_AWS_ACCESS_KEY_ID`, `APP_AWS_SECRET_ACCESS_KEY`, ...): the local app reads and writes the **live DynamoDB table** (and S3, and sends real emails if email is set up). Treat it like production data, or point `DYNAMODB_TABLE_NAME` at a separate test table.
   - **Without AWS keys**: the API answers 503 ("database not configured") and the services fall back to this browser's `localStorage`. Different logins in the same browser still see each other's changes, but nothing is shared with other devices, and S3 uploads don't work.
   - Links the API builds (share, registration and certificate links) use `http://localhost:...` locally and `https://` when deployed (or `APP_URL` when set).

---

## 📄 Documentation Links

- 📐 [Architecture Documentation](ARCHITECTURE.md)
- 🗺️ [Project Roadmap](ROADMAP.md)
- 📝 [Changelog](CHANGELOG.md)
- 💡 [Architectural Decision Records (ADRs)](DECISIONS.md)

---

&copy; 2026 **AWS Student Builder Group – Asia Pacific College**. Built with ❤️ for AWS Builders.
