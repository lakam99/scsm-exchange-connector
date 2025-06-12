param(
  [string]$Id,
  [string]$emailPath
)

Import-Module SMLets
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest$"
$ticket = Get-SCSMObject -Class $srClass -Filter "DisplayName -Like '$Id*'"

$fileAttachmentClass = Get-SCSMClass -Name "System.FileAttachment"
$relClass = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"

# Management group
if (-not $ManagementGroup) {
    $ManagementGroup = New-Object Microsoft.EnterpriseManagement.EnterpriseManagementGroup "localhost"
}

$absolutePath = Resolve-Path -Path $emailPath -ErrorAction Stop
$emlBytes = [System.IO.File]::ReadAllBytes($absolutePath)
$stream   = New-Object System.IO.MemoryStream
$stream.Write($emlBytes, 0, $emlBytes.Length)
$stream.Seek(0, 'Begin') | Out-Null

$attachment = New-Object Microsoft.EnterpriseManagement.Common.CreatableEnterpriseManagementObject($ManagementGroup, $fileAttachmentClass)

$attachment.Item($fileAttachmentClass, "Id").Value          = [Guid]::NewGuid().ToString()
$attachment.Item($fileAttachmentClass, "DisplayName").Value = "CompletedNotification.eml"
$attachment.Item($fileAttachmentClass, "Extension").Value   = ".eml"
$attachment.Item($fileAttachmentClass, "Size").Value        = $emlBytes.Length
$attachment.Item($fileAttachmentClass, "AddedDate").Value   = (Get-Date).ToUniversalTime()
$attachment.Item($fileAttachmentClass, "Content").Value     = $stream

$projection = Get-SCSMObjectProjection -ProjectionName "System.WorkItem.Projection" -Filter "Id -eq '$($ticket.Id.ToLower())'"
$projection.__base.Add($attachment, $relClass.Target)
$projection.__base.Commit()

@{
    TicketId      = $ticket.Id
    AttachmentId  = $attachment.Item($fileAttachmentClass, "Id").Value
    DisplayName   = $attachment.Item($fileAttachmentClass, "DisplayName").Value
    Size          = $attachment.Item($fileAttachmentClass, "Size").Value
    AddedDate     = $attachment.Item($fileAttachmentClass, "AddedDate").Value
} | ConvertTo-Json -Compress

