param(
  [string]$TicketId = "SRQ130667",
  [string]$EmailMimePath = "C:\Users\scsmAdmin\Documents\scsm-exchange-connector\tests\temp\test-1744751298029.eml"
)

Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

try {
    $srq = Get-SCSMObject -Class (Get-SCSMClass -Name "System.WorkItem.ServiceRequest") -Filter "DisplayName -Like '$TicketId*'"
    if (-not $srq) { throw "SRQ with ID $TicketId not found." }    

  $fileAttachmentClass = Get-SCSMClass -Name "System.FileAttachment"
  $attachmentRelClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"
  $managementGroup = New-Object Microsoft.EnterpriseManagement.EnterpriseManagementGroup "Ottansm1"
  $commentClass = Get-SCSMClass -Name "System.WorkItem.TroubleTicket.AnalystCommentLog"
  $relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasComment"   

 # Remove existing .eml attachments
    $existingAttachments = Get-SCSMRelatedObject -SMObject $srq -Relationship $attachmentRelClass |
          Where-Object { $_.Extension -eq ".eml" }
    
    foreach ($existing in $existingAttachments) {
            Remove-SCSMObject -SMObject $existing -Force
        }

  $bytes = [System.IO.File]::ReadAllBytes($EmailMimePath)
  $stream = New-Object System.IO.MemoryStream
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Seek(0, 'Begin') | Out-Null

  $attachment = New-Object Microsoft.EnterpriseManagement.Common.CreatableEnterpriseManagementObject($managementGroup, $fileAttachmentClass)
  $attachment.Item($fileAttachmentClass, "Id").Value = [Guid]::NewGuid().ToString()
  $attachment.Item($fileAttachmentClass, "DisplayName").Value = [System.IO.Path]::GetFileName($EmailMimePath)
  $attachment.Item($fileAttachmentClass, "Extension").Value = ".eml"
  $attachment.Item($fileAttachmentClass, "Size").Value = $bytes.Length
  $attachment.Item($fileAttachmentClass, "AddedDate").Value = (Get-Date).ToUniversalTime()
  $attachment.Item($fileAttachmentClass, "Content").Value = $stream
  $attachment.Item($fileAttachmentClass, "Description").Value = "Appended email update via API"

  $comment = New-Object Microsoft.EnterpriseManagement.Common.CreatableEnterpriseManagementObject($managementGroup, $commentClass)
  $comment[$commentClass, "Id"].Value          = [Guid]::NewGuid().ToString()
  $comment[$commentClass, "EnteredDate"].Value = (Get-Date).ToUniversalTime()
  $comment[$commentClass, "EnteredBy"].Value   = "SCSM API Integration"
  $comment[$commentClass, "Comment"].Value     = "✅ Email update added via automated script."

  $projection = Get-SCSMObjectProjection "System.WorkItem.Projection" -Filter "Id -eq '$TicketId'"
  $projection.__base.Add($attachment, $attachmentRelClass.Target)
  $projection.__base.Commit()

   $proj = Get-SCSMObjectProjection "System.WorkItem.Projection" -Filter "Id -eq '$TicketId'"
    $proj.__base.Add($comment, $relClass.Target)
    $proj.__base.Commit()  

  @{ success = $true } | ConvertTo-Json -Compress
}
catch {
  @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}