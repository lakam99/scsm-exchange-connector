# TODO: performance review
param(
  [string]$ConversationId = "AQQkADAwATMwMAExLTkxYjAtOTEwNy0wMAItMDAKABAA9sMfmhgpZ06mlhmXrymTjQ=="
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

# Classes and Relationship
$relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
$attachmentClass = Get-SCSMClass -Name "System.FileAttachment"
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

# Retrieve all SRQs
$tickets = Get-SCSMObject -Class $srClass

$matched = @()

foreach ($ticket in $tickets) {
    # Get only FileAttachments related to this ticket
    $attachments = Get-SCSMRelatedObject -SMObject $ticket -Relationship $relClass | Where-Object { $_.ClassName -ieq $attachmentClass.Name }
    if (!$attachments) { continue } # <-- skip if no attachments
    foreach ($att in $attachments) {
        if ($att.Description -like "*ExchangeConversationID:$ConversationId*") {
            $matched += [PSCustomObject]@{
                Id          = $ticket.Id.ToString()
                Title       = $ticket.Title
                Status      = $ticket.Status
                CreatedDate = $ticket.TimeAdded
            }
        }
    }
}

# Output JSON
$matched | ConvertTo-Json -Compress