param (
    [string]$Name  = "Taha Amine",
    [string]$Email = "taha5.amine@gmail.com",
    [string]$Token = "<YOUR_CIRESON_API_TOKEN>"  # You must inject this securely (from Node or CLI)
)

# === Load SMLets ===
Import-Module SMLets -ErrorAction SilentlyContinue
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" -ErrorAction SilentlyContinue

# === Classes ===
$userClass = Get-SCSMClass -Name 'System.Domain.User'

# === Parse name ===
if ($Name -match '\s') {
    $firstName = $Name.Substring(0, $Name.LastIndexOf(" ")).Trim()
    $lastName  = $Name.Substring($Name.LastIndexOf(" ") + 1).Trim()
} else {
    $firstName = $Name
    $lastName = "Unknown"
}

$displayName = "$lastName,$firstName"
$username    = $Email.Split("@")[0]
$domainAndTLD = $Email.Split("@")[1]

# === Check if user exists ===
$existingUser = Get-SCSMObject -Class $userClass -Filter "UserName -eq '$username' -and Domain -eq '$domainAndTLD'"

if ($existingUser) {
    return @{
        success     = $true
        existing    = $true
        DisplayName = $existingUser.DisplayName
        Id          = $existingUser.Id.Guid
        UPN         = $Email
    } | ConvertTo-Json -Compress
}

# === If not exists → Create via Cireson API ===
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

$portalUrl = "http://ottansm3"
$createUrl = "$portalUrl/api/V3/Projection/Commit"
$createBody = $createPayload | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Token $Token"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $createBody

    @{

        success     = $true
        created     = $true
        Id          = $response.BaseId
        DisplayName = $displayName
        UPN         = $Email
    } | ConvertTo-Json -Compress
}
catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}
