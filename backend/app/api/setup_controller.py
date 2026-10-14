from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.school_model import School
from app.models.status_model import SchoolStatus
from app.models.log_model import SchoolLog
from app.api.auth_controller import get_current_user
from app.models.user_model import User
import secrets
import zipfile
import io
import json

router = APIRouter()

class SetupForm(BaseModel):
    # Institution info
    name: str
    code: str
    institution_type: str = "school"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    erp_domain: Optional[str] = None
    db_name: Optional[str] = None

    # Server info
    public_ip: str
    lan_ip: str
    storage_domain: str
    storage_path: str = "D:\\MediaStorage"
    nginx_port: int = 9006
    https_port: int = 9000
    ssl_thumbprint: str
    sync_interval_min: int = 15

    # AWS folders
    aws_folders: List[str] = ["easylearn-ncert", "NCERT Course video", "SAAR"]

    # AWS credentials
    aws_access_key: str
    aws_secret_key: str
    aws_bucket: str = "easylearn1"
    aws_region: str = "eu-north-1"

    # GoDaddy FTP backup
    ftp_host: str = "184.168.118.87"
    ftp_user: Optional[str] = None
    ftp_pass: Optional[str] = None

    # EasyReach API
    easyreach_api: str = "https://easylearn.org.in/mediasync/api"

def gen_nginx_conf(form: SetupForm) -> str:
    root = form.storage_path.replace("\\", "/")
    return f"""worker_processes  1;
events {{ worker_connections 1024; }}
http {{
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;
    server {{
        listen {form.nginx_port};
        root {root};
        autoindex off;
        location / {{
            limit_except GET HEAD OPTIONS {{ deny all; }}
            add_header Accept-Ranges bytes;
            add_header Cache-Control "public, max-age=3600";
            add_header Access-Control-Allow-Origin "*";
            try_files $uri $uri/ =404;
        }}
        location ~* \\.(mp4|webm|avi|mov|mkv)$ {{
            limit_except GET HEAD OPTIONS {{ deny all; }}
            add_header Accept-Ranges bytes;
            add_header Access-Control-Allow-Origin "*";
            mp4;
            mp4_buffer_size 1m;
            mp4_max_buffer_size 5m;
        }}
        location ~* \\.pdf$ {{
            limit_except GET HEAD OPTIONS {{ deny all; }}
            add_header Content-Type application/pdf;
            add_header Accept-Ranges bytes;
            add_header Access-Control-Allow-Origin "*";
            add_header Content-Disposition inline;
        }}
    }}
}}"""

def gen_rclone_conf(form: SetupForm) -> str:
    return f"""[aws-s3]
type = s3
provider = AWS
access_key_id = {form.aws_access_key}
secret_access_key = {form.aws_secret_key}
region = {form.aws_region}

[godaddy-backup]
type = ftp
host = {form.ftp_host}
user = {form.ftp_user or ''}
pass = {form.ftp_pass or ''}"""

def gen_sync_bat(form: SetupForm) -> str:
    sp = form.storage_path
    lines = [
        "@echo off",
        f"echo ======================================== >> {sp}\\sync_log.txt",
        f"echo Sync Started: %date% %time% >> {sp}\\sync_log.txt",
        ""
    ]
    for folder in form.aws_folders:
        lines += [
            f"REM {folder}",
            f'D:\\EasyReach\\rclone.exe --config "D:\\EasyReach\\rclone.conf" sync "aws-s3:{form.aws_bucket}/{folder}" "{sp}\\{folder}" --log-file={sp}\\sync_log.txt --log-level INFO --transfers 5 --retries 3',
            ""
        ]
    lines.append(f"echo Sync Complete: %date% %time% >> {sp}\\sync_log.txt")
    return "\n".join(lines)

def gen_backup_bat(form: SetupForm) -> str:
    sp = form.storage_path
    return f"""@echo off
echo ======================================== >> {sp}\\backup_log.txt
echo Backup Started: %date% %time% >> {sp}\\backup_log.txt
D:\\EasyReach\\rclone.exe --config "D:\\EasyReach\\rclone.conf" copy "{sp}" "godaddy-backup:/" ^
  --log-file={sp}\\backup_log.txt ^
  --log-level INFO ^
  --transfers 3 ^
  --tpslimit 2 ^
  --retries 10 ^
  --retries-sleep 30s
echo Backup Complete: %date% %time% >> {sp}\\backup_log.txt"""

def gen_web_config(form: SetupForm) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <proxy enabled="true" />
    <rewrite>
      <rules>
        <rule name="Nginx Proxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:{form.nginx_port}/{{R:1}}" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <verbs>
          <add verb="GET" allowed="true" />
          <add verb="HEAD" allowed="true" />
          <add verb="OPTIONS" allowed="true" />
        </verbs>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>"""

def gen_master_installer(form: SetupForm, agent_token: str, school_id: int) -> str:
    sp = form.storage_path
    folders_ps = "\n".join([f'    New-Item -ItemType Directory -Force -Path "{sp}\\{f}"' for f in form.aws_folders])

    return f"""# ============================================================
# EasyReach Master Installer
# Institution: {form.name} ({form.code})
# Generated by ISF Analytica & Informatica Pvt. Ltd.
# ============================================================
# Run as Administrator in PowerShell:
# PowerShell -ExecutionPolicy Bypass -File install.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$InstallPath = "D:\\EasyReach"
$StoragePath = "{sp}"
$NginxPort = {form.nginx_port}
$HttpsPort = {form.https_port}
$AgentToken = "{agent_token}"
$SchoolId = {school_id}
$EasyReachAPI = "{form.easyreach_api}"
$Domain = "{form.storage_domain}"
$SslThumbprint = "{form.ssl_thumbprint}"

function Write-Step {{ param($msg) Write-Host "`n[$([DateTime]::Now.ToString('HH:mm:ss'))] $msg" -ForegroundColor Cyan }}
function Write-OK {{ param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }}
function Write-ERR {{ param($msg) Write-Host "  ERROR: $msg" -ForegroundColor Red }}

Write-Host "============================================================" -ForegroundColor Blue
Write-Host "  EasyReach Setup - {form.name}" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Blue

# ============================================================
# STEP 1: Create folders
# ============================================================
Write-Step "Creating storage folders..."
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path $StoragePath | Out-Null
{folders_ps}
New-Item -ItemType Directory -Force -Path "D:\\nginx" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\\nginx\\conf" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\\nginx\\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\\nginx\\temp" | Out-Null
Write-OK "Folders created"

# ============================================================
# STEP 2: Download Nginx
# ============================================================
Write-Step "Downloading Nginx..."
if (-not (Test-Path "D:\\nginx\\nginx.exe")) {{
    try {{
        Invoke-WebRequest -Uri "https://nginx.org/download/nginx-1.26.2.zip" -OutFile "$InstallPath\\nginx.zip"
        Expand-Archive -Path "$InstallPath\\nginx.zip" -DestinationPath "$InstallPath\\nginx_temp" -Force
        Copy-Item "$InstallPath\\nginx_temp\\nginx-1.26.2\\*" "D:\\nginx\\" -Recurse -Force
        Remove-Item "$InstallPath\\nginx.zip" -Force
        Remove-Item "$InstallPath\\nginx_temp" -Recurse -Force
        Write-OK "Nginx downloaded and extracted"
    }} catch {{
        Write-ERR "Could not download Nginx. Copy nginx.exe manually to D:\\nginx\\"
    }}
}} else {{
    Write-OK "Nginx already installed"
}}

# ============================================================
# STEP 3: Download rclone
# ============================================================
Write-Step "Downloading rclone..."
if (-not (Test-Path "$InstallPath\\rclone.exe")) {{
    try {{
        Invoke-WebRequest -Uri "https://downloads.rclone.org/rclone-current-windows-amd64.zip" -OutFile "$InstallPath\\rclone.zip"
        Expand-Archive -Path "$InstallPath\\rclone.zip" -DestinationPath "$InstallPath\\rclone_temp" -Force
        $rcloneExe = Get-ChildItem "$InstallPath\\rclone_temp" -Recurse -Filter "rclone.exe" | Select-Object -First 1
        Copy-Item $rcloneExe.FullName "$InstallPath\\rclone.exe" -Force
        Remove-Item "$InstallPath\\rclone.zip" -Force
        Remove-Item "$InstallPath\\rclone_temp" -Recurse -Force
        Write-OK "rclone downloaded"
    }} catch {{
        Write-ERR "Could not download rclone. Copy rclone.exe manually to $InstallPath\\"
    }}
}} else {{
    Write-OK "rclone already installed"
}}

# ============================================================
# STEP 4: Copy config files
# ============================================================
Write-Step "Copying config files..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$scriptDir\\nginx.conf" "D:\\nginx\\conf\\nginx.conf" -Force
Copy-Item "$scriptDir\\rclone.conf" "$InstallPath\\rclone.conf" -Force
Copy-Item "$scriptDir\\sync_aws.bat" "$StoragePath\\sync_aws.bat" -Force
Copy-Item "$scriptDir\\backup.bat" "$InstallPath\\backup.bat" -Force
Write-OK "Config files copied"

# ============================================================
# STEP 5: Setup IIS
# ============================================================
Write-Step "Setting up IIS..."
try {{
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    $iisPath = "C:\\inetpub\\nginx-proxy"
    New-Item -ItemType Directory -Force -Path $iisPath | Out-Null
    Copy-Item "$scriptDir\\web.config" "$iisPath\\web.config" -Force

    if (-not (Get-Website -Name "Nginx-Media" -ErrorAction SilentlyContinue)) {{
        New-WebAppPool -Name "Nginx-Media" -ErrorAction SilentlyContinue
        New-Website -Name "Nginx-Media" -PhysicalPath $iisPath -Port $HttpsPort -Force
        Set-ItemProperty "IIS:\\Sites\\Nginx-Media" -Name applicationPool -Value "Nginx-Media"
    }}

    # HTTPS binding
    New-WebBinding -Name "Nginx-Media" -Protocol "https" -Port $HttpsPort -HostHeader $Domain -SslFlags 1 -ErrorAction SilentlyContinue

    # SSL cert
    $guid = [guid]::NewGuid().ToString("B")
    netsh http delete sslcert hostnameport="${{Domain}}:${{HttpsPort}}" 2>$null
    netsh http add sslcert hostnameport="${{Domain}}:${{HttpsPort}}" certhash=$SslThumbprint appid="$guid" certstorename=MY

    iisreset /noforce | Out-Null
    Start-Website -Name "Nginx-Media" -ErrorAction SilentlyContinue
    Write-OK "IIS configured"
}} catch {{
    Write-ERR "IIS setup failed: $($_.Exception.Message). Configure manually."
}}

# ============================================================
# STEP 6: Windows Firewall rules
# ============================================================
Write-Step "Adding firewall rules..."
New-NetFirewallRule -DisplayName "EasyReach Nginx $NginxPort" -Direction Inbound -Protocol TCP -LocalPort $NginxPort -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "EasyReach HTTPS $HttpsPort" -Direction Inbound -Protocol TCP -LocalPort $HttpsPort -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-OK "Firewall rules added"

# ============================================================
# STEP 7: Start Nginx
# ============================================================
Write-Step "Starting Nginx..."
try {{
    & "D:\\nginx\\nginx.exe" -p "D:\\nginx" -t
    & "D:\\nginx\\nginx.exe" -p "D:\\nginx"
    Start-Sleep -Seconds 2
    $nginxRunning = (netstat -ano | Select-String ":$NginxPort").Count -gt 0
    if ($nginxRunning) {{ Write-OK "Nginx running on port $NginxPort" }}
    else {{ Write-ERR "Nginx may not be running. Check D:\\nginx\\logs\\error.log" }}
}} catch {{
    Write-ERR "Could not start Nginx: $($_.Exception.Message)"
}}

# ============================================================
# STEP 8: Setup Task Scheduler
# ============================================================
Write-Step "Setting up scheduled tasks..."
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

# Nginx auto-start
$a1 = New-ScheduledTaskAction -Execute "D:\\nginx\\nginx.exe" -Argument "-p D:\\nginx" -WorkingDirectory "D:\\nginx"
$t1 = New-ScheduledTaskTrigger -AtStartup
$s1 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName "EasyReach-Nginx" -Action $a1 -Trigger $t1 -Principal $principal -Settings $s1 -Force | Out-Null
$task1 = Get-ScheduledTask -TaskName "EasyReach-Nginx"
$task1.Triggers[0].Delay = "PT2M"
Set-ScheduledTask -InputObject $task1 | Out-Null

# AWS Sync every {form.sync_interval_min} min
$a2 = New-ScheduledTaskAction -Execute "$StoragePath\\sync_aws.bat"
$t2 = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes {form.sync_interval_min}) -Once -At (Get-Date)
$s2 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes {form.sync_interval_min - 1})
Register-ScheduledTask -TaskName "EasyReach-Sync" -Action $a2 -Trigger $t2 -Principal $principal -Settings $s2 -Force | Out-Null

# Backup AM
$a3 = New-ScheduledTaskAction -Execute "$InstallPath\\backup.bat"
$t3 = New-ScheduledTaskTrigger -Daily -At "2:00AM"
Register-ScheduledTask -TaskName "EasyReach-Backup-AM" -Action $a3 -Trigger $t3 -Principal $principal -Force | Out-Null

# Backup PM
$t4 = New-ScheduledTaskTrigger -Daily -At "2:00PM"
Register-ScheduledTask -TaskName "EasyReach-Backup-PM" -Action $a3 -Trigger $t4 -Principal $principal -Force | Out-Null

Write-OK "Scheduled tasks created"

# ============================================================
# STEP 9: First AWS Sync
# ============================================================
Write-Step "Running first AWS sync (this may take a while)..."
try {{
    & "$StoragePath\\sync_aws.bat"
    Write-OK "First sync complete"
}} catch {{
    Write-ERR "Sync failed. Run manually: $StoragePath\\sync_aws.bat"
}}

# ============================================================
# STEP 10: Register with EasyReach Dashboard
# ============================================================
Write-Step "Registering with EasyReach dashboard..."
try {{
    $body = @{{
        school_id = $SchoolId
        token = $AgentToken
        nginx_running = 1
        storage_used_gb = 0
        file_count = 0
    }} | ConvertTo-Json

    Invoke-RestMethod -Uri "$EasyReachAPI/status/ping" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-OK "Registered with EasyReach dashboard"
}} catch {{
    Write-ERR "Could not reach EasyReach API. Will retry automatically."
}}

# ============================================================
# DONE!
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Institution: {form.name}" -ForegroundColor White
Write-Host "  Storage: $StoragePath" -ForegroundColor White
Write-Host "  Nginx: http://localhost:$NginxPort" -ForegroundColor White
Write-Host "  Public: https://{form.storage_domain}:$HttpsPort" -ForegroundColor White
Write-Host "" 
Write-Host "  Test URL:" -ForegroundColor Yellow
Write-Host "  https://{form.storage_domain}:{form.https_port}/easylearn-ncert/..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Check EasyReach dashboard for live status." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Read-Host "Press Enter to exit"
"""

@router.post("/generate-setup")
def generate_setup(
    form: SetupForm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if institution already exists
    existing = db.query(School).filter(School.code == form.code).first()
    if existing:
        school = existing
        agent_token = school.agent_token
    else:
        # Create institution in DB
        agent_token = secrets.token_hex(32)
        school = School(
            name=form.name,
            code=form.code,
            institution_type=form.institution_type,
            contact_name=form.contact_name,
            contact_email=form.contact_email,
            erp_domain=form.erp_domain,
            storage_domain=form.storage_domain,
            public_ip=form.public_ip,
            lan_ip=form.lan_ip,
            storage_path=form.storage_path,
            nginx_port=form.nginx_port,
            https_port=form.https_port,
            ssl_thumbprint=form.ssl_thumbprint,
            sync_interval_min=form.sync_interval_min,
            agent_token=agent_token,
            db_name=form.db_name,
            status="pending"
        )
        db.add(school)
        db.commit()
        db.refresh(school)

        status = SchoolStatus(school_id=school.id)
        db.add(status)
        log = SchoolLog(school_id=school.id, log_type="info", message=f"Setup ZIP generated for {school.name}")
        db.add(log)
        db.commit()

    # Generate config.json
    config_json = {
        "school_id": school.id,
        "name": form.name,
        "code": form.code,
        "institution_type": form.institution_type,
        "public_ip": form.public_ip,
        "lan_ip": form.lan_ip,
        "storage_domain": form.storage_domain,
        "storage_path": form.storage_path,
        "nginx_port": form.nginx_port,
        "https_port": form.https_port,
        "sync_interval_min": form.sync_interval_min,
        "aws_folders": form.aws_folders,
        "easyreach_api": form.easyreach_api,
        "agent_token": agent_token
    }

    # Build ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("install.ps1", gen_master_installer(form, agent_token, school.id))
        zf.writestr("nginx.conf", gen_nginx_conf(form))
        zf.writestr("rclone.conf", gen_rclone_conf(form))
        zf.writestr("sync_aws.bat", gen_sync_bat(form))
        zf.writestr("backup.bat", gen_backup_bat(form))
        zf.writestr("web.config", gen_web_config(form))
        zf.writestr("config.json", json.dumps(config_json, indent=2))

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=easyreach_{form.code}_setup.zip"}
    )