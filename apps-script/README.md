# Apps Script API Setup

## 1) Create Script Project
1. Open [script.new](https://script.new).
2. Replace default files with:
- `Code.gs` from this folder
- `appsscript.json` from this folder

## 2) Configure Script Properties
In Apps Script editor:
1. `Project Settings` -> `Script Properties`.
2. Add:
- `SPREADSHEET_ID`: Google Sheet ID to store app data.
- `API_TOKEN`: shared token used by frontend (required for API calls).
- `CALENDAR_ID`: target Google Calendar ID (optional, default is your primary calendar).

If `SPREADSHEET_ID` is missing, API will use active spreadsheet of script project.

## 3) Deploy Web App
1. Click `Deploy` -> `New deployment`.
2. Type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone` (or your selected audience).
5. Deploy and copy Web App URL (ends with `/exec`).

## 4) Frontend Environment
Create `.env.local` in frontend root:

```bash
VITE_GAS_WEB_APP_URL=https://script.google.com/macros/s/xxx/exec
VITE_GAS_API_TOKEN=your_token_here
```

## 5) Quick Health Check
Open:

```text
<WEB_APP_URL>?action=system.health
```

Expected response:
- `success: true`
- `data.status: "ok"`

## 6) Setup Reminder Trigger (1h + 15m)
After deploy, in Apps Script editor run function:

```text
setupReminderTrigger
```

This creates a time-driven trigger every 5 minutes to:
- send reminder once at `<= 60` and `> 15` minutes before due time
- send reminder once at `<= 15` and `> 0` minutes before due time
- auto-mark overdue tasks as `failed` when due time has passed
