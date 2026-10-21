# Changelog 📝

All notable changes to the **AWS SBG-APC Event Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.37] - 2026-10-21

### Added
- **Share my stamps**: a story card (Instagram story size, 1080 x 1920) of the stamps someone collected at an event, to post on Instagram, Facebook, TikTok or Messenger.
  - The card shows the club and APC logos, the event name, date and venue, *Hi, I'm (first name)!* with their profile photo, each session's stamp (collected stamps land with a stamp animation and a check; missing ones show a dashed *?*), a *1 of 2 stamps* or gold **Passport complete!** badge, *I learned that* / *I want to share* lines to fill in with the story text tool, *Tag us on your story* **@awssbgapc**, and hashtags: **#AWSSBGAPC**, one from the event name (for example **#TechBarangay**), and **#PassportComplete** or **#StampCollector**.
  - **Share** opens the phone's share sheet with the picture; on a computer it saves the picture instead. **Download** saves a PNG, and **Copy** copies a ready caption.
  - Photo: their profile photo, **Use another photo** (stays on the device, not uploaded or saved), or no photo.
  - Where: a **Share my stamps** button on the stamp passport (Dashboard and event page) once they have at least one stamp, and a **Share my stamps** section in Achievements for past events.
- **Food team hint** under Event staff: when food stubs are off it explains that the Food tick appears after turning on *Give out food*, with a **Turn on food** button that opens Edit event at Food stubs; when on, it shows the meals and how many are on the food team.

### Changed
- **Food given by mistake**: the scan card now has *Given by mistake? Undo* on each given meal (it was only in the Food tab), and both places ask *Take back Lunch?* before undoing. Wording matches the desk: *Food given 12:30 by …*, filter *Given*.
- **Get Started page**: the logo card at the top was removed (the logos stay in the footer).
- **Footer**: the new round AWS SBG-APC badge (transparent background) replaces the club logo next to the APC logo, and a small one sits beside the app name instead of the old icon with the pulsing white ring.
- **Footer**: the AWS SBG-APC logo now uses the version with a transparent background (no white card), shown larger with a soft light edge so it reads on the purple; the round icon next to the app name was removed.

---

## [0.6.36] - 2026-10-21

### Added
- **Delete a sign-off request**: a trash button on each Adviser sign-off request. Admins can delete any request; officers can delete only the ones they sent. It asks to confirm, and an **Undo** bar shows for a few seconds after. If the request was still waiting, the adviser gets a notice that it was withdrawn.
- Deleted requests are not erased right away: they are hidden and kept for 30 days so they can be restored (the coming *Recently deleted* page will list them for admins).

---

## [0.6.35] - 2026-10-21

### Changed
- **Event Desk wording**: the desk now uses three clear words so check-in and approval don't get mixed up.
  - **Accept / Decline** a registration (before the event, in the Attendees tab). *Pending* is now *Waiting for acceptance*, the filter is *To accept*, and *Approve all* is *Accept all*.
  - **Check in** at the door. There is only one button now; checking someone in also accepts their registration (the old *Approve & check in* button is gone). Rows still waiting for acceptance only show Accept and Decline.
  - **Give stamp / Don't give** for stamps (was *Approve stamp*). A stamp request shows as *Asked for a stamp*.
- A short 3-step guide at the top of the Event Desk: *Accept registrations*, *Check in at the door*, *Give stamps*.
- Event staff duty names: *Check people in & accept registrations* and *Give stamps*.

### Added
- **Remove stamp**: a stamp given by mistake can be removed. On the scan card, a given stamp shows *Given by mistake? Remove stamp*; the *Stamp requests* tab has a new **Stamps given** list with a Remove button on each. Both ask to confirm, and the attendee gets a notification that the stamp was removed. Only people who can give stamps for the event can remove them.

---

## [0.6.34] - 2026-10-21

### Added
- **Footer**: a full-width footer band on the **Get Started** page (curved top edge, slowly shifting purple gradient with soft drifting lights, the app name, and link buttons with icons that lift and glow on hover; motion stops when the device asks to reduce motion), and a light version on the sign-in and sign-up pages, About, and the Privacy / Terms pages (not inside the app pages): *Contact us*, **Privacy**, **Terms**, the **AWS SBG-APC website**, *Report a problem*, the inquiries email, the credit (*A project by Rodmina Jhoy Ibe, AWS SBG-APC President*) and the version.
- **Club and school logos**: the AWS SBG-APC logo is the website logo (Get Started page, on a white card), and the same logo (in a circle) is the app icon (browser tab, phone home screen, sidebar, sign-in and sign-up). The footer shows the AWS SBG-APC and Asia Pacific College logos side by side. (The browser tab used the default Vite icon before.)
- **Social media**: the footers show the club's Facebook, Instagram, LinkedIn and TikTok as icon buttons (*Follow us* on the Get Started page).
- **Privacy Notice** (`/privacy`) and **Terms of Use** (`/terms`), open without signing in. Written in plain language from what the app actually stores and does, under the Data Privacy Act of 2012 (RA 10173): what is collected, why, who can see it, where it is stored (AWS Singapore, email through Amazon SES or Gmail, hosted on Vercel), how long, and how to see, fix or delete your data. No ads, tracking or analytics.
- **Agreement at sign-up**: *I agree to the Terms of Use and the Privacy Notice* must be ticked; the server refuses sign-ups without it and saves when and which version was agreed to.
- **Your data** on the profile: *Ask for a copy of my data* and *Ask to delete my account* open an email to the club inbox with your name and email filled in.
- **Report a problem** opens an email with the app version, page and device filled in.
- The About window shows the credit and the same links.

---

## [0.6.33] - 2026-10-21

### Fixed
- **Profile photo adjuster**: after picking a photo the circle looked empty (the photo was placed off to the side), and **Re-adjust Photo** showed the current photo pushed into the corner with a black area. The photo is now centered and fills the circle, and what you see is exactly what gets saved. Same fix for speaker photos in the event form.
- The arrow keys now move the photo, as the hint says (Shift moves faster). If a photo can't be loaded for adjusting, it says so and asks you to pick it again.

### Changed
- **About AWS SBG-APC** now only says what the app is for and its version (no list of updates).

---

## [0.6.32] - 2026-10-20

### Added
- **Student ID format**: APC student IDs must be **2026-140242** (4 digits, a dash, 6 digits). The field adds the dash while you type and stops at 11 characters (sign-up, Add account, profile, admin edit); the server checks it too. Older IDs in another format still work until changed, and Manage Accounts flags them in red.
- **Edit details (admin)**: the ✏️ button on an account in Manage Accounts fixes the name, student ID or organization, sign-in email and personal email directly.
- **Ask to fix (admin)**: the *Ask to fix* button (person with a gear) on an account asks the person to fix their name, student ID, organization, personal email, profile photo or something else, with an optional note. They get a notification and an email, and a reminder stays at the top of every page with an *Update profile* button until they save the fixes (each item ticks off once its value changes). The account keeps working. Manage Accounts shows *Asked to fix: …* until it's done; the admin can update or cancel the request.
- **Edit a task after assigning it** (admins, the President and committee leads): the ✏️ button on a task card (and in the Table view) changes the name, details, committee, officers, whole org or event, and the deadline. Officers on the task are told when the deadline moves or the details change; newly added officers get a *New task* notice. A moved deadline gets its reminders again.

- **Undo a mistaken check-in at the Event Desk**: the scan card has *Checked in by mistake? Undo check-in*, and the desk's Attendees list has **Undo** next to each checked-in person (both ask to confirm; check-in team and admins).
- **Adviser sign-off, safer links**: the document link must be from **Google Docs / Slides / Sheets / Drive, Canva, or Microsoft Word / PowerPoint / Excel (OneDrive, SharePoint, Office)**, starting with https://. The form says what kind of file it is as you paste it (e.g. *Google Docs document*), and requests show *Open Google Docs document* with the site name. Older requests with other links are shown as text, not opened. Checked by the server too.
- **Who sends sign-off requests**: Secretariat, the Marketing Director and Assistant Director, the VPs, the President and admins. Other officers no longer see the sign-off form.
- **Password reset notice**: when someone uses *Forgot password*, the admin gets a short email saying who asked and when, **without the code**, so they can help if the code doesn't arrive.
- **About AWS SBG-APC** (account menu and the phone's More page) now opens a window with what the app is and the version. The version shows the real number (was v0.1.0).

### Fixed
- **Social links are checked**: a LinkedIn link must be on linkedin.com, YouTube on youtube.com / youtu.be, and so on for Facebook, Instagram, GitHub, X and TikTok; *Website* and custom links must be web links. The field says what's wrong as you type, and the server refuses wrong links (profiles, Connect and speakers).
- **Networking card**: *No social links yet* sat beside the QR code; the QR, your links and the copy button are now each on their own centered line.
- **Show password** button: the eye on password fields disappeared after clicking away (that was Microsoft Edge's own button, which hides itself). Every password field now has the app's own *Show / Hide password* button that always stays; Edge's is hidden.

- **Co-organizer staff box** in Manage Accounts: the *Partner org* text box was squeezed into the name column; it now spans the whole account card, with the buttons below it.

### Security
- Checked again: password code emails go only to the account owner (never CC'd to the club inboxes), as set in v0.6.28.

---

## [0.6.31] - 2026-10-20

### Added
- **Food stubs**: in *Edit event*, turn on **Food stubs** and list the meals (default **Lunch** and **Snack**, up to 6), each with an optional time it opens. Everyone who gets food can claim **one of each meal**: checked-in attendees, officers on the event, co-organizer staff on it, and speakers with an account. Admins only monitor (no stubs).
- **Food team**: a new **Food** duty in *Event staff* (shown once food stubs are on). Only the food team and admins can give out meals; the server checks it.
- **Giving food at the table**: scanning a pass in the Event Desk shows a **Food stubs** box with **Give Lunch** / **Give Snack**. A second claim is refused and shows when it was claimed and by whom, even when two phones scan at the same moment. A meal can't be given before its opening time.
- **Event Desk → Food tab**: pick a meal to see how many were given (e.g. *Lunch 45/120*), find people by name (officers and speakers who have no pass), give or **Undo** a mistaken claim, and filter *Not yet / Claimed / All*. Refreshes every 20 s.
- **Stub status for attendees**: My Event Pass and the event page show each meal as *Ready to claim*, *Opens …* or *Claimed 12:05 PM*. Before check-in it says the stubs unlock when you're checked in.
- The *Your access at this event* card shows **Give out food stubs** with a button to the Food tab for the food team.

---

## [0.6.30] - 2026-10-20

### Added
- **Whole org or an event**: when assigning a task, pick **This task is for: Whole org** (the default) or **An event** (then the event is required; upcoming events are listed first). Every task card shows a *Whole org* or event chip, and the board has a **Show** filter: All tasks, Whole org (no event), or one event. The stat tiles follow the filter. Officers' own task form has the same *Whole org (no event)* choice.
- **Table view**: a **Cards / Table / By officer** switch on the tasks board (admins, the President, VPs, Directors and Assistant Directors). *Table* lists the tasks like a spreadsheet (Task, Committee, Sub-committee, For, Assigned to, Status, Deadline, Progress); tap a column name to sort. *By officer* has one row per officer: tasks, to do, in progress, done, done on time, done late, overdue. Both scroll sideways on phones.
- **Download Excel**: exports what the board is showing (tab, sub-committee, Show and Open / Done / All filters) to an .xlsx with three sheets: *Tasks*, *By officer* and *By committee*.

### Changed
- The officer's *Add a task for yourself* note says who approves it (their Director, Assistant Director, VP or an admin), or that a lead's own task goes on the board right away.
- The committee picker's "Any / whole org" option is now "Any committee" (whole org is chosen with *This task is for*).

---

## [0.6.29] - 2026-10-20

### Added
- **Committee tasks for Directors and Assistant Directors**: a new **Committee Tasks** page (`/officer/tasks`, in the sidebar as e.g. *Marketing Tasks*, and linked from the Officer Dashboard). Directors and Assistant Directors see and add tasks for their own committee's officers, edit or delete any of their committee's tasks, and approve or decline the tasks their associates add. Their own tasks go live right away (no admin approval). They can't see or assign other committees.
- **VPs**: VP External leads Marketing, Relations and Technicals; VP Internal leads Operations, Secretariat and Technicals. They get the same page with a tab for each of their committees and pick the committee when adding a task.
- **President**: same access as the admin on tasks (every committee).
- Officers who add their own task now notify their committee's leads too, not only the admins.

### Changed
- **Task changes are checked by the server**: adding, editing and deleting a task needs the person doing it (`actorId`). Admins and the President can change any task, committee leads only their committee's tasks, and the officers on a task can only update its status and their pubmat progress (not the title, deadline or who is on it). Before, anyone who knew a task id could edit or delete it.
- Pubmat designers, caption writers and posters count as "on the task", so they can update their progress and comment.
- Pubmats can only be added by Marketing leads (and admins / the President).
- The back button on the Committee Tasks page goes to the Officer Dashboard.

---

## [0.6.28] - 2026-10-20

### Added
- **Password changes need a code from your email**: *Change password* (and the first change after a temporary password) is now two steps: **Email me a code**, then type the **6-digit code** with your current password and the new one. The app never fills the code in. Codes expire in 10 minutes, work once, allow 5 wrong tries, and can be asked for once a minute (5 an hour). They are stored hashed and the code emails are never copied (CC) to anyone.
- **Forgot password, made safe**: the sign-in page's *Forgot password?* dialog asks for your email, a code is emailed, and you type it with a new password. Same answer whether or not the email has an account. It replaces the first version of this flow, which had serious problems: the reset code and link token were saved in plain text and returned by the public account list (anyone could read another person's code and take over the account, including the admin's), reset emails were copied (CC) to the club inboxes, codes had no try limit, the email link filled the code in automatically, and the reply revealed which emails have accounts. Old reset links now open the code page. You can also sign in or reset with your personal email.
- **Sign-in lock**: 5 wrong passwords in a row lock the account for 15 minutes; resetting the password unlocks it.

### Fixed
- **`/api/notify` crashed on every call** (`hasGmail` was not defined in the handler after the SES-default change), which stopped every email and the daily reminders. Fixed.

### Changed
- **Dates in Philippine time**: events, sessions and tasks are shown and entered in Asia/Manila time on every device.
- **Personal email**: everyone can add one on their profile (used for sign-in and password reset); admins can change an account's email.
- **Email defaults**: SES is the default sender now (`EMAIL_PROVIDER=gmail` to use Gmail); every email is copied to the club inboxes, except password codes.
- An admin's temporary password also clears a lock and any old code.
- Password data, codes and lock counters are never sent to the browser.
- If email isn't set up, asking for a code says so and points to an admin (temporary password).

---

## [0.6.27] - 2026-10-20

### Added
- **Local dev API**: `npm run dev` now runs the real `/api` functions through a Vite middleware (`vite.config.ts`), using `.env.local`. With AWS keys there, the local app uses the **live** DynamoDB table; without them it falls back to this browser's storage as before.
- **Email copies**: every email is CC'd to the club's notification addresses, plus any listed in `NOTIFICATION_CC_EMAILS`.
- Docs: a full API reference (all 12 functions and their `?action=` routes) and a map of screens and components in ARCHITECTURE.

### Changed
- **Email provider**: `EMAIL_PROVIDER=ses` sends only through SES (no Gmail retry); unset still means Gmail when it's set up, else SES. The SES sender defaults to `notifications@apcsbg.org`.
- `.gitignore` lists `.env.local` explicitly.

### Fixed
- Links built by the server (share, registration and certificate links, links in emails) use `http://` for `localhost`, so they work in local development; deployed links stay `https://` (or `APP_URL`).

---

## [0.6.26] - 2026-10-20

### Added
- **Custom domain and Amazon SES (done outside the code)**: the app runs on `apcsbg.org`; SES is set up in `ap-southeast-1` with the domain verified (DKIM) and `notifications@apcsbg.org` as the sender; production access is requested from AWS; a separate send-only IAM user's keys, the region and the sender are stored in Vercel's environment variables.
- **`SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`**: SES can use its own send-only keys, separate from the app's DynamoDB / S3 keys (`APP_AWS_*`).
- **`EMAIL_PROVIDER`** (`ses` or `gmail`): choose the sender (see 0.6.27 for how `ses` behaves now).

### Changed
- Docs: deployment status, the new email settings, and examples use `notifications@apcsbg.org` and `https://apcsbg.org`. No keys or private details are in the docs.

---

## [0.6.25] - 2026-10-20

### Added
- **Registration link for every event, made automatically**: each event gets its own link (saved as the event's registration link, replacing the old external link field). Admins find it on the event page and in the event form with **Copy link** and **Download QR** (a PNG for posters and pubmats).
- **One-tap register**: opening the link shows the event; people sign in (or sign up) and land on the event with a **Register for ...** box at the top, one tap to register (still approved by an officer). Signed-in people go straight there. New accounts are taken to the event on their first sign-in after approval.
- The link's preview in Messenger / Facebook says "Register: <event>".

### Changed
- The app tour waits until after someone registers or answers an evaluation from a link, instead of covering it.
- Registration errors now show a message instead of failing silently.

---

## [0.6.24] - 2026-10-20

### Changed
- **Program flow**: the *Person-in-charge* column is only shown to officers, admins and the adviser. Attendees see time, duration and activity.
- **Admins (and the adviser) don't attend events**: they monitor them. They have no Register button, and the server refuses their registrations.
- **Events with stamp sessions: the certificate needs every stamp** (plus check-in and the evaluation). Checked server-side (certificate download and the public verify page). Applies to events ending from Oct 20, 2026; an admin can untick **Certificate needs all stamps** in the event form (for example when sessions run at the same time).

### Added
- **Stamp reminder** on the event page and the event pass: "Collect all N stamps to get your certificate", with how many are done and which are missing (refreshes every minute).
- **Check-in notification** lists the stamps to collect (and mentions the evaluation).
- After the event, attendees missing stamps are told which ones (app + email) instead of "certificate ready".

---

## [0.6.23] - 2026-10-20

### Added
- **Edit and remove speakers on the event page** (admins): each speaker in the **Speakers Lineup** has **Edit** (name, title / role, organization, bio, email) and **Remove from event** (takes them off the event and off its sessions). Changes show right away.
- **Share from the events list**: every event card has a Share button next to the bookmark.

### Fixed
- **Sharing on phones**: the share sheet now opens straight from the tap. Before, the app looked up the link first, and phones (iPhone especially) refused to open the share sheet after that wait.
- **Copy link** when the browser blocks the clipboard (some in-app browsers): the link is shown in a box to copy by hand.

---

## [0.6.22] - 2026-10-20

### Added
- **Share an event**: a **Share** button on every event page. On phones it opens the phone's share sheet (Messenger, Facebook, Instagram, SMS...); on laptops it offers **Copy link**, **Share on Facebook** and **Send by email**.
- **Link previews**: the shared link (`/api/events?action=share&id=...`) shows the event's title, date, venue and picture when pasted in Messenger, Facebook or Discord, then opens the event.
- **Public event page** (`/#/e/<event>`): people without an account see the event (picture, date, venue, description, co-organizers) with **Sign in to register** and **Create an account**. After signing in they land on the event page. Signed-in people go straight to the event page. Officers-only events say it's an internal meeting.

---

## [0.6.21] - 2026-10-20

### Added
- **Event evaluation form**: opens for checked-in attendees **30 minutes before the event ends** (on the event page, the event pass and the dashboard). It starts with the standard questions: overall rating, speakers (only when the event has speakers), venue and organization (1 to 5), what you learned, what we can improve, and "would you join again". Admins can edit, reorder, remove or **add questions** (rating, yes / no, multiple choice, written) in the event form.
- **The certificate needs the evaluation**: it unlocks once the event has ended **and** the attendee answered. Checked server-side (certificate download and the public verify page). Events that ended before today keep their certificates as before; an admin can also turn it off per event (*Needed for the certificate*).
- **Reminder after the event**: everyone checked in who hasn't answered gets a notification and an email ("Answer the evaluation to get your certificate") with a link that opens the form. People who already answered get "your certificate is ready". It goes out soon after the event ends (the app triggers it; at most every 5 minutes) and from the daily job, once per person.
- **Evaluation results** on the event page for admins, the adviser and the event's officers: how many answered, average rating per question, yes / no and choice counts, the written answers, who hasn't answered yet, and **Download CSV**.

---

## [0.6.20] - 2026-10-20

### Added
- **Pinned announcements**: a new announcement from the admin or adviser stays at the top of the dashboard for 24 hours (attendee/officer home, the Officer Dashboard, Admin Home, Adviser Home). Its author or an admin can **Edit** or **Remove** it right there; edits show "edited". After 24 hours it moves to the announcements list.
- **Who sees an announcement**: admins choose **Officers** (default) or **Everyone**. Members only see the ones for everyone; the adviser writes to the officers.
- **Last sign-in time** on each account in Admin Home ("Last signed in Oct 20, 9:15 AM · 4 sign-ins").
- **Saved copy when the database can't be reached**: the app keeps the last data it loaded (events, sessions, and other lists) in the browser. If the database or the connection fails, pages keep showing that copy with a notice ("Can't reach the database right now. Showing saved info from ..."), and changes show an error instead of silently saving only on this device. The saved copy is cleared on sign-out.
- **Officers can comment on all their tasks**, including ones still waiting for approval or declined, and on their pubmats in the Content Tracker (the button now reads **Add a comment**).

### Changed
- **The app tour only opens on a person's first sign-in** (it no longer pops up on every new browser). It can still be replayed from the profile menu.
- **Session speakers**: the speakers field is now a type-in box. Pick someone from the directory or type a new name and press Enter; new names are added to the Speakers directory when the session is saved.
- **Speakers lineup** on an event page now also includes everyone speaking in its sessions.
- No em dashes in the app's text and docs (plain hyphens instead).
- Rodmina Jhoy Ibe's speaker card: "President, AWS SBG-APC", no old bio (in the built-in data; the live database gets it from Admin Home → **Update them**).

### Fixed
- **Profile photo not showing after upload**: photos are shown through the app's image link (works with a private S3 bucket), on every page with an avatar. If cloud storage isn't available, a small copy of the photo is saved on the account so it still shows everywhere.

---

## [0.6.19] - 2026-10-20

### Added
- **Officers-only events** (event form → *Officers only*): everyone can see the event (marked **Officers only**, no participant count), but only officers and admins can register - attendees see that it's an internal officers' meeting. Server-checked.

### Changed
- Official event info, version 4 - **AWS Launchpad: Core Services Session Operational Briefing**: an officers-only internal working session, Tuesday May 19, 2026, 11:30 AM – 1:30 PM, Room 309; description from the officers' announcement; no participant count or speakers.

---

## [0.6.18] - 2026-10-20

### Changed
- Official event info, version 3 (Admin Home → **Update them** again):
  - **Cloud Watch: Demo Day x Spider-Man: Brand New Day** - October 17, 2026, 1:30–4:00 PM, Room 309, hybrid; the "Look but Don't Touch" AWS Console demo; ~30 participants; program flow; speakers Francis Anciro (Technicals Assistant Director - Parts 1–2), Rodmina Jhoy Ibe (President - Part 3), Vince Nelmar Alobin (Technicals Director - Part 4).
  - **Tech Barangay** venue: MPH1, Comlab 204 & Comlab 206.
  - **Mini-Org Fair**: APC Cafeteria; 100 participants (max 100).
  - Speaker bios no longer carry one event's topic (topics are in each event's program flow).

---

## [0.6.17] - 2026-10-20

### Added
- **Program flow** on events: a *Program flow* section in the event form - **Paste from document** turns a pasted program (Time / Duration / Activity / Person-in-Charge, one cell per line or tab-separated) into a table, or add/edit rows; the event page shows it as a table (a stacked list on phones).
- **Updated official info for the club's events** (`src/data/clubEventInfo.ts`): Admin Home shows *New official info is ready for N events* → **Update them** applies it to the live database (descriptions, dates & venues, co-organizers, expected participants, program flow, speakers; Tech Barangay's three stamp sessions get the program's titles and times). Event pictures, staff lists and registrations are kept. API: `POST /api/seed?action=update-events` (admin).
  - **Tech Barangay**: co-organized with JPCS – APC and WordPress Manila (community partner); 7:00 AM–5:00 PM program; ~130 participants; speakers WordPress Manila, AWS SBG-APC Technical Team, Notion Community Leads.
  - **AWS Launchpad: Intro to Cloud and AWS Ecosystem**: May 21, 2026, 1:00 PM, APC Auditorium (12F); ~170; speakers John Lexter Reyes (guest), Rodmina Jhoy Ibe (President), Vince Nelmar Alobin (Technicals Director); program flow.
  - **Mini-Org Fair**: July 10, 2026, 8:00 AM–4:30 PM; ~100.
  - **Org Fair 2026** (re-scheduled): August 17–20, 2026, 7:30 AM–5:00 PM, MPH1; ~200.
  - **AWS Student Community Day Mega Manila 2026**: September 11, 2026, 8:00 AM–6:00 PM; Auditorium (12F), MPH1, Rooms 304 & 306, Room 813; 300–350 participants (no program yet).

---

## [0.6.16] - 2026-10-19

### Added
- **"Your access at this event" on the event page** for officers (and co-organizer staff) an admin put on the staff list: their role, what they may do (*Check people in & approve registrations*, *Approve stamps*) and shortcuts - **Check people in**, **Registrations** and **Stamp requests**, each with the number waiting - straight into the Event Desk for that event. Team members without a duty are told so.

---

## [0.6.15] - 2026-10-19

### Fixed
- **Tech Barangay sessions showing under Cloud Watch**: in the live database the built-in Tech Barangay workshops (WordPress Campus Connect, WordPress on AWS, Notion Productivity) could point at the Cloud Watch event. Admin Home now detects this and offers **Move them** (one tap moves them to the Tech Barangay event; other sessions are untouched). API: `GET /api/seed` reports `misplacedSessions`, `POST /api/seed?action=fix-sessions` (admin).

### Added
- **Event picker in the session editor** (admins): move any session that's under the wrong event.
- **Speakers linked to accounts**: in the event form, each speaker can be linked to an app account (an officer who speaks, or any member). Their name, photo and social links come from their profile and stay up to date; officers get an *AWS SBG-APC officer* label and tapping a speaker opens their profile.
- **Outside speakers**: name, title, bio, photo, **social links** (any platform) and an optional **email** - if they later create an account with that email, the speaker links to it automatically and shows their own links too.

---

## [0.6.14] - 2026-10-19

### Added
- **Adviser account** (role `adviser`, created by an admin - Add account → Role: Adviser, or change the role in Manage Accounts). View-only: an **Adviser dashboard** with officers, upcoming events, open / done-on-time / late tasks, officer tasks (Open · Done · Late) and events with attendance; Events (view only, no Register) and the Leaderboard. No attendee pages; can't edit events, accounts or tasks (server-checked).
- **Announcements to the officers**: the adviser (or an admin) posts a title + message; every officer and admin gets a notification and sees it under *From the adviser* on their Dashboard. Attendees don't. API: `/api/notifications?action=announcements|announce|announcement`.
- **Adviser sign-off ("papirma")**: officers and admins send *Ask the adviser to sign* (what, details, file link); the adviser **Approves** (optional note) or **Returns** with what needs to change; the requester is notified and the record stays (who, when, comment). API: `?action=signoffs|signoff|signoff-review`.
- **Task comments**: admins and the officers assigned can comment on a task (Officer Dashboard and Officer Tasks); the others on the task are notified. API: `POST /api/tasks?action=comment`.
- **Deadlines at a glance**: *N days left* / *Due today* / *Overdue by N days*, and once done *Done on time* or *Done N days late*. Officer Tasks adds *Done on time* and *Overdue / late* counts.
- **Task reminders**: the daily 8:00 AM job sends a notification + email the day before the deadline, and when a task is overdue (then every 3 days until done). In-app reminders are posted even when email isn't set up.

### Fixed
- **Events didn't show on the deployed app**: the Events page loaded each event's registration count with its own request; on Vercel one slow/failed request left the whole list empty. Events now show right away and the counts come from one request (a failure only leaves the counts at 0).
- The event pass (where the certificate is) no longer shows "Outside Attendee" / "APC Student" beside the name.

---

## [0.6.13] - 2026-10-19

### Added
- **Co-organizer staff for co-organized events** (partner orgs that aren't AWS SBG-APC): events get **Co-organizer(s)** (shown as *Co-organized by AWS SBG-APC and …*); an admin marks an attendee account as **Co-organizer staff · <org>** (Add account → *Co-organizer staff for*, or the 🤝 button on any attendee) and puts them on an event's staff list (*Co-organizer* role, check-in pre-ticked). They get only the Event Desk for those events and only their duties' tabs, plus a Dashboard card - no officer features. Server-checked in the stamps and registrations APIs; `partnerOrg` is admin-only.
- **Officers add their own tasks** → *Waiting for approval* → an admin approves (joins the board, counts on the leaderboard) or declines with a reason; both sides are notified. API: `POST /api/tasks?action=propose | review`. Pending tasks can't be marked done.
- **Officer Dashboard request lists by duty**: *Stamp requests* (approve / decline inline) only for stamp-team officers, *Registration & check-in* (approve / decline waiting registrations) only for check-in-team officers.
- **Edit profile** (Profile → Edit profile): name, M.I., student ID or school/organization, personal email, bio and social links; the display name follows. Email / sign-in stays locked.
- **Replay the app tour from your profile picture** (top-bar avatar on phones, sidebar avatar on laptops → *Replay the app tour*).

### Fixed
- **App tour on phones**: the *My Event Pass* step highlighted nothing (it isn't in the bottom bar) - it now points at your profile picture and says *Tap your picture → My Event Pass*. The tour animation is smoother: the highlight box moves with GPU transforms, the pulse ring animates only transform/opacity, and scroll/resize updates are limited to one per frame.
- **Admin saw a stamp-request count with no requests on the Event Desk**: the menu badge counted every event while the desk showed one, and it only refreshed every minute. The badge now counts only what the desk can show, updates right after approving/declining, the event picker shows each event's count, and the desk links to requests waiting at another event.

### Changed
- Officer Dashboard link only for officers (being on an event's staff list no longer shows it). Event Desk tabs follow your duties.
- Server: officer position/committee can only be changed by officers themselves or an admin; profile fields are length-checked; personal email must be valid.

---

## [0.6.12] - 2026-10-18

### Added
- **AWS SBG-APC connection requests**: **Connect** sends a request; the other person gets a notification with **Approve / Decline** and sees it under *Connection requests* on Connect. Sender sees **Requested** (Cancel). Connecting back to someone who already asked you accepts their request. Both get a notice when it's accepted. API: `POST /api/users?action=connect | connect-respond | connect-cancel | disconnect`.
- **Connection count** on every profile and on your Connect card (*N AWS SBG-APC connections*).
- **More social links**: Facebook, Instagram, TikTok, YouTube (plus LinkedIn, GitHub, X, Website) and **custom links** with your own name (up to 10). Pick only the ones you want with **Add a link**.
- **Certificates on Achievements** with View, Download and Copy link.

### Changed
- **Stamp passports moved** off Achievements: they show on the **Dashboard** and the **event page** for live or upcoming events you're registered for that have stamps.
- **My achievements** lists completed things only: stamps earned, events attended, certificates, *My progress* and badges.
- Connections can no longer be written through a profile update; they change only through requests.
- Theme: the purple gradient applies to primary buttons only, so green **Approve** and red buttons keep their colours.

### Fixed
- Connect page quick links showed only LinkedIn and GitHub (Website, X and others were missing); all saved links now show.

---

## [0.6.11] - 2026-10-18

### Added
- **First-time app tour** (skippable): animated highlight boxes and step cards for attendees, officers and admins; remembered on the account (`tutorialSeen`); replay from the profile menu, sidebar or Profile.
- **Registration approval**: status **Pending → Approved / Declined**, set by admins or the event's check-in team in **Event Desk → Attendees** (Approve, Decline, **Approve all**); attendees are notified. API: `POST /api/registrations?action=review`, `PUT …{ rsvp, actorId }`.
- **Sessions editor** on the event page (admins): add, edit and delete sessions, including whether each has a stamp.
- **⭐ Stamps** badge on events with stamp activities; *No stamps at this event* on others.

### Changed
- Attendees can no longer edit their registration status (no Going / Interested / Declined buttons). Older `going` / `interested` records read as Approved / Pending.
- **No cancelling after check-in** (hidden in the app and refused by the server).
- The event pass appears once a registration is approved; checking in at the door also approves.
- Event photos / uploads on the event page are admin-only.
- Sessions API: only admins can add, change or delete sessions; only session fields are stored.
- Event form: the "Officer IDs" text box is gone - officers, roles and duties are set under **Event staff** on the event page.

### Fixed
- **Uploaded event picture didn't show**: pictures now open through the app (`/api/uploads?action=image`, a signed link), so they work with a private S3 bucket; old public S3 links are converted automatically. Without S3, the picture is shrunk to fit the database instead of silently failing, and saving an event shows the real error instead of pretending it saved.
- Speaker **Remove** button overlapped the speaker fields in the event form.
- Removed the "Show only …" button under the leaderboard.
- Sessions from the built-in sample data no longer appear when the live database has none.

---

## [0.6.10] - 2026-10-18

### Changed
- **Certificates unlock after the event ends**, and only for people checked in at it; registered no-shows get none. Check-in now just reserves the **unique certificate code** (checked against existing codes); the PDF is dated the day the event ended.

### Added
- **View**, **Download** and **Copy link** for the certificate on the pass and event page; clear messages before the event ends, when not checked in, and for no-shows.
- **Public certificate link** (`/#/verify/<code>`): anyone with it can view or download the PDF (`GET /api/registrations?action=certificate&certificateId=<code>[&download=1]`); codes from a running event show *Not issued yet*.
- **"Your certificate is ready"** bell notice and email from the daily run, once per event, to everyone who was checked in (the bell notice is posted even without email set up).

---

## [0.6.9] - 2026-10-18

### Added
- **Event Desk** (`/officer/scan`, replaces the Check-in Scanner page): one place per event with tabs **Scan** (QR check-in + booth stamps), **Stamp requests** (approve / decline, with a waiting count) and **Attendees** (check-in list with search, filters, stamps and session picks, one-tap check-in). Opens on a tab/event from links (`?tab=stamps&event=…`). Admin sidebar, Admin Home and the phone bottom bar link to it with the number of stamp requests waiting.
- **Check in & approve**: approve a stamp for someone who isn't checked in yet in one tap (check-in team only).
- **Can't scan? Find the attendee** now lists everyone registered (not checked in first) before you type, so staff can just tap a name; typing narrows the list.

### Changed
- **Stamps are approved after check-in**: the server refuses to approve a stamp until the attendee is checked in to that event (`409 NOT_CHECKED_IN`); the scan result shows *Check in first*.
- The Officer Dashboard no longer approves stamps itself; it shows how many requests are waiting per event and links to the Event Desk.

### Fixed
- Opening a pass link while the Event Desk was on another tab didn't show the scanned attendee.

---

## [0.6.8] - 2026-10-18

### Added
- **Pick your sessions**: the event keeps one expected-participants number; registered attendees tap **I'll attend** on the sessions they'll go to (event page, session page). Each session shows its own real **"N going"** count. API: `PUT /api/registrations?id=` with `{ personId, sessionIds }` (own registration only; only that event's sessions are kept).
- **Event staff list** on the event page (admins): assign officers with a role and tick **Approve stamps** / **Check people in** per officer (roles pre-tick a default: Lead → both, Registration Booth → check-in, Usher → stamps). Officers are notified of new duties; officers can be removed from an event. API: `PUT /api/events?id=…&action=staff` (admin only).
- **Officer duties** on the Officer Dashboard, and a warning on Admin Home for upcoming events with nobody on stamps or check-in.
- **Officer badges**: automatic (First Duty, Stamp Master, Door Keeper, Task Finisher, Content Creator, Event Host, Event Regular) and **admin-awarded** (Best Host, Best in Pubmat, Event MVP, Team Player, Rising Star - optionally per event, with a note). Shown on Achievements, profiles and the admin leaderboard (+20 points each). API: `POST /api/users?action=award|unaward` (admin only).

### Changed
- **Only officers on an event's staff list can approve/decline stamps and check people in** at that event (admins always can). Enforced in `/api/stamps` and `/api/registrations`; the scanner only lists the officer's events and hides buttons they can't use; the stamp queue only shows their events.
- New stamp requests are always *pending* (the server ignores a client-sent `approved`), and `PUT /api/registrations` can no longer set `checkedIn` (check-in only through `action=checkin`).
- Ordinary event edits can't change the duty lists; removing an officer from an event removes their duties.
- Officer leaderboard: +20 per officer badge (all-events view).
- Events with no sessions: the schedule/passport and dashboard say it's one program instead of showing empty or Tech Barangay-specific text.

### Fixed
- Session cards showed a hard-coded **"+15 Going" / "+12 Going"** and a fixed "10 OCT" date on every session.
- Approving or declining a stamp that the server refused looked successful (it fell back to a local copy); the error is now shown.
- The info button on *Select Event* cards was a button inside a button (same bug as the old bookmark); it now sits outside the card's click area.

### Notes
- **No new packages** - `npm install` isn't needed for this update.
- After deploying, set the **Event staff** for upcoming events; until then only admins can approve stamps or check people in.

---

## [0.6.7] - 2026-10-18

### Added
- **Password rules for everyone**: at least 6 characters with a capital letter, a small letter, a number and a special symbol, with a live checklist (sign-up, change password, admin forms); enforced by the server too.
- **Admin "Add account"**: create approved accounts (APC student, outside attendee or officer with position/committee/sub-committee) with a generated temporary password and *Copy login details*. **Reset password** per account. Temporary passwords must be changed at first sign-in (**Set your own password** page; the rest of the app is blocked until then).
- **Change password page** (`/change-password`), linked from the profile menu and Profile.
- **Sub-committees**: Marketing → Creatives, Media; Secretariat → Finance, Documents - at sign-up, in Add account, and in the admin Officers page.
- **"Signed up as …"** on every account in Manage Accounts (type, position, committee, sub-committee).
- **Committee task board**: Officer Tasks grouped by committee with sub-committee filters; tasks have a required deadline (date + time), committee and sub-committee; emails include the committee.
- **Marketing Content Tracker** (pubmats): designee, caption writer, poster, status, post date, file link, notes, draft deadline; assigned officers notified with their role and can update their items from the Officer Dashboard; **caption guidelines** link.
- **Connect**: networking QR now opens a profile summary (bio, all social links, achievements); **Scan QR** in Connect; **Add connection** and **My connections** with their achievements; the other person is notified.
- **Live dashboard** for attendees and officers: Happening now / Up next, At the selected event, Your registrations, Latest updates, Your work (officers).
- **Event pass on the event page** (inline QR) once registered.
- **Save events**: the bookmark icon now saves events to your account; **Events → Saved** tab.
- **Import club events** (admin home): adds the built-in club events missing from the live database.

### Changed
- **Leaderboard is admin-only** (monitoring), with progress bars; attendees and officers see their own progress and badges on Achievements, no rankings.
- **Event status follows the dates**: ended events show under **Past** automatically (fixes past events missing on Vercel). Achievements "Events attended" now counts check-ins.
- `/api/seed` no longer overwrites events: `GET` only reports missing club events, `POST` (admin only) adds just the missing ones.

### Fixed
- **Bookmark icon opened the event instead of saving it** - the button was inside the clickable card (a button inside a button). It now sits outside the card's click area.
- Long titles no longer push cards off the screen on phones (grid columns can shrink).

---

## [0.6.6] - 2026-10-18

### Changed
- **Leaderboard ranks everyone by achievement points**, not only people with approved stamps. Two tabs:
  - **Attendees** (officers included): 10 per approved stamp, +5 for a workshop, 15 per event check-in, 20 per badge (badge points only in the *All events* view).
  - **Officers**: 5 per stamp approved, 5 per attendee checked in, 20 per task completed, 25 per event volunteered for.
  - Each row shows the person's stats; *How points work* explains the scoring; "You're #N of M with X points" for the signed-in user. The podium only shows people with points; the list shows everyone (0 included). Event filter now lists all events.
- **Your standing and My badges moved to the Achievements page** (`MyStandingCard`): rank and points as an attendee, plus as an officer for officers, and the five badges.

---

## [0.6.5] - 2026-10-16

### Added
- **🎯 Approve stamps from the Check-in Scanner**: after scanning a pass, every stamp session of the event is listed with **Approve stamp** (sessions happening now first, marked *Now*; requested ones marked *Requested*). Works whether or not the attendee requested the stamp, updates the passport progress immediately, and notifies the attendee.
- **📜 Certificate verification page** (`/#/verify` and `/#/verify/:id`, public): look up a certificate ID or scan the new **"Scan to verify" QR code** printed on certificates. Shows *Verified*, *No longer valid* (check-in undone) or *Not found*, with only the details printed on the certificate. The pass and event page link to it next to the certificate ID. API: `GET /api/registrations?action=verify&certificateId=`.
- **🏆 Builder Leaderboard & achievement badges** (`/leaderboard`, sidebar + Achievements page): ranking by approved stamps and completed workshops per event or across all events, top-3 podium, *Your standing*, and five badges - First Stamp, Workshop Warrior, Cloud Explorer, Full Passport Complete, Multi-Event Builder.
- **🖼️ Persistent Event Picture Storage & Recent Uploads Database**:
  - Implemented persistent client-side file storage using IndexedDB (`uploadStorageService.ts`) and a serverless DynamoDB endpoint (`/api/uploads`) for all uploaded event pictures, banners, and speaker photos.
  - Added the **Recent Uploads Shelf (`RecentUploadsShelf`)** component in both `EventBuilderPage` and `EventDetailPage`: automatically displays the recent uploads on load with a prominent **"⭐ Recent Upload"** badge, thumbnail previews, file sizes, upload timestamps, 1-click **"Use as Banner"** application, full-screen lightbox preview, and delete controls.
  - Zero-friction upload fallback: if AWS S3 is offline or credentials are not yet set up in local development, pictures are stored directly in local IndexedDB file storage and registered in the database without failing.
- **📅 Synchronized Seed Events & Participant Estimates**:
  - Synchronized all 7 past and upcoming events in both `src/services/seedData.ts` and `api/seed.ts` with accurate expected and estimated participant numbers:
    - *Tech Barangay: AWS x WordPress x Notion* (130 est)
    - *Cloud Watch: Demo Day x Spider-Man: Brand New Day* (30 est)
    - *AWS Student Community Day Mega Manila 2026* (380 est)
    - *Organization Fair 2026* (200 est)
    - *Mini-Org Fair* (100+ expected)
    - *AWS Launchpad: Intro to Cloud and AWS Ecosystem* (170 pax expected)
    - *AWS Launchpad: Core Services* (20 pax)

### Changed
- **🚫 Removed static placeholder images**: Removed hardcoded static asset paths, pre-seeded sample uploads, and Unsplash stock photos across `seedData.ts`, `uploadStorageService.ts`, `EventsPage.tsx`, `EventDetailPage.tsx`, `SessionCard.tsx`, and `EventStampCard.tsx`. Events and sessions without cloud-uploaded pictures now cleanly render a branded **"No image"** placeholder instead of fake static pictures.

### Notes
- **Nothing new to install**: these features use packages already added in v0.6.0 (`qrcode` is now also used on the server for the certificate QR). Run `npm install` only if you haven't since v0.6.0.
- Certificates issued before this version have no QR code; their IDs still verify on the page.

---

## [0.6.2] - 2026-10-16

### Added
- **Local admin authentication auto-sync**: `authService.ts` now automatically injects and syncs the built-in admin account (`awsapc.admin` / `aws.apcofficial@gmail.com`) into browser `localStorage` whenever `VITE_LOCAL_ADMIN_PASSWORD` is configured in `.env.local` or `.env`. Prevents stale local caches from blocking sign-in.
- **Automated commit-msg Git hook**: local hook to ensure commit messages remain clean without unintended co-author lines.

### Changed
- **Environment variables security**: updated `.gitignore` to explicitly ignore `.env` and `.env.*` to prevent secrets from ever being tracked in Git, with safe dummy templates maintained in `.env.example`.
- **Roadmap & feature backlog**: recorded official AWS sender email migration (Amazon SES) as a pending work item in `ROADMAP.md` for instant automated notification delivery (account approvals, decline reasons, event assignments, and daily cron reminders).
- **Repository hygiene**: removed temporary screenshot artifacts and cleaned git history so all commits are solely attributed to the repository owner.

---

## [0.6.1] - 2026-10-16

### Documentation
- **README**: new *What to install on your computer* (Node.js, Git, optional Vercel CLI), a table of every npm package and the version it was added in (v0.6.0 adds `qrcode`, `jsqr`, `pdf-lib`), first-time setup with `.env.local`, *Updating an existing copy* (`git pull` → `npm install`), *What works locally vs. deployed*, and a deployed-app **setup checklist** (Vercel variables, IAM policy including the new `certificates/*` S3 access, Gmail App Password on the right account, S3 CORS, cron, end-to-end test).
- **`.env.example`**: lists `AWS_S3_BUCKET_NAME`, `ADMIN_PASSWORD`, `CRON_SECRET` and `APP_URL`.
- **ARCHITECTURE**: diagram includes the pass, scanner and notification pages, in-app notification table, QR check-in & certificate sequence diagram, `Notification` entity and new registration fields, updated roles.
- **DECISIONS**: ADR-012 (Gmail SMTP + self-contained API functions), ADR-013 (in-app notifications), ADR-014 (QR pass, camera check-in, PDF certificates).

---

## [0.6.0] - 2026-10-16

### Added
- **🔔 In-app notification center + bell badge**: the Notifications page now shows real notifications stored in DynamoDB (`/api/notifications`) instead of sample data - stamp approved / declined, account approved / declined, assigned to an event, new task, checked in, and new sign-ups (sent to every admin). Unread count on the phone top-bar bell and the laptop sidebar; tap to open the related page; *Mark all as read*; remove. Registered events that are live or start within 24 h are pinned on top.
- **🎟️ Attendee digital event pass (`/pass`)** with a personal QR code per registered event, linked from the Dashboard, the event page ("Show my event pass"), the sidebar and the profile menu. The pass refreshes and turns green after check-in.
- **📷 Officer check-in scanner (`/officer/scan`)** for officers and admins: camera QR scanning (back camera on phones), attendee details and stamp passport, **one-tap Check in**, "already checked in by …" on repeat scans, warning when a pass is for a different event, live "checked in" count, and a name / email / student ID search when the camera can't be used. Opened from the Officer Dashboard and an Admin Dashboard card. Scanning a pass with a phone's normal camera app also opens it.
- **🏅 Certificate of participation**: issued automatically at check-in (`pdf-lib`), stored in S3 under `certificates/<eventId>/<certificateId>.pdf`, downloaded through a short-lived signed link from the pass or event page. If S3 isn't configured or the upload fails, check-in still succeeds and the PDF is generated on download / retried on the next scan.
- **📅 Add to Calendar** on the event page, the registration panel and the pass: Google Calendar link (Manila time zone) or `.ics` file (Apple Calendar / Outlook) with venue, session schedule, event link and a 1-hour reminder.

### Changed
- Admin check-in toggle on Attendees & Achievements uses the same check-in flow, so certificates are issued there too.
- `README`: documents the Gmail SMTP option and the App Password rule (must be created on the `GMAIL_USER` account).

---

## [0.5.3] - 2026-10-16

### Fixed
- **Emails not sending after the Gmail switch**: `api/notify.ts` imported `../lib/mail` without a `.js` extension, which fails on Vercel because the project is an ES module (`"type": "module"`), so `/api/notify` crashed before sending. The Gmail (Nodemailer) sender now lives inside `api/notify.ts` like the other self-contained API files. Spaces in `GMAIL_APP_PASSWORD` are ignored, and the club inbox isn't CC'd on emails already addressed to it.

### Changed
- Email now goes through Gmail SMTP when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set (Amazon SES is the fallback). Every user email is CC'd to and replies go to aws.apcofficial@gmail.com.

---

## [0.5.2] - 2026-10-16

### Changed
- **Decline email**: declined sign-ups get an email from the AWS SBG-APC address (`SES_FROM_EMAIL`) with the admin's reason, a "Sign up again" link, and Reply-To set to aws.apcofficial@gmail.com so they can answer directly. Approval emails use the same Reply-To.
- If SES can't send an approval/decline email (for example, SES is still in sandbox mode and the address isn't verified), the admin sees a warning in Manage Accounts explaining why, and the failure is also emailed to aws.apcofficial@gmail.com. Successful sends show who the email went to.

---

## [0.5.1] - 2026-10-16

### Changed
- **Laptop layout**: the sidebar layout now starts at 768px wide (was 900px), so laptops with display scaling no longer get the phone layout with the bottom bar. Page content is centered with a max width on large screens.
- **Wider screens use the space**: Welcome page is a two-column hero; Select Event shows events in 2–3 columns; Profile puts the password card beside the profile; Connect shows About and Social Links side by side; Officer Dashboard shows tasks and stamp requests side by side; Manage Accounts, Attendees and Achievements lists use two columns; Officer Tasks puts the form beside the task list; admins' event pages use the full width; the Event Builder form is wider.
- Phones keep the single-column layout and bottom bar.

### Documentation
- README, ARCHITECTURE, DECISIONS (ADR-009 email/cron, ADR-010 built-in admin, ADR-011 responsive layout) and ROADMAP updated for v0.4.0–v0.5.1: sign-up types, admin approval, notifications, archive batches, deployment variables, phone/laptop layouts.

---

## [0.5.0] - 2026-10-16

### Added
- **Email notifications (Amazon SES, `/api/notify`)**: account approved / declined (with the reason), officer assigned to an event (with their event role), new task, plus a daily 8:00 AM (Manila) Vercel Cron job for "event tomorrow", "see you today" and "task due tomorrow" reminders. Officers receive emails on both their APC and personal email. Admins can also press **Send reminders now** on the Admin Dashboard. Each reminder is sent once; moving an event's date re-arms its reminders.
- **Admin alerts to `aws.apcofficial@gmail.com`**: an email for every new sign-up waiting for approval (with their details and a link to review), and a report when reminder emails fail or the daily job breaks. The `awsapc.admin` account uses this email, so the admin can also sign in with it.
- **Decline reason**: when declining a sign-up, the admin can pick a quick reason (missing name, wrong email, not an APC email, wrong student ID, duplicate) or type one. It's optional, shown to the person when they try to sign in, and included in the email.
- **Archive officers by school-year batch**: archive one officer or **all current officers** at the end of a school year. They become alumni attendees (can still sign in and join events) and their position and committee are kept under **Past batches**.
- **Delete accounts** (admin only, with an inline confirmation) from Manage Accounts and the Officers page.

### Changed
- **Removed all demo accounts** and the demo sign-in panel. The only built-in account is the admin **`awsapc.admin`**, whose password comes from the `ADMIN_PASSWORD` environment variable (deployed) or `VITE_LOCAL_ADMIN_PASSWORD` in `.env.local` (local) - no password is stored in the code.
- `/api/seed` no longer creates sample stamps for demo people.

---

## [0.4.0] - 2026-10-16

### Added
- **Accounts in DynamoDB (`/api/users`)**: Sign up, sign in, profiles and roles are now stored in the database, so every login and device sees the same accounts. Passwords are hashed with scrypt; password hashes are never returned by the API. 
- **Admin approval for every new account**: New sign-ups stay **pending** and cannot sign in until an admin approves them in **Manage Accounts**. Officer sign-ups are approved straight into the officer role; declined people can sign up again with the same email.
- **New sign-up form**:
  - Account type: **APC Student**, **Outside Attendee**, or **Officer**.
  - Full name split into **First Name**, **M.I.** (optional) and **Last Name** (shown as "First M. Last").
  - APC students and officers must use an **APC email** (`@apc.edu.ph` / `@student.apc.edu.ph`) and enter their **APC Student ID**; officers can add an optional **personal email** (e.g. Gmail).
  - Outside attendees can use any email, are **not** asked for a student ID, and are asked for their **school / organization**.
  - Officers pick their **position** in the hierarchy (President → VP Internal → VP External → Directors → Assistant Directors → Associates) and, for Directors / Assistant Directors / Associates, their **committee** (Secretariat, Operations, Marketing, Technicals, Relations).
- **Admin dashboard** (`/home` for admins) with five areas:
  - **Manage Accounts** (`/admin`): pending sign-ups with full details, Approve / Decline, search and role changes.
  - **Edit Events** (`/events`).
  - **Attendees & Achievements** (`/admin/attendees`): per-event attendee list with check-in, plus stamp monitoring per session, the list of people who finished every session, and **Excel (.xlsx) downloads** for profs (summary, finishers, and one sheet per session).
  - **Officers** (`/admin/officers`): officers in hierarchy order with events volunteered (and their event role), stamps approved, and task progress; admins can correct an officer's position / committee; Excel download.
  - **Officer Tasks** (`/admin/tasks`): assign tasks (with optional event and due date) to one or more officers.
- **My Tasks** on the **Officer Dashboard**: officers see tasks assigned to them and can Start / Mark done / Reopen.
- **Registrations, tasks and speakers in DynamoDB**: new `/api/registrations`, `/api/tasks` and `/api/speakers` functions (local fallback in `localStorage` when `/api` is not running).
- **Change password** on the Profile page.

### Changed
- Removed **Continue with Google** from Sign In and Sign Up (APC email is the main login). Sign in accepts an email.
- Profile photo, bio and social links are now saved to the account (they were lost on refresh before), and the photo shows in the header and Connect page.
- Speakers added in the Event Builder (including their photos) are now saved and reloaded when editing an event.
- Only admins see the **Assign an Officer** form on an event page, and the list only offers officers, in hierarchy order with their title.
- Demo account shortcuts on the login page only show in local development.

### Fixed
- **Event times shifting when editing**: the Event Builder showed UTC times in the date/time fields, so each save moved the event by the time-zone offset. It now uses the browser's local time.
- **API safety**: `/api/events`, `/api/sessions` and `/api/stamps` now only read, update or delete records of their own type, so they can't return or overwrite user accounts stored in the same table.

---

## [0.3.1] - 2026-10-16

### Added
- **Circular Avatar Image Adjuster (`AvatarImageAdjuster.tsx`)**:
  - Interactive avatar adjuster featuring a circular viewport preview, pan/drag positioning, zoom slider (1× to 3×), and direct S3 upload via pre-signed URLs.
  - Wired into `ProfilePage.tsx` for updating personal profile avatars with instant preview, change, and remove actions.
  - Wired into `EventBuilderPage.tsx` for speaker headshots with full crop control and instant preview.
- **AWS Cloud Backend & DynamoDB / S3 Serverless API (Vercel)**:
  - **`/api/events`**: GET and POST handlers for live event records in Amazon DynamoDB.
  - **`/api/sessions`**: GET and POST handlers for event session records in DynamoDB.
  - **`/api/stamps`**: GET stamps, POST request stamp, and PUT approve/decline stamp handlers backed by DynamoDB.
  - **`/api/upload-url`**: Generates S3 pre-signed upload URLs for secure direct-to-S3 asset uploads.
  - **`/api/seed`**: Dedicated serverless endpoint for seeding default events, sessions, and stamps into DynamoDB.
  - **`storageService.ts`**: Client-side integration for requesting pre-signed S3 upload URLs and streaming image blobs directly to S3.
  - **Hybrid Service Fallback**: `eventService.ts` and `sessionService.ts` seamlessly communicate with live `/api/*` routes when available, gracefully falling back to `localStorage`.
  - Configured `vercel.json` with SPA routing rewrites and API route declarations.

### Fixed
- **Event Banner Adjuster (`ImageBannerAdjuster.tsx`) – over-zoomed uploads**: Newly uploaded banner images no longer open heavily zoomed in or off-center.
  - The image is now scaled to fit entirely inside the 16:9 frame (contain) and centered by default.
  - Zoom is now a true multiplier that starts at exactly **1×** (fit to frame); the slider ranges from 1× to 3× (or higher when needed to fill the frame).
  - **Reset** returns to 1× and centered.
  - The fit is recalculated when the frame is resized (`ResizeObserver`).
  - The exported 1280×720 banner now uses the same sizing and centering as the on-screen preview, so the upload matches what the user sees.
- **Event banner not updating on the Dashboard**: The selected event is cached in `localStorage`, so the Dashboard kept showing the old banner after an edit.
  - `EventBuilderPage` now updates the cached selected event after **Save Event** when the edited event is the active one.
  - `EventContext` refreshes the cached selected event from the event service on startup.
- **Removing a banner now persists**: The form sends `imageUrl: ''` instead of `undefined`, so the update no longer keeps the old image.

### Changed
- **Minimal banner adjuster UI**: Removed the outlined card wrapper and header (title, instructions line, and duplicate top Cancel button); the adjuster now sits inline in the Event Builder form.
- **Banner flow is now Upload → adjust → Save**: The adjuster button is **"Save"** (with "Saving banner (…%)" progress) instead of "Crop & Upload to S3", and the empty-state button reads **"Upload Image"**.
- **Saved banner preview**: After saving, the Event Builder shows the updated banner as a 16:9 picture with **Change Image**, **Adjust**, and **Remove** actions, instead of reopening the adjuster with another upload button.

---

## [0.3.0] - 2026-10-08

### Added
- **Dynamic Event Details Organization**: Added a prominent purple Organizer block in `EventDetailPage`.
- **Expandable Speakers Lineup**: Implemented a "See more" / "See less" interactive toggle for the speakers list in the event details page.
- **Enhanced Officer Assignment**: 
  - Added dropdown options for assigning event roles (`Creatives`, `Media`, `Lead`, `Host`, `Usher`, `Registration Booth`).
  - Implemented dynamic user dropdown fetching all registered attendees for easy officer assignment.
  - Dynamically displays the assigned custom role underneath the officer's name.

### Changed
- **Admin Events UI Overhaul**: 
  - Removed clutter on the `EventsPage` by hiding the assigned officers list from individual event cards (visible inside event details).
  - Removed "Update" and "Delete" buttons from the event cards list.
- **Global Layout & Responsiveness**: 
  - Enforced strict horizontal boundaries (`maxWidth: 100vw`, `overflowX: hidden`) on `AppLayout.tsx` to fix unintended horizontal scrolling and wrapping glitches on mobile devices.

---

## [0.2.5] - 2026-10-02

### Added
- **Official Event Stamp Passport Component (`EventStampCard.tsx`)**:
  - Automatically computes and renders circular stamp slots for every session requiring completion in the selected event.
  - Added visual circle slot statuses:
    - 🟢 **STAMP APPROVED**: Emerald gradient badge seal with double ring border & officer verification info.
    - 🟠 **PENDING OFFICER APPROVAL**: Amber pulsing indicator badge awaiting officer review.
    - ⚪ **UNCLAIMED**: Dashed star slot with one-tap "Request Stamp" button.
  - Added progress completion percentage bar and "PASSPORT COMPLETED 🎉" banner badge.
- **Integrated Stamp Card**: Embedded `EventStampCard` into both `DashboardPage` and `EventFlowPage`.

### Changed
- Refactored `DashboardPage` to replace basic static progress card with the interactive `EventStampCard`.

---

## [0.2.0] - 2026-10-02

### Added
- **Mobile Bottom Navigation (`BottomNav.tsx`)**: Fixed bottom navigation bar for mobile viewports (`xs`) offering one-tap routing to Events, Connect, Flow, Notifications, and More.
- **Inline Navigation Dropdown**: Replaced mobile temporary drawer overlay with an inline expandable `<Collapse>` menu beneath top app bar.

### Changed
- **Zero-Overlay UI Architecture**: Converted screen-blocking modal dialogs (`Dialog`) into inline collapsible cards.
- **Inline Networking QR Card (`NetworkingCard.tsx`)**: Transformed QR card from a modal popup into an inline card component togglable on `ProfilePage`.
- **Navbar Shape & Layout**: Set `borderRadius: 0` on `MuiAppBar` in `theme.ts` and `AppLayout.tsx` for full-width edge-to-edge header styling without curved floating corners.
- Changed header positioning to `position="sticky"` with title text truncation (`textOverflow: 'ellipsis'`).

---

## [0.1.0] - 2026-10-01

### Added
- **Initial MVP Release**:
  - React 18 + Vite + TypeScript application boilerplate.
  - Material UI (MUI) v6 theme inspired by AWS SBG-APC brand colors.
  - Mock service layer (`authService`, `eventService`, `sessionService`, `speakerService`) with simulated latency.
  - Role-based authentication context (`AuthContext`) supporting `admin`, `officer`, and `attendee` roles.
  - Event Flow schedule page displaying time-grouped sessions.
  - Officer Dashboard for approving/declining stamp requests.
  - Admin Dashboard for user role management.
