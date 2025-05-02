param (
    [string]$Name = "Fred Wilkens",
    [string]$Email = "fred.wilkens@gmail.com"
)

Import-Module SMLets -ErrorAction SilentlyContinue
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" -ErrorAction SilentlyContinue

try {
    $userClass      = Get-SCSMClass -Name 'System.Domain.User'
    $prefClass      = Get-SCSMClass -Name 'System.Notification.Endpoint'
    $relPrefClass   = Get-SCSMRelationshipClass -Name 'System.UserHasPreference'

    # Parse name into first and last
    if ($Name -match '\s') {
        $firstName = $Name.Substring(0, $Name.LastIndexOf(" ")).Trim()
        $lastName  = $Name.Substring($Name.LastIndexOf(" ") + 1).Trim()
    } else {
        $firstName = $Name
        $lastName = "Unknown"
    }

    $username = ($firstName + "_" + $lastName).ToLower()
    $domain = ($Email -split '@')[1]

    $userProps = @{
        UserName    = $username
        Domain      = $domain
        FirstName   = $firstName
        LastName    = $lastName
        DisplayName = "$firstName $lastName"
    }

    $user = New-SCSMObject -Class $userClass -PropertyHashtable $userProps -PassThru
    if (-not $user) { throw "Failed to create user." }

    # Create a Notification Endpoint as the preference
    $pref = New-SCSMObject -Class $prefClass -PropertyHashtable @{
        Id            = [guid]::NewGuid().ToString()
        Description  = "SMTP Endpoint for $($user.DisplayName)"
        TargetAddress = $Email
        ChannelName       = "SMTP"  # Optional: depends on MP config
    } -PassThru

    # Link preference to user
    New-SCSMRelationshipObject -Target $pref -Source $user -Relationship $relPrefClass -Bulk

    @{
        success     = $true
        Id          = $user.Id.Guid
        DisplayName = $user.DisplayName
        UPN         = $Email
        Preference  = $pref.DisplayName
    } | ConvertTo-Json -Compress
}
catch {
    @{
        success = $false
        error   = $_.Exception.Message
    } | ConvertTo-Json -Compress
}
