# InfraPoint — Module-wise Status

Har module ka asli status: frontend live backend se juda hai ya demo (browser localStorage) hai,
backend bana hai ya nahi, aur test hua ya nahi. Har module complete hone par ye file update hoti hai.

**Last updated:** 3 Nov 2026 (security incident added)

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
| Digital Organizer | `/modules/organizer` | ✅ Complete (Module 7) | Live | ✅ | ✅ 21/21 (real frontend code) | Har login ka data private; "Today" browser ki local date (IST) se |
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
| App Management | `/mdm/app-management` | ✅ Complete (Module 8) | ✅ Windows: inventory, block (5 sec), silent uninstall, EXE/MSI push, usage | ✅ agent 33/33, E2E 54/54 (local + S3), frontend 25/25 | Whitelist (kiosk) mode Windows par enforce nahi; uninstall sirf MSI / QuietUninstallString wale apps; per-user (HKCU) installs inventory mein nahi; installers ISF office server par (fallback S3), max 500 MB; APK = Android agent nahi |
| Content Publishing | `/mdm/content-publishing` | 🔴 Demo only | ❌ | — | Backend + file storage + agent banana hai |
| Groups & Roles | `/mdm/groups-roles` | 🔴 Mock UI | ❌ | — | List-users endpoint chahiye |

## 3. Deploy / pending actions (aapki taraf se)

### 🚨 Security incident (3 Nov 2026) — sabse pehle
Dono repos (`isf-api`, `isf-infra`) mein malware tha, `isf_user` naam se `isf-informatica` GitHub account ke email se commit hua (15 Oct + 21 Oct). Hata diya gaya: isf-api `e956a14`, isf-infra `20e4975`.
- 4 GitHub workflows har push par repo + git history ke secrets `193.32.204.199` par bhejte the ("Security Audit" har push par chala)
- `.vscode/tasks.json` VS Code mein folder kholte hi fake font (`fa-solid-400.woff2` = JavaScript) chalata tha: SSH keys, `~/.aws/credentials`, `.git-credentials`, `.npmrc`, AI tool tokens, env vars churata tha; Linux/macOS par `#ghc2` crontab backdoor

- [ ] `isf-informatica` GitHub account: password badlo, 2FA on, saare Personal Access Tokens / deploy keys / OAuth apps review karke revoke
- [ ] AWS: isf-api ki 5 files wala access key **turant rotate/delete** (ye exfiltrate hua maan ke chalo); naya key sirf DigitalOcean env mein
- [ ] Office server upload key (`FM_ONPREM_API_KEY`, `main.py` mein hardcoded) **rotate karo** — 3 Nov 07:39 UTC push par malware workflows chale the; naya key receiver par aur DigitalOcean env (`ONPREM_API_KEY`) mein, code ka default hatao
- [ ] `EASYREACH_SECRET_KEY` + `LICENSE_CRON_SECRET` DigitalOcean env mein **naye random values** set karo (code ke defaults leak ho chuke; env set na ho to koi bhi admin login token bana sakta hai)
- [ ] Jis bhi developer ne 15 Oct ke baad `isf-api` ya `isf-infra` VS Code mein khola: us machine ke SSH keys, GitHub/npm/AWS/Claude/Gemini tokens rotate; Linux/macOS par `crontab -l` mein `ghc2` line ho to hatao
- [ ] GitHub org settings: Actions ke liye "Require approval for all outside collaborators" + workflow permissions read-only; org ke dusre repos mein bhi `.github/workflows`, `.vscode/tasks.json` check karo
- [ ] Repo ke audit log (GitHub → Settings → Audit log) mein dekho `isf_user` ne aur kya kiya

- [x] `easyreach/main.py` Module 1–7 + money precision + organizer today-date — deployed (2 Nov)
- [ ] Latest `easyreach/main.py` (Module 8 App Management) DigitalOcean par deploy
- [ ] Frontend `main` build karke infrapoint par upload
- [ ] MBSE PCs (IOE-TNPLAB, DESKTOP-QK34H3A) par naya agent ZIP install (Module 8 ke baad wala) — bina iske Policy/Browser/App commands fail dikhayenge
- [ ] DigitalOcean env check: `EASYREACH_SECRET_KEY`, `LICENSE_CRON_SECRET` set hain
- [ ] `yash@isf.com` password change (chat mein share hua tha)
- [ ] 🔴 AWS access key + secret 5 backend files mein hardcoded hai (`ocr_paperchecking`, `aws_upload`, `flipbook`, `isfathena`, `Ebook_genrator`) — key rotate karo, code se hatao, sirf env var use karo
- [x] Uploads ab ISF office server (nginx + upload-receiver) par: Service Desk attachments, visitor photos / ID proofs, issue screenshots, app installers → `C:\MediaStorage\ISF-Infra_Doc\{ServiceDesk,Visitors,Issues,AppPackages}\…` (3 Nov). Purani files jo DigitalOcean disk par thi wo deploy ke saath ja chuki hain
- [ ] Office server nginx: `autoindex off` confirm karo, aur `/ISF-Infra_Doc/` ko sirf backend / agents ke liye restrict karna (abhi URL pata ho to koi bhi file khol sakta hai; file names random 32-hex hain)
- [ ] Office server nginx `client_max_body_size` installers ke liye kam se kam 500M (warna bade EXE/MSI upload par 413)
- [ ] DigitalOcean env (optional): `ONPREM_UPLOAD_URL`, `ONPREM_BASE_URL`, `ONPREM_API_KEY` — set na ho to FortiMates wale `FM_ONPREM_*` use hote hain

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
| 2 Nov 2026 | Module 7: Digital Organizer live; backend `/organizer/today?date=` (IST midnight fix) |
| 3 Nov 2026 | File storage → ISF office server (Service Desk, Visitors, Issues, App installers); S3 sirf fallback |
| 3 Nov 2026 | 🚨 Malware removed from isf-infra (workflows + VS Code auto-run task + fake font), same as isf-api |
| 3 Nov 2026 | Module 8: App Management live — backend + PC agent + frontend (pehla module jiska backend scratch se bana) |
| 2 Nov 2026 | Module 6: Account Manager live; backend money precision bug fix (FLOAT ≈7 digit → DOUBLE, ₹12,34,567.89 pehle ₹12,34,570 save hota tha) |
