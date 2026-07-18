$base = "http://localhost:5000"

# Wait for backend health endpoint
function Wait-Backend {
  $maxAttempts = 30
  $delay = 2
  for ($i=0;$i -lt $maxAttempts;$i++) {
    try {
      $resp = Invoke-RestMethod -Method Get -Uri "$base/health" -TimeoutSec 5 -ErrorAction Stop
      if ($resp.status -eq 'ok') { Write-Host "Backend is up"; return }
    } catch { }
    Start-Sleep -Seconds $delay
  }
  Write-Error "Backend did not become ready in time"
  exit 1
}
Wait-Backend

# Helper to generate a unique 11‑digit phone number for testing
function New-PhoneNumber {
  # Generate a random 7‑digit number to avoid collisions
  $rand = Get-Random -Minimum 1000000 -Maximum 9999999
  return "0170" + $rand
}

# Reset the database (development only)
Write-Host "--- Resetting database (dev endpoint) ---"
Invoke-RestMethod -Method Post -Uri "$base/reset" -ErrorAction Stop | Out-Null

# ---------- Worker ----------
$workerPhone = New-PhoneNumber
$workerData = @{
    name = "Rahim"
    phone = $workerPhone
    password = "password123"
    user_type = "Worker"
    service_type = "Cleaner"
    experience_years = 5
    hourly_rate = 100
    latitude = 23.7465
    longitude = 90.3760
}

Write-Host "Registering Worker ($workerPhone)..."
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -Body ($workerData | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop | Out-Null

$workerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Write-Host "Logging in Worker..."
Invoke-RestMethod -Method Post -Uri "$base/auth/login" -Body (@{phone=$workerPhone; password='password123'} | ConvertTo-Json) -ContentType "application/json" -WebSession $workerSession -ErrorAction Stop | Out-Null

Write-Host "Setting Worker availability ON..."
Invoke-RestMethod -Method Post -Uri "$base/worker/availability" -Body (@{availability=$true} | ConvertTo-Json) -ContentType "application/json" -WebSession $workerSession -ErrorAction Stop | Out-Null

# ---------- Customer ----------
$customerPhone = New-PhoneNumber
# Ensure the customer phone differs from the worker phone
while ($customerPhone -eq $workerPhone) {
  $customerPhone = New-PhoneNumber
}
$customerData = @{
    name = "Karim"
    phone = $customerPhone
    password = "password123"
    user_type = "Customer"
    latitude = 23.7460
    longitude = 90.3760
}

Write-Host "Registering Customer ($customerPhone)..."
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -Body ($customerData | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop | Out-Null

$customerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Write-Host "Logging in Customer..."
Invoke-RestMethod -Method Post -Uri "$base/auth/login" -Body (@{phone=$customerPhone; password='password123'} | ConvertTo-Json) -ContentType "application/json" -WebSession $customerSession -ErrorAction Stop | Out-Null

# Create Job Request
$jobPayload = @{
    service_type = "Cleaner"
    latitude = 23.7460
    longitude = 90.3760
    scheduled_time = "Tomorrow 9:00 AM"
    description = "Need cleaning after moving"
}
Write-Host "Creating Job Request..."
$jobResp = Invoke-RestMethod -Method Post -Uri "$base/customer/jobs" -Body ($jobPayload | ConvertTo-Json) -ContentType "application/json" -WebSession $customerSession -ErrorAction Stop
$jobId = $jobResp.jobId
Write-Host "Job created with ID: $jobId"

# Trigger Matching
Write-Host "Running Matching Engine..."
$matchResp = Invoke-RestMethod -Method Post -Uri "$base/customer/match/$jobId" -WebSession $customerSession -ErrorAction Stop
Write-Host "Matched Workers: $($matchResp.matchedCount)"

# ---------- Worker accepts ----------
Write-Host "Fetching Worker notifications..."
$notifications = Invoke-RestMethod -Method Get -Uri "$base/worker/notifications" -WebSession $workerSession -ErrorAction Stop
# Find the first pending (sent) notification
$notif = $notifications | Where-Object { $_.status -eq 'sent' } | Select-Object -First 1
if (-not $notif) {
    Write-Error "No pending (sent) notification found for worker."
    exit 1
}
$notifId = $notif.id
Write-Host "Accepting notification ID: $notifId"
Invoke-RestMethod -Method Post -Uri "$base/worker/notifications/$notifId/accept" -WebSession $workerSession -ErrorAction Stop | Out-Null

# Verify Booking on Worker side
Write-Host "Fetching Worker bookings..."
$workerJobs = Invoke-RestMethod -Method Get -Uri "$base/worker/my-jobs" -WebSession $workerSession -ErrorAction Stop
if ($workerJobs.Count -eq 0) {
    Write-Error "Booking not created!"
    exit 1
}
Write-Host "--- Test Flow Completed Successfully ---"
$workerJobs | Format-Table -AutoSize
