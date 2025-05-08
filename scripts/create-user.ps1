param (
    [string]$Name  = "Taha Amine",
    [string]$Email = "taha5.amine@gmail.com"
)

# === Configuration ===
$portalUrl = "http://ottansm3"
$classTypeId = "10a7f898-e672-ccf3-8881-360bfb6a8f9a"  # External User class GUID

# === Parse name ===
if ($Name -match '\s') {
    $firstName = $Name.Substring(0, $Name.LastIndexOf(" ")).Trim()
    $lastName  = $Name.Substring($Name.LastIndexOf(" ") + 1).Trim()
} else {
    $firstName = $Name
    $lastName = "Unknown"
}

$displayName = "$lastName,$firstName"
$userGuid = [guid]::NewGuid().ToString()

# === Headers (add auth if needed) ===
$headers = @{
    "Content-Type" = "application/json"
    # "Authorization" = "Bearer your-token"
}

# === Step 1: Check if user exists by UPN ===
$checkPayload = @{
    Criteria = @{
        CriteriaType = 1
        FilterCriteria = @{
            LeftExpression = @{
                PropertyName = "UPN"
            }
            Operator = 0
            RightExpression = @{
                Value = $Email
            }
        }
    }
    ProjectionType =  "System.User.Preferences.Projection" 
    FullEnumerationRequested = $true
}



$checkUrl = "$portalUrl/api/V3/Projection/GetProjectionByCriteria"
$checkBody = $checkPayload | ConvertTo-Json -Depth 10

try {
    $checkResponse = Invoke-RestMethod -Uri $checkUrl -Method Post -Headers $headers -Body $checkBody -UseDefaultCredentials


    if ($checkResponse.Results.Count -gt 0) {
        # User already exists
        return @{
            success     = $true
            existing    = $true
            DisplayName = $checkResponse.Results[0].DisplayName
            Id          = $checkResponse.Results[0].BaseId
            UPN         = $Email
        } | ConvertTo-Json -Compress
    }
}
catch {
    Write-Host "Failed to check if user exists: $($_.Exception.Message)"
}

# === Step 2: User does not exist → Create it ===
$createPayload = @{
    original = $null
    current = @{
        ClassTypeId        = $classTypeId
        Domain             = "SMInternal"
        DistinguishedName  = "NOTSET"
        TimeAdded          = "0001-01-01T00:00:00.000Z"
        FirstName          = $firstName
        Initials           = ""
        LastName           = $lastName
        DisplayName        = $displayName
        UserName           = $userGuid
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

$createUrl = "$portalUrl/api/V3/Projection/Commit"
$createBody = $createPayload | ConvertTo-Json -Depth 10

try {
    $createResponse = Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $createBody -UseDefaultCredentials


    @{
        success     = $true
        created     = $true
        Id          = $createResponse.BaseId
        DisplayName = $displayName
        UPN         = $Email
    } | ConvertTo-Json -Compress
}
catch {
    @{
        success = $false
        error   = $_.Exception.Message
    } | ConvertTo-Json -Compress
}
