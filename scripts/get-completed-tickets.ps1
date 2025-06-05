param(
  [string]$templateName = "Post Awards Reconciliation Template SRQ",
  [string]$srqtitle ='bonjour'
)

Import-Module SMLets 2>$null

$srClass = Get-SCSMClass -Name 'System.WorkItem.ServiceRequest$'
$completedStatus = Get-SCSMEnumeration -Name "ServiceRequestStatusEnum.Completed"

# Get all Service Requests
$serviceRequests = Get-SCSMObject -Class $srClass -Filter ""


# Filter Service Requests by SupportGroup and CreatedDate
$ticketsFiltered = $serviceRequests | Where-Object {
    $_.SupportGroup -and (
        $_.SupportGroup.DisplayName -like "*Reconciliation*" -or
        $_.SupportGroup.DisplayName -like "*Grants*" -or
        $_.SupportGroup.DisplayName -like "*Scolorships*" -or
        $_.SupportGroup.DisplayName -like "*Use*"
    )
}
$tickets = Get-SCSMObject -Class $srClass | Where-Object {
  $_.TemplateName -eq $templateName -and $_.Status.Id -eq $completedStatus.Id.Guid
}

$result = @()

foreach ($ticket in $tickets) {
  $result += [PSCustomObject]@{
    Id          = $ticket.Id.ToString()
    Title       = $ticket.Title
    Status      = $ticket.Status.DisplayName
    CreatedDate = $ticket.TimeAdded
    AffectedUser = $ticket.AffectedUser.DisplayName
    AffectedUserEmail = $ticket.AffectedUser.UserName  # assuming it's the UPN/email
  }
}

@{ success = $result } | ConvertTo-Json -Compress
