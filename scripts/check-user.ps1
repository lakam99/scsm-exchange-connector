param (
    [string]$Name ,
    [string]$Email
)

# === Load SMLets ===
Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null
# === Load SMLets if not already loaded ===

$usernamePart = $Email.Split("@")[0]

# === Step 1: Check if user exists using SMLets ===
$userClass = Get-SCSMClass -Name 'System.Domain.User'
$existingUser = Get-SCSMObject -Class $userClass | Where-Object { $_.UPN -eq $Email }

if ($existingUser) {
    $result = @{
        success     = $true
        existing    = $true
        DisplayName = $existingUser.DisplayName
        Id          = $existingUser.Id.Guid
        UPN         = $Email
    } | ConvertTo-Json -Compress
} else {
    
        $result = @{}
}  
      
      $result | ConvertTo-Json -Compress      

