param(
    [string]$TicketId = "SRQ130537",                    # e.g., SRQ130537
  [datetime]$AfterTime = $(Get-Date).AddMinutes(-20)  # default: last 10 minutes
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

try {
    $srq = Get-SCSMObject -Class (Get-SCSMClass -Name "System.WorkItem.ServiceRequest") -Filter "DisplayName -Like '$TicketId*'"
    if (-not $srq) {
        throw "SRQ with ID $TicketId not found."
    }

    $relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasComment"

    $latestComment = Get-SCSMRelatedObject -SMObject $srq -Relationship $relClass |
                     Sort-Object EnteredDate -Descending |
                     Select-Object EnteredDate, EnteredBy, Comment -First 1

    if ($latestComment) {
        @{
            success     = $true
            comment     = $latestComment.Comment
            enteredBy   = $latestComment.EnteredBy
            enteredDate = $latestComment.EnteredDate
        } | ConvertTo-Json -Compress
    } else {
        @{ success = $false; reason = "No comment found on $TicketId" } | ConvertTo-Json -Compress
    }
}
catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}
