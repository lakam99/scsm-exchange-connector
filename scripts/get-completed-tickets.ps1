param(
  [string]$area
)

Import-Module SMLets 2>$null

$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest$"
$completedStatus = Get-SCSMEnumeration -Name "ServiceRequestStatusEnum.Completed"

# Filter only completed SRQs
$filter = "Status -eq '$($completedStatus.Id.Guid)'"
$completedSRQs = Get-SCSMObject -Class $srClass -Filter $filter

$result = @()

foreach ($ticket in $completedSRQs) {
  # Match using area in Title or custom field (adjust below as needed)
  $affect = Get-SCSMRelationshipObject -BySource $ticket | Where-Object {
        $_.RelationshipId -eq 'dff9be66-38b0-b6d6-6144-a412a3ebd4ce'
     }
     $useraffect = $affect.TargetObject
     $user = Get-SCSMObject -Id $useraffect.Id.Guid
     
     $hasCompletedNotification = $false
     $rel = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
     $attachments = Get-SCSMRelatedObject -SMObject $ticket -Relationship $rel
     
     foreach ($attachment in $attachments) {
         if ($attachment.DisplayName -eq "CompletedNotification.eml") {
             $hasCompletedNotification = $true
             break
         }
     }

  if ($ticket.Area.DisplayName -like "*$area*") {
    $result += [PSCustomObject]@{
      Id                = $ticket.Id.ToString()
      Title             = $ticket.Title
      Status            = $ticket.Status.DisplayName
      CreatedDate       = $ticket.TimeAdded
      AffectedUser      = $user.DisplayName
      AffectedUserEmail = $user.UPN
      HasCompletedNotification = $hasCompletedNotification
    }
  }
}

@{ success = $result } | ConvertTo-Json -Compress
