# InfraPoint — Module-wise Status

Har module ka asli status: frontend live backend se juda hai ya demo (browser localStorage) hai,
backend bana hai ya nahi, aur test hua ya nahi. Har module complete hone par ye file update hoti hai.

**Last updated:** 2 Nov 2026

**Legend**
- ✅ **Complete** — frontend live backend se juda, backend tested, (MDM ke liye) asli PC par lagta hai
- 🟡 **Backend ready, frontend demo** — server endpoints bane aur test hue, lekin page abhi localStorage demo data dikhata hai (live par kuch save nahi hota)
- 🟠 **Partial** — kuch hissa live hai, kuch nahi
- 🔴 **Demo only** — backend bana hi nahi, sirf UI demo
- ⚪ **Coming soon** — UI mein sirf card hai

Backend = `isf-api/easyreach/main.py` (DigitalOcean, `/easyreach/...`).
Frontend = `isf-infra/frontend` (infrapoint.co.in).

---

## 1. Home modules

| Module | Route | Status | Frontend | Backend | Tested | Notes |
|---|---|---|---|---|---|---|
| Support / Service Desk | `/support` | ✅ Complete | Live | ✅ | ✅ E2E | Requester → assign → complete → verify flow |
| License Manager | `/license` | ✅ Complete | Live | ✅ | ✅ E2E | Access sirf `yash@isf.com` email (hardcoded allowlist) |
| InfraDC (MDM) | `/mdm` | 🟠 Partial | Mixed | Mixed | — | Category-wise status neeche section 2 mein |
| Visitor Management | `/modules/visitors` | ✅ Complete (Module 3) | Live | ✅ | ✅ 23/23 (real frontend code) | Photo server par upload; "Pass expired" log active visitors se nikalta hai; host email/SMS abhi nahi jaata |
| Issue Manager | `/modules/issues` | ✅ Complete (Module 4) | Live | ✅ | ✅ 22/22 (real frontend code) | Team list = asli active users; screenshots server par (JPG/PNG/WebP, 2 MB, max 6) |
| Asset Manager | `/modules/assets` | ✅ Complete (Module 5) | Live | ✅ | ✅ 24/24 (real frontend code) | Depreciation server par; form preview server formula se match (1 paisa tak) |
| Account Manager | `/modules/accounts` | ✅ Complete (Module 6) | Live | ✅ | ✅ 24/24 (real frontend code) | Next invoice no. server se; duplicate invoice no. blocked; paise ki precision fix (DOUBLE) |
| Digital Organizer | `/modules/organizer` | 🟡 Backend ready, frontend demo | Demo | ✅ | ✅ backend | Wiring baaki |
| Digital Signboard | `/modules/signage` | 🔴 Demo only | Demo | ❌ | — | Backend banana hai |
| InfraDRM | `/modules/drm` | 🔴 Demo only | Demo | ❌ | — | Backend banana hai |
| VAPT | `/modules/vapt` | 🔴 Demo only | Demo | ❌ | — | Mock findings, koi scan nahi hota |
| FortiMates | `/modules/fortimates` | ⚪ Alag project | Alag backend (`FM_API_BASE`) | — | Nahi | Is suite ke backend se alag |
| InfraNet, InfraDMS, InfraCloud, InfraSurveillance, SmartMeters | — | ⚪ Coming soon | — | ❌ | — | Sirf card |

## 2. InfraDC (MDM) — category-wise

| Category | Route | Status | Real device par? | Tested | Notes |
|---|---|---|---|---|---|
| Device Enrollment | `/mdm/enrollment` | ✅ Complete | ✅ Agent ZIP | ✅ | Add/list/delete device, agent installer |
| Remote Device Management | `/mdm/remote-management` | ✅ Complete | ✅ | ✅ | Network/disk/process/system info, restart, shutdown, lock, run script (admin/developer only) |
| Policy Management | `/mdm/policy-management` | ✅ Complete (Module 1) | ✅ Windows: USB, camera, Bluetooth | ✅ 30/30 | Screen lock, Wi-Fi/time fencing, geofence save hote hain par PC par nahi lagte. Android agent nahi hai |
| Secure Browser | `/mdm/secure-browser` | ✅ Complete (Module 2) | ✅ Chrome + Edge policies | ✅ 31/31 | Keywords, kiosk, activity log Windows par nahi chalte (UI mein note hai) |
| Real-Time Reports | `/mdm/reports` | 🟠 Partial | — | — | Sirf school counts (total/active/pending/killed) |
| Data Security & Hardware Restriction | `/schools/1/kill` | 🟠 Partial | ✅ Kill switch | — | School id 1 hardcoded; Level 1 schtasks bug (agent context) pending |
| Geofencing & Location | `/mdm/geofencing` | 🟠 Partial | ❌ | — | Sirf IP-based approx location + manual correction |
| App Management | `/mdm/app-management` | 🔴 Demo only | ❌ | — | Backend + agent dono banana hai |
| Content Publishing | `/mdm/content-publishing` | 🔴 Demo only | ❌ | — | Backend + file storage + agent banana hai |
| Groups & Roles | `/mdm/groups-roles` | 🔴 Mock UI | ❌ | — | List-users endpoint chahiye |

## 3. Deploy / pending actions (aapki taraf se)

- [ ] Latest `easyreach/main.py` (Module 1 + 2 + 3 + money precision fix) DigitalOcean par deploy — pehli start par 16 money columns FLOAT → DOUBLE auto-convert honge (data safe)
- [ ] Frontend `main` build karke infrapoint par upload
- [ ] MBSE PCs (IOE-TNPLAB, DESKTOP-QK34H3A) par naya agent ZIP install — bina iske Policy/Browser push "agent purana hai" fail dikhayega
- [ ] DigitalOcean env check: `EASYREACH_SECRET_KEY`, `LICENSE_CRON_SECRET` set hain
- [ ] `yash@isf.com` password change (chat mein share hua tha)

## 4. Open decisions

- Requester / service_desk roles ab bhi Assets, Accounts, Issues, Visitors, Organizer backend call kar sakte hain (MDM writes ab admin/developer only). Restrict karna hai ya nahi?
- Sidebar mein MDM sabhi roles ko dikhta hai.
- CORS `expose_headers` mein `X-School-Id` nahi hai — Smart Setup ke baad "Open school" button nahi dikhta.

## 5. History

| Date | Kya hua |
|---|---|
| 2 Nov 2026 | Backend security fixes: register/command role check, restore role check, agent token leak, issue delete 500, duplicate invoice, device add 404 |
| 2 Nov 2026 | SmartSetup API path fix; MDM hub + Home par back buttons; logo → all modules |
| 2 Nov 2026 | Module 1: Policy Management live (real PCs) |
| 2 Nov 2026 | Module 2: Secure Browser live (Chrome + Edge) |
| 2 Nov 2026 | Module 3: Visitor Management live (frontend demo → backend) |
| 2 Nov 2026 | Module 4: Issue Manager live (frontend demo → backend, koi backend change nahi) |
| 2 Nov 2026 | Module 5: Asset Manager live (frontend demo → backend, koi backend change nahi) |
| 2 Nov 2026 | Module 6: Account Manager live; backend money precision bug fix (FLOAT ≈7 digit → DOUBLE, ₹12,34,567.89 pehle ₹12,34,570 save hota tha) |
