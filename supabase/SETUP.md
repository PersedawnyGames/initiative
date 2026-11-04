# Sprout Night sign-ups: one-time setup

The sign-up page (`sprout.html`) needs a free **Supabase** database with **Discord login**
switched on. You only do this once, and it takes about 20–30 minutes.
Until it's done, the page shows a friendly "sign-ups aren't switched on yet" note.

You'll need: a GitHub login (or email) for Supabase, and your Discord account.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **Start your project** → sign in.
2. **New project**:
   - Name: `initiative`
   - Database password: let it generate one. You won't need it for this.
   - Region: **Central EU (Frankfurt)**, or whatever's closest to the FC.
3. Wait a minute or two for it to finish setting up.

## 2. Create the sign-up table

1. In the left menu open **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this folder, copy **everything**, paste it in, and click **Run**.
3. You should see "Success. No rows returned". That's it. (Running it again later is harmless.)

## 3. Make a Discord app (for "Log in with Discord")

1. In Supabase go to **Authentication → Sign In / Providers → Discord**. Keep this tab open.
   Copy the **Callback URL** it shows. It looks like
   `https://<something>.supabase.co/auth/v1/callback`.
2. In a new tab go to <https://discord.com/developers/applications> → **New Application**.
   Name it `Initiative`. This name is what people see on the Discord login screen.
3. Open **OAuth2** in the left menu:
   - Copy the **Client ID**.
   - Click **Reset Secret** → copy the **Client Secret**.
   - Under **Redirects** click **Add Redirect**, paste the Callback URL from step 1, and **Save Changes**.

## 4. Switch on Discord login in Supabase

1. Back in Supabase → **Authentication → Sign In / Providers → Discord**:
   - Turn on **Enable Sign in with Discord**.
   - Paste the **Client ID** and **Client Secret**.
   - **Save**.
2. Go to **Authentication → URL Configuration**:
   - **Site URL:** `https://initiative.persedawny.dev`
   - **Redirect URLs** → **Add URL:** `https://initiative.persedawny.dev/**`
   - Save.

## 5. Connect the website to the database

1. In Supabase open **Project Settings → API Keys** (on some dashboards it's **Data API / API**).
   Copy:
   - the **Project URL** (`https://<something>.supabase.co`), and
   - the **anon** / **publishable** key.

   ⚠️ **Not** the `service_role` / secret key. That one must never go on the website.
2. Open `assets/js/sprout-config.js` and paste them in:

   ```js
   window.SPROUT_CONFIG = {
     supabaseUrl: 'https://<something>.supabase.co',
     supabaseKey: '<the anon / publishable key>'
   };
   ```

   These two are meant to be public. The database rules are what keep sign-ups safe.

## 6. Publish

Commit and push like any other change to the site:

```
git add .
git commit -m "Add Sprout Night sign-ups"
git push
```

GitHub Pages updates in a minute or so. Then open
<https://initiative.persedawny.dev/sprout.html> and log in with Discord to try it.

## 7. Make yourself a host

Hosts get a **Remove** button on everyone's sign-up (to clear out duplicates or randoms).

1. Log in on the sign-up page once.
2. In Supabase → **Authentication → Users**, find yourself and copy your **User UID**.
3. **SQL Editor → New query**, paste this (with your UID) and **Run**:

   ```sql
   insert into public.sprout_hosts (user_id) values ('PASTE-YOUR-USER-UID-HERE');
   ```

4. Refresh the sign-up page. You'll see a **Host** tag next to your name.

Do the same for any other officer who should be able to tidy up the list.

---

## Day to day

- **New Sprout Night?** Add it to `EVENTS` in `assets/js/data.js` like you already do.
  Any event titled **Sprout Night** gets a sign-up tab automatically. Add a
  `content:` line to show what you're running:

  ```js
  {
    date: '2026-12-02',
    time: '20:00 ST',
    title: 'Sprout Night',
    type: 'Raid',
    content: 'Shadowbringers Extremes',
    detail: '…'
  },
  ```

- **Nights without a plan (the default):** people pick what they'd like to run from
  the "Content we've run before" list (`SPROUT_NIGHT_CONTENT` in `data.js`) and tick the
  mounts they still need from it. The roster shows a vote count per content, plus who
  needs which mount, so you can decide on the night. Add something to that list and
  it becomes a choice automatically.

- **Nights with a set plan:** add a `mounts:` line to a Sprout Night so people can tick the mounts
  they still need from that content. The roster then shows how many people need each one:

  ```js
  mounts: ['hw-extremes'],                        // one set
  mounts: ['arr-extremes', 'palace-of-the-dead'], // or several
  ```

  Sets available (all in `SPROUT_MOUNTS` in `data.js`): `arr-extremes`, `hw-extremes`,
  `sb-extremes`, `shb-extremes`, `ew-extremes`, `dt-extremes`, `palace-of-the-dead`,
  `alexander-savage`. The Binding Coil of Bahamut and normal-mode Alexander drop no mounts.

  *Already ran `setup.sql` before?* Just run it once more after updating. It adds any
  new columns and leaves existing sign-ups alone.

- **See all sign-ups / export them:** Supabase → **Table Editor → sprout_signups**.
- **Past nights** disappear from the page the day after. Their sign-ups stay in the
  database, and people's character and jobs are pre-filled next time from their last sign-up.

## Who can do what

| | Everyone (even logged out) | Logged in with Discord | Hosts |
|---|---|---|---|
| See the roster | ✓ | ✓ | ✓ |
| Sign up / edit / remove **their own** sign-up | | ✓ | ✓ |
| Remove **someone else's** sign-up | | | ✓ |
| Edit someone else's sign-up | | | |

The Discord name shown under each sign-up is filled in by the database from the
person's actual Discord login, so nobody can sign up pretending to be someone else.

## Good to know

- **Free plan pause:** Supabase pauses free projects after about a week with no visits.
  If the page suddenly can't load sign-ups, open your project in Supabase and click
  **Restore**. It's back in a minute and nothing is lost. Regular use of the page keeps it awake.
- **Anyone with a Discord account can sign up**, not only FC members. If a random shows up,
  a host can remove them.
