param (
    [string]$Title,
    [string]$Description,
    [string]$affectedUserId,
    [string]$templateName
)

$p = @{ComputerName = 'ottansm1'}

# Get the template by display name
$template = Get-SCSMObjectTemplate -DisplayName $templateName @p

if (-not $template) {
    throw "Template '$templateName' not found."
}

# Create SR from the template
$newSR = New-SCSMObjectTemplate -Template $template -PassThru @p

# Optionally override fields from the template
$newSR.Title = $Title
$newSR.Description = $Description
Update-SCSMObject -SMObject $newSR @p

# Link affected user if provided
if ($affectedUserId) {
    $affectedUser = Get-SCSMObject -Id ([Guid]$affectedUserId)
    if ($affectedUser) {
        $relationship = Get-SCSMRelationshipClass -Name "System.WorkItemAffectedUser"
        New-SCSMRelationshipObject -Source $newSR -Target $affectedUser -Relationship $relationship @p
    }
}

# Return the new SR info
@{ newSRQ = $newSR.Id } | ConvertTo-Json -Compress