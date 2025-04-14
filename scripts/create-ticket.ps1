param (
    [string]$Title,
    [string]$Description,
    [string]$affectedUserId,
    [string]$templateName = "Post Awards Reconciliation Template SRQ"
)

Import-Module SMLets
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\Powershell\System.Center.Service.Manager.psd1"

# Get SRQ class
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

# Load template
$template = Get-SCSMObjectTemplate -DisplayName $templateName
if (-not $template) {
    throw "Template '$templateName' not found."
}

# Build property map from template
$propertyMap = @{}
$paths = $template.PropertyCollection.Path
$values = $template.PropertyCollection.MixedValue

for ($i = 0; $i -lt $paths.Count; $i++) {
    $parts = $paths[$i] -split '/'
    $name = $parts[-1].TrimEnd('$')
    $propertyMap[$name] = $values[$i]
}

# Function to resolve enum display name from $MPElement reference
function Resolve-EnumDisplayValue {
    param ([string]$elementRef)
    if ($elementRef -like '$MPElement*') {
        $enum = Get-SCSMEnumeration | Where-Object { $_.Id -eq $elementRef }
        return $enum.DisplayName
    }
    return $elementRef  # already a usable string (e.g. GUID or plain text)
}

# Resolve enum values
$priority = Resolve-EnumDisplayValue $propertyMap["Priority"]
$urgency = Resolve-EnumDisplayValue $propertyMap["Urgency"]

# Other values don't need resolution (e.g. GUIDs, strings)
$source       = $propertyMap["Source"]
$area         = $propertyMap["Area"]
$supportGroup = $propertyMap["SupportGroup"]

# Create the new SRQ
$newSR = New-SCSMObject -Class $srClass -PropertyHashtable @{
    Title        = $Title
    Description  = $Description
    Priority     = $priority
    Urgency      = $urgency
    Source       = $source
    Area         = $area
    SupportGroup = $supportGroup
}

# Link affected user
if ($affectedUserId) {
    $affectedUser = Get-SCSMObject -Id ([Guid]$affectedUserId)
    if ($affectedUser) {
        $relationship = Get-SCSMRelationshipClass -Name "System.WorkItemAffectedUser"
        New-SCSMRelationshipObject -Source $newSR -Target $affectedUser -Relationship $relationship
    }
}

# Output
@{
    Id    = $newSR.Id
    Title = $newSR.Title
} | ConvertTo-Json -Compress
