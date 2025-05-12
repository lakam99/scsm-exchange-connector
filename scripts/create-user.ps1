param (
    [string]$Name  = "Taha6 Amine",
    [string]$Email = "taha6.amine@gmail.com",
    [string]$Username = "change plz",
    [string]$Password = "change plz",      # 🛑 Replace securely
    [string]$Domain   = "change plz",
    [string]$PortalUrl = "change plz"       # ✅ e.g., http://ottansm3
)

# === Load SMLets ===
Import-Module SMLets -ErrorAction SilentlyContinue
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" -ErrorAction SilentlyContinue

# === Parse name ===
if ($Name -match '\s') {
    $firstName = $Name.Substring(0, $Name.LastIndexOf(" ")).Trim()
    $lastName  = $Name.Substring($Name.LastIndexOf(" ") + 1).Trim()
} else {
    $firstName = $Name
    $lastName = "Unknown"
}

$displayName = "$lastName,$firstName"
$usernamePart = $Email.Split("@")[0]
$domainAndTLD = $Email.Split("@")[1]

# === Step 1: Check if user exists using SMLets ===
$userClass = Get-SCSMClass -Name 'System.Domain.User'
$existingUser = Get-SCSMObject -Class $userClass -Filter "UserName -eq '$usernamePart' -and Domain -eq '$domainAndTLD'"

if ($existingUser) {
    return @{
        success     = $true
        existing    = $true
        DisplayName = $existingUser.DisplayName
        Id          = $existingUser.Id.Guid
        UPN         = $Email
    } | ConvertTo-Json -Compress
}



# === Step 2: Get Cireson API Token using NTLM ===
$tokenUrl = "$PortalUrl/api/V3/Authorization/GetToken"
$tokenBody = @{
    UserName     = "$Domain\$Username"
    Password     = $Password
    LanguageCode = "ENU"
} | ConvertTo-Json -Compress

try {
    $tokenResponse = Invoke-WebRequest -Uri $tokenUrl -Method Post -Body $tokenBody -ContentType "application/json" -UseDefaultCredentials
    $token = ($tokenResponse.Content -replace '"', '')
} catch {
    throw "Failed to get token: $($_.Exception.Message)"
}

# === Step 3: Prepare payload and create user via Cireson API ===
$createPayload = @{
    original = $null
    current = @{
        ClassTypeId        = "10a7f898-e672-ccf3-8881-360bfb6a8f9a"
        Domain             = $domainAndTLD
        DistinguishedName  = "NOTSET"
        TimeAdded          = "0001-01-01T00:00:00.000Z"
        FirstName          = $firstName
        Initials           = ""
        LastName           = $lastName
        DisplayName        = $displayName
        UserName           = [guid]::NewGuid().ToString()
        UPN                = $Email
        StreetAddress      = ""
        City               = ""
        State              = ""
        ZIP                = ""
        Country            = ""
        BusinessPhone      = ""
        Title              = ""
        Department         = ""
        Office             = ""
        Company            = ""
    }
}
$createBody = $createPayload | ConvertTo-Json -Depth 10
$createUrl = "$PortalUrl/api/V3/Projection/Commit"

$headers = @{
    "Authorization" = "Token $token"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $createBody
    return @{
        success     = $true
        created     = $true
        Id          = $response.BaseId
        DisplayName = $displayName
        UPN         = $Email
    } | ConvertTo-Json -Compress
}
catch {
    return @{
        success = $false
        error   = $_.Exception.Message
    } | ConvertTo-Json -Compress
}
