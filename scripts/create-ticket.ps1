param (
    [string]$Title,
    [string]$Description,
    [string]$affectedUserId = "3c7570be-70c3-498e-724e-b6a7e4649c11",
    [string]$templateName = "Post Awards Reconciliation Template SRQ",

    # Email-specific parameters from Graph API object
    [string]$EmailSubject    = "emailsub",
    [string]$EmailBodyHtml   = "emailsubhtml",
    [string]$EmailMimePath = "./../tests/temp/test-1744750233801.eml",
    [string]$EmailFrom       = "yaseen.choukri@outlook.ca",
    [string]$ConversationId  = ""
)

cd $PSScriptRoot

# --- Import Modules ---
Import-Module SMLets 2>$null
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\PowerShell\System.Center.Service.Manager.psd1" 2>$null

# --- Helper Functions ---

# Extract the friendly property name from a template path
function Get-PropertyNameFromPath {
    param ([string]$path)
    return $path -replace '^.+/', '' -replace '\$$', ''
}

# Resolve enum values from an $MPElement reference by extracting the Name
function Resolve-EnumValue {
    param ([string]$element)
    if ($element -like '$MPElement*') {
        if ($element -match "Name='([^']+)'") {
            # Split on '!' to get the enum name and resolve display value
            $enumName = $matches[1].Split('!')[1]
            $enum = Get-SCSMEnumeration -Name $enumName
            return $enum.DisplayName
        }
    }
    return $element
}

# Dynamically build the property hash using the template.
# If Title/Description are provided as parameters, skip them from the template.
function Build-PropertyHashFromTemplate {
    param (
        [object]$template,
        [string]$Title,
        [string]$Description
    )
    $hash = @{
        Title       = $Title
        Description = $Description
        Id          = 'SRQ{0}'
    }
    for ($i = 0; $i -lt $template.PropertyCollection.Path.Count; $i++) {
        $propName = Get-PropertyNameFromPath $template.PropertyCollection.Path[$i]
        # Skip Title/Description if already provided
        if (($propName -eq "Title" -and -not [string]::IsNullOrWhiteSpace($Title)) -or
            ($propName -eq "Description" -and -not [string]::IsNullOrWhiteSpace($Description))) {
            continue
        }
        $rawValue = $template.PropertyCollection.MixedValue[$i]
        $hash[$propName] = Resolve-EnumValue $rawValue
    }
    return $hash
}

# Create a new work item (SR) from the given template and properties.
function Create-WorkItemFromTemplate {
    param (
        [object]$srClass,
        [object]$template,
        [string]$Title,
        [string]$Description
    )
    $propertyHash = Build-PropertyHashFromTemplate $template $Title $Description
    return New-SCSMObject -Class $srClass -PropertyHashtable $propertyHash -PassThru
}

# Attach the Graph email HTML to the work item using the out-of-the-box SCSM approach.
function Attach-EmailToWorkItem {
    param (
        [object]$workItem,
        [string]$EmailSubject,
        [string]$EmailMimePath,     # <-- full .eml MIME
        [string]$EmailFrom,
        [string]$ConversationId
    )

    if (-not $EmailMimePath) { return }

    # Get class and relationship definitions
    $fileAttachmentClass = Get-SCSMClass -Name "System.FileAttachment"
    $attachmentRelClass  = Get-SCSMRelationshipClass -Name "System.WorkItemHasFileAttachment"

    # Management group
    if (-not $ManagementGroup) {
        $ManagementGroup = New-Object Microsoft.EnterpriseManagement.EnterpriseManagementGroup "localhost"
    }

    # Convert MIME content to byte stream
    # Read MIME content from file
    $absolutePath = Resolve-Path -Path $EmailMimePath -ErrorAction Stop
    $emlBytes = [System.IO.File]::ReadAllBytes($absolutePath)
    $stream   = New-Object System.IO.MemoryStream
    $stream.Write($emlBytes, 0, $emlBytes.Length)
    $stream.Seek(0, 'Begin') | Out-Null


    # Create attachment object
    $attachment = New-Object Microsoft.EnterpriseManagement.Common.CreatableEnterpriseManagementObject($ManagementGroup, $fileAttachmentClass)

    $attachment.Item($fileAttachmentClass, "Id").Value          = [Guid]::NewGuid().ToString()
    $attachment.Item($fileAttachmentClass, "DisplayName").Value = if ($EmailSubject) { "$EmailSubject.eml" } else { "GraphEmail.eml" }
    $attachment.Item($fileAttachmentClass, "Extension").Value   = ".eml"
    $attachment.Item($fileAttachmentClass, "Size").Value        = $emlBytes.Length
    $attachment.Item($fileAttachmentClass, "AddedDate").Value   = (Get-Date).ToUniversalTime()
    $attachment.Item($fileAttachmentClass, "Content").Value     = $stream

    # Store the conversation/thread ID for later tracking
    if ($ConversationId) {
        $attachment.Item($fileAttachmentClass, "Description").Value = "ExchangeConversationID:$ConversationId;"
    } else {
        $attachment.Item($fileAttachmentClass, "Description").Value = "Attached email from $EmailFrom"
    }

    # Link to work item
    $WorkItemProjection = Get-SCSMObjectProjection "System.WorkItem.Projection" -Filter "id -eq '$($workItem.Id)'"
    $WorkItemProjection.__base.Add($attachment, $attachmentRelClass.Target)
    $WorkItemProjection.__base.Commit()
}

# --- Main Process ---

# Retrieve the Service Request class and template
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"
$template = Get-SCSMObjectTemplate -DisplayName $templateName
if (-not $template) {
    throw "Template '$templateName' not found."
}

# Create the new work item (SR) using the template
$newSR = Create-WorkItemFromTemplate $srClass $template $Title $Description

# Link the affected user (if provided)
if ($affectedUserId) {
    $affectedUser = Get-SCSMObject -Id ([Guid]$affectedUserId)
    if ($affectedUser) {
        $relationship = Get-SCSMRelationshipClass -Name "System.WorkItemAffectedUser"
        New-SCSMRelationshipObject -Source $newSR -Target $affectedUser -Relationship $relationship -Bulk
    }
}

# Attach the Graph email HTML to the new work item (including the thread/conversation ID)
Attach-EmailToWorkItem `
    -workItem $newSR `
    -EmailSubject $EmailSubject `
    -EmailMimePath $EmailMimePath `
    -EmailFrom $EmailFrom `
    -ConversationId $ConversationId


# Output a summary of the new work item as JSON
@{
    Id    = $newSR.Id
    Title = $newSR.Title
} | ConvertTo-Json -Compress
