param(
    [string]$Email
)

# Load SMLets if not already loaded
Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null


    $user = Get-SCSMObject -Class (Get-SCSMClass -Name System.Domain.User) | Where-Object { $_.UPN -eq $Email }

    if (-not $user) {
        Write-Output '{"success": true, "deleted": false, "message": "User not found."}'
        exit 0
    }

    Remove-SCSMObject -SMObject $user -Force
    Write-Output '{"success": true, "deleted": true, "message": "User deleted."}'

