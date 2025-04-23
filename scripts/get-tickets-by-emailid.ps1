param(
  [string]$EmailId = "AQQkADAwATMwMAExLTkxYjAtOTEwNy0wMAItMDAKABAA9sMfmhgpZ06mlhmXrymTjQ=="
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

$relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
$attachmentClass = Get-SCSMClass -Name "System.FileAttachment"
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

$tickets = Get-SCSMObject -Class $srClass

$matched = @()
foreach ($ticket in $tickets) {
  $attachments = Get-SCSMRelatedObject -SMObject $ticket -Relationship $relClass | Where-Object { $_.__Class -eq $attachmentClass }
  foreach ($att in $attachments) {
    if ($att.Description -like "*ExchangeConversationID:$EmailId;*") {
      $matched += [PSCustomObject]@{
        Id = $ticket.Id.ToString()
        Title = $ticket.Title
        Status = $ticket.Status
        CreatedDate = $ticket.TimeAdded
      }
    }
  }
}

$matched | ConvertTo-Json -Compress
