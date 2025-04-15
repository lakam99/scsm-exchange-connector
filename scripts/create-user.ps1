param (
    [string]$Name,
    [string]$Email
)

# Import required modules. Adjust paths if necessary.
Import-Module SMLets -ErrorAction SilentlyContinue
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" -ErrorAction SilentlyContinue

# Retrieve the user class from SCSM
$userClass = Get-SCSMClass -Name 'System.Domain.User'

# Build the property hashtable for the new user.
# Adjust property names as required by your SCSM environment.
$domain = ($Email -split '@')[1]

$properties = @{
    DisplayName = $Name
    Domain      = $domain
    UPN         = $Email
}

try {
    # Attempt to create the new user
    $newUser = New-SCSMObject -Class $userClass -PropertyHashtable $properties -PassThru

    # Prepare a result object with user details.
    $result = @{
        success = $true
        Id = $newUser.Id.Guid
        DisplayName = $newUser.DisplayName
        UPN = $newUser.PrimaryEmail
    }
} catch {
    # Capture and return any errors encountered.
    $result = @{
        success = $false
        error = $_.Exception.Message
    }
}

# Output the result as compressed JSON.
$result | ConvertTo-Json -Compress
