param (
  [string]$Name,
  [string]$Email
)

$p = @{ComputerName = 'ottansm1'}

# Example: get a user in SCSM by email
$user = Get-SCSMObject -Class (Get-SCSMClass -Name 'System.Domain.User' @p) @p | Where-Object { $_.UPN -eq $Email }

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
