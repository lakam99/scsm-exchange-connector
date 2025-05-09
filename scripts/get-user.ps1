param (
  [string]$Name,
  [string]$Email
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

# Example: get a user in SCSM by email
$user = Get-SCSMObject -Class (Get-SCSMClass -Name 'System.Domain.User' ) | Where-Object { $_.UPN -eq $Email }

# Return simplified user object
if ($user) {
  $result = @{
    Id = $user.Id.Guid
    DisplayName = $user.DisplayName
    UPN = $user.UPN
  }
} else {
  $result = @{}
}

$result | ConvertTo-Json -Compress
