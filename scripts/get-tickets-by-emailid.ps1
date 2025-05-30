# TODO: performance review
param(
    #[string]$conversationId,
    [string]$srqtitle
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

# Classes and Relationship
$relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
$attachmentClass = Get-SCSMClass -Name "System.FileAttachment"
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

# Get target ticket(s)
$tickets = if ($srqtitle) {
    $escaped = [Regex]::Escape($srqtitle)
    Get-SCSMObject -Class $srClass | Where-Object { $_.Title -match $escaped }
} else {
    Get-SCSMObject -Class $srClass
}

$matched = @()

foreach ($ticket in $tickets) {
    $attachments = Get-SCSMRelatedObject -SMObject $ticket -Relationship $relClass | Where-Object {
        $_.ClassName -ieq $attachmentClass.Name
    }

    if (!$attachments) { continue }

    foreach ($att in $attachments) {
        if ($att.DisplayName -like "$srqtitle") {
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
