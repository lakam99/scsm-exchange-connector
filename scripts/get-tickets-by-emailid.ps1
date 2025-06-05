#performance improved by filter using the title instead of getting all srqs
param(
    [string]$conversationId='AQQkADAwATM3ZmYBLTkyYzQtYmVkMi0wMAItMDAKABAA937TOesFIkOlHknZM0_Ppw==',
    [string]$srqtitle ='[TEST-1749061622349] E2E Ticket Creation'

)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

# Classes and Relationship
$relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
$attachmentClass = Get-SCSMClass -Name "System.FileAttachment"
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

# Get target ticket(s)
if ($srqtitle) {
    $filter = "Title -eq '$srqtitle'"
    $tickets = Get-SCSMObject -Class $srClass -Filter $filter
}

$matched = @()

foreach ($ticket in $tickets) {
    $attachments = Get-SCSMRelatedObject -SMObject $ticket -Relationship $relClass | Where-Object {
        $_.ClassName -ieq $attachmentClass.Name
    }

    if (!$attachments) { continue }

    foreach ($att in $attachments) {
        if (-not $att.Description) { continue }  # Skip if Description is null or empty
        $desc = $att.Description.TrimEnd(';')
        $conv = $conversationId.TrimEnd(';')
        $escapedId = [Regex]::Escape("ExchangeConversationID:$conv")
        if ($desc -match $escapedId) {
        
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
@{ success = $matched } | ConvertTo-Json -Compress
