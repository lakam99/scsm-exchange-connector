param (
    [string]$Title,
    [string]$Description,
    [string]$affectedUserId = "3c7570be-70c3-498e-724e-b6a7e4649c11",
    [string]$templateName = "Post Awards Reconciliation Template SRQ"
)

Import-Module SMLets
Import-Module "D:\Program Files\Microsoft System Center\Service Manager\Powershell\System.Center.Service.Manager.psd1"

# Get SR class
$srClass = Get-SCSMClass -Name "System.WorkItem.ServiceRequest"

# Load template
$template = Get-SCSMObjectTemplate -DisplayName $templateName
if (-not $template) {
    throw "Template '$templateName' not found."
}

# 🔧 Helper to extract property name from path
function Get-PropertyNameFromPath {
    param([string]$path)
    $path -replace '^.+/','' -replace '\$$',''
}

# 🔧 Helper to resolve enum values from MPElement
function Resolve-EnumValue {
    param ([string]$element)
    if ($element -like '$MPElement*') {
        if ($element -match "Name='([^']+)'") {
            $enumName = $matches[1].Split('!')[1]
            $enum = Get-SCSMEnumeration -Name $enumName
            return $enum.DisplayName
        }
    }
    return $element
}

# Build property hash dynamically from template
$propertyHash = @{
    Title = $Title
    Description = $Description
    Id = "SRQ{0}"
}

for ($i = 0; $i -lt $template.PropertyCollection.Path.Count; $i++) {
    $propName = Get-PropertyNameFromPath $template.PropertyCollection.Path[$i]

    # Skip Title if already provided
    if ($propName -eq "Title" -and -not [string]::IsNullOrWhiteSpace($Title)) { continue }

    # Skip Description if already provided
    if ($propName -eq "Description" -and -not [string]::IsNullOrWhiteSpace($Description)) { continue }

    $rawValue = $template.PropertyCollection.MixedValue[$i]
    $resolvedValue = Resolve-EnumValue $rawValue
    $propertyHash[$propName] = $resolvedValue
}


# 🛠️ Create the SR with dynamic properties
$newSR = New-SCSMObject -Class $srClass -PropertyHashtable $propertyHash -PassThru

# Link affected user if provided
if ($affectedUserId) {
    $affectedUser = Get-SCSMObject -Id ([Guid]$affectedUserId)
    if ($affectedUser) {
        $relationship = Get-SCSMRelationshipClass -Name "System.WorkItemAffectedUser"
        New-SCSMRelationshipObject -Source $newSR -Target $affectedUser -Relationship $relationship -Bulk
    }
}

# Output result
@{
    Id    = $newSR.Id
    Title = $newSR.Title
} | ConvertTo-Json -Compress
